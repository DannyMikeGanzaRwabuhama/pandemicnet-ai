"""
Contact Agent - Generates realistic contact patterns
Creates contacts between individuals based on location and behavior
"""
import random
from datetime import datetime
import logging
from agents.state import SimulationState
from agents.config import get_agent_config
from agents.tools.api_tools import api_tools

logger = logging.getLogger(__name__)
config = get_agent_config()


class ContactAgent:
    """
    Creates realistic contact networks
    - Location-based contacts (same city)
    - Social clustering (friends of friends)
    - Random encounters
    """

    def __init__(self):
        self.avg_contacts = config.avg_daily_contacts
        self.std_dev = config.contact_std_dev
        self.proximity_dist = config.proximity_distribution
        self.duration_range = config.contact_duration_range

    def _generate_contact_count(self) -> int:
        """Generate random number of contacts for a person"""
        count = int(random.gauss(self.avg_contacts, self.std_dev))
        return max(0, min(count, 10))  # Cap at 10 contacts per day

    def _generate_proximity(self) -> str:
        """Generate random proximity level"""
        rand = random.random()
        cumulative = 0

        for proximity, prob in self.proximity_dist.items():
            cumulative += prob
            if rand <= cumulative:
                return proximity

        return "medium"

    def _generate_duration(self) -> int:
        """Generate random contact duration in minutes"""
        return random.randint(*self.duration_range)

    async def __call__(self, state: SimulationState) -> SimulationState:
        """
        Main agent function - called by LangGraph
        """
        logger.info(f"🤝 Contact Agent: Day {state['simulation_day']}")

        try:
            # Get all individuals
            individuals = await api_tools.list_individuals(limit=1000)

            if len(individuals) < 2:
                state["messages"].append("Not enough individuals for contacts")
                return state

            # Group by location for realistic clustering
            location_groups = {}
            for person in individuals:
                location = person.get('location', 'Unknown')
                if location not in location_groups:
                    location_groups[location] = []
                location_groups[location].append(person)

            contacts_created = 0
            current_date = state['current_date'].isoformat()

            # Create contacts within location groups
            for location, people in location_groups.items():
                if len(people) < 2:
                    continue

                # Each person makes contacts
                for person in people:
                    unique_id = person['unique_id']

                    # Skip if quarantined
                    if unique_id in state.get('quarantined', []):
                        continue

                    # Determine number of contacts
                    num_contacts = self._generate_contact_count()

                    # Select random contacts from same location
                    available_contacts = [
                        p for p in people
                        if p['unique_id'] != unique_id
                           and p['unique_id'] not in state.get('quarantined', [])
                    ]

                    if not available_contacts:
                        continue

                    # Sample contacts (avoid duplicates)
                    selected_contacts = random.sample(
                        available_contacts,
                        min(num_contacts, len(available_contacts))
                    )

                    # Create each contact
                    for contact_person in selected_contacts:
                        proximity = self._generate_proximity()
                        duration = self._generate_duration()

                        result = await api_tools.create_contact(
                            individual_id=unique_id,
                            contact_id=contact_person['unique_id'],
                            contact_date=current_date,
                            proximity=proximity,
                            duration_minutes=duration,
                            venue_id=f"venue{location.lower()}"
                        )

                        if 'error' not in result:
                            contacts_created += 1

                            # Log contact
                            state["logs"].append({
                                "timestamp": datetime.now().isoformat(),
                                "event": "contact",
                                "individual1": unique_id,
                                "individual2": contact_person['unique_id'],
                                "location": location,
                                "proximity": proximity,
                                "duration": duration,
                            })

            # Update state
            state["contacts_created_today"] = contacts_created
            state["total_contacts"] = state.get("total_contacts", 0)
            state["messages"].append(
                f"Contact Agent: Created {contacts_created} nre contacts"
            )

            logger.info(f"✅ Created {contacts_created} contacts")

        except Exception as e:
            error_msg = f"Contact Agent error: {str(e)}"
            logger.error(error_msg)
            state["errors"].append(error_msg)

        return state


# Create agent instance
contact_agent = ContactAgent()
