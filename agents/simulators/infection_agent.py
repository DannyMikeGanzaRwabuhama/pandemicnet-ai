"""
Infection Agent - Simulates disease spread
Spreads infections through contact networks based on epidemiological models
"""
import random
from datetime import datetime
import logging
from agents.state import SimulationState
from agents.config import get_agent_config
from agents.tools.api_tools import api_tools

logger = logging.getLogger(__name__)
config = get_agent_config()


class InfectionAgent:
    """
    Simulates infection spread through contact networks
    - Probability-based transmission
    - Proximity affects transmission rate
    - Incubation and infectious periods
    """

    def __init__(self):
        self.base_rate = config.base_infection_rate
        self.incubation_factors = config.infection_factors
        self.infectious_period = config.infectious_period_days
        self.incubation_period = config.incubation_period_days

    def _calculate_infection_probability(self, proximity: str, duration: int) -> float:
        """
        Calculate infection probability based on contact characteristics
        """
        # Base rate multiplied by proximity factor
        proximity_factor = self.incubation_factors.get(proximity, 1.0)
        base_prob = self.base_rate * proximity_factor

        # Duration multiplier (longer contact = higher risk)
        duration_factor = min(duration / 60.0, 2.0)  # Cap at 2x for 60+ minutes

        final_prob = base_prob * duration_factor

        # Cap at 90% max
        return min(final_prob, 0.9)

    async def __call__(self, state: SimulationState) -> SimulationState:
        """
                Main agent function - called by LangGraph
                """
        logger.info(f"🦠 Infection Agent: Day {state['simulation_day']}")

        try:
            # Get all infected individuals
            infected_individuals = await api_tools.list_individuals(
                limit=1000,
                infected_only=True
            )

            if not infected_individuals:
                state["messages"].append("No infected individuals to spread from")
                return state

            newly_infected = []
            current_date = state['current_date']

            # For each infected person
            for infected_person in infected_individuals:
                infected_id = infected_person['unique_id']

                # Get their recent contacts (last 14 days)
                contacts = await api_tools.get_direct_contacts(
                    infected_id,
                    days=self.infectious_period
                )

                # Check each contact for potential transmission
                for contact in contacts:
                    contact_id = contact['unique_id']

                    # Skip if already infected
                    if contact.get('contact_infected'):
                        continue

                    # Skip if quarantined
                    if contact_id in state.get('quarantined', []):
                        continue

                    # Calculate infection probability
                    proximity = contact.get('proximity', 'medium')
                    duration = contact.get('duration_minutes', 30)

                    infection_prob = self._calculate_infection_probability(
                        proximity,
                        duration
                    )

                    # Roll the dice
                    if random.random() < infection_prob:
                        # Infection occurs!
                        infection_date = current_date.isoformat()

                        # Randomly assign severity
                        severity = random.choices(
                            ['mild', 'moderate', 'severe'],
                            weights=[0.6, 0.3, 0.1]
                        )[0]

                        # Report infection
                        result = await api_tools.report_infection(
                            unique_id=contact_id,
                            infection_date=infection_date,
                            severity=severity,
                        )

                        if 'error' not in result:
                            newly_infected.append(contact_id)

                            # Log infection
                            state["logs"].append({
                                "timestamp": datetime.now().isoformat(),
                                "event": "infection",
                                "infected": contact_id,
                                "source": infected_id,
                                "probability": infection_prob,
                                "severity": severity,
                                "contact_date": contact['contact_date']
                            })

                            logger.warning(
                                f"⚠️ New infection: {contact_id} "
                                f"(from {infected_id}, p={infection_prob:.2%})"
                            )

            # Update state
            state["newly_infected"] = newly_infected
            state["total_infected"] = state.get("total_infected", 0) + len(newly_infected)
            state["active_infections"] = state.get("active_infections", 0) + newly_infected

            state["messages"].append(
                f"Infection Agent: {len(newly_infected)} new infections"
            )

            # Check for outbreak
            if len(newly_infected) >= config.outbreak_threshold:
                state["outbreak_detected"] = True
                state["alerts"].append(
                    f"🚨 OUTBREAK DETECTED: {len(newly_infected)} new cases in one day!"
                )
                logger.error(f"🚨 OUTBREAK: {len(newly_infected)} cases")

            logger.info(f"✅ Processed infections: {len(newly_infected)} new cases")

        except Exception as e:
            error_msg = f"Infection Agent error: {str(e)}"
            logger.error(error_msg)
            state["errors"].append(error_msg)

        return state


# Create agent instance
infection_agent = InfectionAgent()
