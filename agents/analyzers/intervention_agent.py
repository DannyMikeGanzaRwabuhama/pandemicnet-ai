"""
Intervention Agent - Automated public health responses
Implements interventions like quarantine, testing, contact tracing
"""
import logging
from datetime import datetime
from agents.state import SimulationState
from agents.config import get_agent_config
from agents.tools.api_tools import api_tools

logger = logging.getLogger(__name__)
config = get_agent_config()


class InterventionAgent:
    """
    Implements public health interventions
    - Quarantine high-risk individuals
    - Priority testing
    - Contact tracing
    - Resource allocation
    """

    def __init__(self):
        self.enabled = config.enable_auto_interventions
        self.testing_capacity = config.testing_capacity
        self.quarantine_duration = config.quarantine_duration_days
        self.high_risk_threshold = config.high_risk_threshold

    async def _identify_high_risk_individuals(self):
        """
        Find individuals at high risk of infection
        """
        high_risk = []

        # Get all non-infected individuals
        individuals = await api_tools.list_individuals(limit=1000)

        for person in individuals:
            if person['infected']:
                continue

            unique_id = person['unique_id']

            # Calculate risk score
            risk_data = await api_tools.get_risk(unique_id)

            if 'error' not in risk_data:
                risk_score = risk_data.get('risk_score', 0.0)

                if risk_score >= self.high_risk_threshold:
                    high_risk.append({
                        'unique_id': unique_id,
                        'risk_score': risk_score,
                        'risk_level': risk_data.get('risk_level'),
                        'exposed_contacts': risk_data.get('exposed_contacts', 0)
                    })

        # Sort by risk score
        high_risk.sort(key=lambda x: x['risk_score'], reverse=True)

        return high_risk

    async def _implement_quarantine(self,
                                    individuals: list,
                                    state: SimulationState) -> int:
        """
        Quarantine high-risk individuals
        """
        quarantined_count = 0

        for person in individuals:
            unique_id = person['unique_id']

            # Add to quarantine list
            if unique_id not in state.get('quarantined', []):
                state["quarantined"].append(unique_id)
                quarantined_count += 1

                # Log intervention
                state["logs"].append({
                    "timestamp": datetime.now().isoformat(),
                    "event": "quarantine",
                    "individual": unique_id,
                    "risk_score": person['risk_score'],
                    "duration_days": self.quarantine_duration
                })

                logger.warning(
                    f"🔒 Quarantined: {unique_id} "
                    f"(risk={person['risk_score']:.2%})"
                )

        return quarantined_count

    async def _prioritize_testing(self, state: SimulationState) -> int:
        """
        Prioritize testing for high-risk individuals
        """
        # Get individuals to test (not already tested today)
        high_risk = state.get('high_risk_individuals', [])
        tested_today = state.get('tested_today', [])

        to_test = [
            p for p in high_risk
            if p['unique_id'] not in tested_today
        ][:self.testing_capacity]

        tested_count = 0

        for person in to_test:
            unique_id = person['unique_id']
            state["tested_today"].append(unique_id)
            tested_count += 1

            # Log testing
            state["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "event": "testing",
                "individual": unique_id,
                "risk_score": person['risk_score']
            })

        return tested_count

    @staticmethod
    async def _trace_and_isolate(infected_individuals: list, state: SimulationState) -> int:
        """
        Contact trace infected individuals and isolate contacts
        """
        isolated_count = 0

        for infected_id in infected_individuals:
            # Get direct contacts
            contacts = await api_tools.get_direct_contacts(
                infected_id,
                days=14
            )

            for contact in contacts:
                contact_id = contact['contact_id']

                # Quarantine if not already
                if contact_id not in state.get('quarantined', []):
                    state["quarantined"].append(contact_id)
                    isolated_count += 1

                    logger.info(f"🔒 Isolated contact: {contact_id}")

        return isolated_count

    async def __call__(self, state: SimulationState) -> SimulationState:
        """
        Main agent function - called by LangGraph
        """
        logger.info(f"🚨 Intervention Agent: Day {state['simulation_day']}")

        if not self.enabled:
            state["messages"].append("Interventions disabled")
            return state

        try:
            interventions_applied = []

            # 1. Identify high-risk individuals
            high_risk = await self._identify_high_risk_individuals()
            state["high_risk_individuals"] = high_risk

            logger.info(f"Identified {len(high_risk)} high-risk individuals")

            # 2. Implement quarantine if outbreak detected or high-risk present
            if state.get('outbreak_detected') or len(high_risk) > 5:
                quarantined = await self._implement_quarantine(
                    high_risk[:20],  # Top 20 highest risk
                    state
                )

                if quarantined > 0:
                    interventions_applied.append({
                        "type": "quarantine",
                        "count": quarantined,
                        "reason": "High risk / outbreak"
                    })

            # 3. Contact tracing for newly infected
            newly_infected = state.get('newly_infected', [])
            if newly_infected:
                isolated = await self._trace_and_isolate(
                    newly_infected,
                    state
                )

                if isolated > 0:
                    interventions_applied.append({
                        "type": "contact_tracing",
                        "count": isolated,
                        "reason": "Direct contact with infected"
                    })

            # 4. Priority testing
            tested = await self._prioritize_testing(state)

            if tested > 0:
                interventions_applied.append({
                    "type": "testing",
                    "count": tested,
                    "reason": "High-risk screening"
                })

            # Update state
            state["interventions_active"] = interventions_applied

            total_interventions = sum(i['count'] for i in interventions_applied)
            state["messages"].append(
                f"Intervention Agent: {total_interventions} interventions applied"
            )

            # Generate alerts
            if state.get('outbreak_detected'):
                state["alerts"].append(
                    "🚨 Emergency interventions activated: "
                    f"{len(state['quarantined'])} quarantined, "
                    f"{len(state['tested_today'])} tested"
                )

                logger.info(f"✅ Applied {total_interventions} interventions")

        except Exception as e:
            error_msg = f"Intervention Agent error: {str(e)}"
            logger.error(error_msg)
            state["errors"].append(error_msg)

        return state


# Create agent instance
intervention_agent = InterventionAgent()
