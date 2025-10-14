"""
LangGraph Orchestrator - The Brain of Agent System
Coordinates all agents in a structured workflow
"""
import logging
from datetime import datetime, timedelta, date
from typing import Literal
from langgraph.graph import StateGraph, END
from agents.state import SimulationState, create_initial_simulation_state
from agents.simulators.movement_agent import movement_agent
from agents.simulators.contact_agent import contact_agent
from agents.simulators.infection_agent import infection_agent
from agents.analyzers.outbreak_agent import analysis_agent
from agents.analyzers.intervention_agent import intervention_agent
from agents.analyzers.report_agent import report_agent
from agents.config import get_agent_config

logger = logging.getLogger(__name__)
config = get_agent_config()


class PandemicNetOrchestrator:
    """
    Main orchestrator for agent-based simulation
    Uses LangGraph to coordinate multi-agent workflow
    """

    def __init__(self):
        self.config = config
        self.workflow = self._build_workflow()
        self.app = self.workflow.compile()
        logger.info("✅ Agent orchestrator initialized")

    @staticmethod
    def _should_intervene(state: SimulationState) -> Literal["intervene", "skip"]:
        """
        Decision function: Should we run intervention agent?
        """
        # Intervene if outbreak detected OR high-risk individuals present
        if state.get('outbreak_detected'):
            return "intervene"

        if len(state.get('high_risk_individuals', [])) > 5:
            return "intervene"

        return "skip"

    def _build_workflow(self) -> StateGraph:
        """
        Build the LangGraph workflow

        Workflow structure:
        START -> Movement -> Contact -> Infection -> Analysis
            -> [Decision] -> Intervention (conditional) -> Report -> END
        """
        # Create workflow graph
        workflow = StateGraph(SimulationState)

        # Add agent nodes
        workflow.add_node("movement", movement_agent)
        workflow.add_node("contact", contact_agent)
        workflow.add_node("infection", infection_agent)
        workflow.add_node("analysis", analysis_agent)
        workflow.add_node("intervention", intervention_agent)
        workflow.add_node("report", report_agent)

        # Define edges (workflow flow)
        workflow.set_entry_point("movement")
        workflow.add_edge("movement", "contact")
        workflow.add_edge("contact", "infection")
        workflow.add_edge("infection", "analysis")

        # Conditional edge: intervene or skip
        workflow.add_conditional_edges(
            "analysis",
            self._should_intervene,
            {
                "intervene": "intervention",
                "skip": "report"
            }
        )

        workflow.add_edge("intervention", "report")
        workflow.add_edge("report", END)

        logger.info("✅ Workflow graph built")

        return workflow

    async def run_single_day(self,
                             simulation_day: int,
                             current_date: date) -> SimulationState:
        """
        Run simulation for a single day
        """
        logger.info(f"🚀 Running simulation: Day {simulation_day} ({current_date})")

        start_time = datetime.now()

        # Create initial state
        initial_state = create_initial_simulation_state(current_date)
        initial_state['simulation_day'] = simulation_day
        initial_state['current_date'] = current_date

        # Run workflow
        try:
            final_state = await self.app.ainvoke(initial_state)

            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds()
            final_state['execution_time'] = execution_time

            logger.info(
                f"✅ Day {simulation_day} complete in {execution_time:.2f}s"
            )

            return final_state

        except Exception as e:
            logger.error(f"❌ Simulation failed: {e}")
            raise

    async def run_simulation(self,
                             days: int = None,
                             start_date: date = None):
        """
        Run full multi-day simulation
        """
        if days is None:
            days = self.config.simulation_days

        if start_date is None:
            start_date = date.today()

        logger.info(f"🚀 Starting {days}-day simulation from {start_date}")

        all_results = []

        for day in range(days):
            current_date = start_date + timedelta(days=day)

            result = await self.run_single_day(day + 1, current_date)
            all_results.append(result)

            # Check for critical errors
            if result.get('errors'):
                logger.warning(f"⚠️ Day {day + 1} had errors: {result['errors']}")

            # Emergency stop if outbreak out of control
            if result.get('total_infected', 0) > result.get('total_individuals', 0) * 0.8:
                logger.error("🚨 SIMULATION HALTED: 80%+ infection rate")
                break

        logger.info(f"✅ Simulation complete: {len(all_results)} days processed")

        return all_results

    @staticmethod
    def get_workflow_diagram() -> str:
        """
        Get ASCII diagram of workflow
        """
        return """
        ┌─────────────────────────────────────────┐
        │      PANDEMICNET AGENT WORKFLOW         │
        └─────────────────────────────────────────┘

                        START
                          ↓
                   ┌──────────────┐
                   │   Movement   │
                   │    Agent     │
                   └──────┬───────┘
                          ↓
                   ┌──────────────┐
                   │   Contact    │
                   │    Agent     │
                   └──────┬───────┘
                          ↓
                   ┌──────────────┐
                   │  Infection   │
                   │    Agent     │
                   └──────┬───────┘
                          ↓
                   ┌──────────────┐
                   │   Analysis   │
                   │    Agent     │
                   └──────┬───────┘
                          ↓
                    Decision Point
                   /              \\
              Outbreak?        Normal?
                  ↓                ↓
           ┌──────────────┐   ┌──────────────┐
           │Intervention  │   │    Skip      │
           │   Agent      │   │              │
           └──────┬───────┘   └──────┬───────┘
                  └──────────┬────────┘
                             ↓
                      ┌──────────────┐
                      │    Report    │
                      │    Agent     │
                      └──────┬───────┘
                             ↓
                           END
        """


# Global orchestrator instance
orchestrator = PandemicNetOrchestrator()
