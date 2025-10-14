"""
Movement Agent - Simulates human movement patterns
Moves individuals between locations based on realistic behavior
"""
import random
import logging
from datetime import datetime
from agents.state import SimulationState
from agents.config import get_agent_config
from agents.tools.api_tools import api_tools

logger = logging.getLogger(__name__)
config = get_agent_config()


class MovementAgent:
    """
    Simulates realistic human movement patterns
    - Commuting patterns (work/home)
    - Social visits
    - Random travel
    """

    def __init__(self):
        self.locations = config.locations
        self.movement_probability = config.movement_probability

    async def __call__(self, state: SimulationState) -> SimulationState:
        """
        Main agent function - called by LangGraph
        """
        logger.info(f"🚶 Movement Agent: Day {state['simulation_day']}")

        try:
            # Get all active individuals
            individuals = await api_tools.list_individuals(limit=1000)

            if not individuals:
                state["messages"].append("No individuals to move")
                return state

            moved_count = 0

            # Process each individual
            for person in individuals:
                unique_id = person["unique_id"]
                current_location = person.get("location")

                # Decide if person moves today
                if random.random() < self.movement_probability:
                    # Choose new location (different from current)
                    available_locations = [
                        loc for loc in self.locations
                        if loc != current_location
                    ]

                    if available_locations:
                        new_location = random.choice(available_locations)

                        # Update via API
                        result = await api_tools.update_individual(
                            unique_id=unique_id,
                            location=new_location,
                            phone_number=person.get('phone_number')
                        )

                        if 'error' not in result:
                            moved_count += 1

                            # Log movement
                            state["logs"].append({
                                "timestamp": datetime.now().isoformat(),
                                "event": "movement",
                                "individual": unique_id,
                                "from": current_location,
                                "to": new_location,
                            })

            # Update state
            state["messages"].append(
                f"Movement Agent: {moved_count}/{len(individuals)} individuals moved"
            )

            logger.info(f"✅ Moved {moved_count} individuals")

        except Exception as e:
            error_msg = f"Movement Agent error: {str(e)}"
            logger.error(error_msg)
            state["errors"].append(error_msg)

        return state


# Create agent instance
movement_agent = MovementAgent()
