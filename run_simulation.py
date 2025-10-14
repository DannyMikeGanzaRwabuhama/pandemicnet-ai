"""
Main simulation runner script
Run this to start the agent-based simulation
"""
import asyncio
import logging
from datetime import date
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents.orchestrator import orchestrator
from agents.config import get_agent_config
from agents.tools.api_tools import api_tools

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/simulation.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


async def check_backend_connection():
    """Verify backend is running"""
    try:
        stats = await api_tools.get_network_statistics()
        if 'error' in stats:
            logger.error("❌ Backend not responding")
            return False
        logger.info("✅ Backend connected")
        return True
    except Exception as e:
        logger.error(f"❌ Backend connection failed: {e}")
        return False


async def initialize_population():
    """Create initial population if needed"""
    config = get_agent_config()

    individuals = await api_tools.list_individuals(limit=10)

    if len(individuals) < config.initial_population:
        logger.info(f"🌱 Creating initial population of {config.initial_population}")

        import requests
        response = requests.post(
            f"{config.api_base_url}/seed",
            params={"num_individuals": config.initial_population}
        )

        if response.status_code == 200:
            logger.info("✅ Initial population created")
        else:
            logger.error("❌ Failed to create population")
            return False

    return True


async def run_interactive():
    """Interactive mode - run day by day"""
    print("\n" + "=" * 60)
    print("🦠 PANDEMICNET AGENT SIMULATION - INTERACTIVE MODE")
    print("=" * 60)
    print(orchestrator.get_workflow_diagram())
    print("=" * 60 + "\n")

    config = get_agent_config()
    current_day = 1
    start_date = date.today()

    while True:
        print(f"\n📅 Day {current_day}")
        print("Options:")
        print("  [1] Run next day")
        print("  [2] Run 7 days")
        print("  [3] Run 30 days")
        print("  [4] Exit")

        choice = input("\nChoice: ").strip()

        if choice == "1":
            await orchestrator.run_single_day(current_day, start_date)
            current_day += 1
            start_date = start_date.replace(day=start_date.day + 1)

        elif choice == "2":
            results = await orchestrator.run_simulation(days=7, start_date=start_date)
            current_day += 7

        elif choice == "3":
            results = await orchestrator.run_simulation(days=30, start_date=start_date)
            current_day += 30

        elif choice == "4":
            print("\n👋 Simulation ended")
            break

        else:
            print("Invalid choice")


async def run_automated(days: int = 30):
    """Automated mode - run full simulation"""
    print("\n" + "=" * 60)
    print(f"🦠 PANDEMICNET AGENT SIMULATION - {days} DAYS")
    print("=" * 60)
    print(orchestrator.get_workflow_diagram())
    print("=" * 60 + "\n")

    results = await orchestrator.run_simulation(days=days)

    # Print final summary
    if results:
        final_state = results[-1]
        print("\n" + "=" * 60)
        print("📊 FINAL SIMULATION SUMMARY")
        print("=" * 60)
        print(f"Days Simulated: {len(results)}")
        print(f"Total Population: {final_state.get('total_individuals', 0):,}")
        print(f"Total Infections: {final_state.get('total_infected', 0)}")
        print(f"Final R Value: {final_state.get('r_value', 0):.2f}")
        print(f"Outbreaks Detected: {sum(1 for r in results if r.get('outbreak_detected'))}")
        print(f"Total Interventions: {sum(len(r.get('interventions_active', [])) for r in results)}")
        print("=" * 60 + "\n")


async def main():
    """Main entry point"""
    # Create logs directory
    Path('logs').mkdir(exist_ok=True)

    logger.info("🚀 Starting PandemicNet Agent Simulation")

    # Check backend
    if not await check_backend_connection():
        logger.error("❌ Please start the FastAPI backend first:")
        logger.error("   python -m backend.main")
        return

    # Initialize population
    if not await initialize_population():
        logger.error("❌ Failed to initialize population")
        return

    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--interactive":
            await run_interactive()
        elif sys.argv[1] == "--days":
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            await run_automated(days)
        else:
            print("Usage:")
            print("  python run_simulation.py --interactive   # Interactive mode")
            print("  python run_simulation.py --days 30       # Run 30 days")
    else:
        # Default: interactive mode
        await run_interactive()

    # Cleanup
    await api_tools.close()
    logger.info("✅ Simulation complete")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Simulation interrupted by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
