"""
Seed data generator for testing and demonstration
Creates realistic network of individuals and contacts
"""
from backend.database import get_db
import random
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


class DataSeeder:
    """Generate realistic test data for PandemicNet"""

    def __init__(self):
        self.db = get_db()
        self.first_names = [
            "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
            "Iris", "Jack", "Kate", "Leo", "Maya", "Noah", "Olivia", "Peter",
            "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xavier",
            "Yara", "Zack", "Ava", "Ben", "Chloe", "David", "Emma", "Felix"
        ]

        self.locations = [
            "Butare", "Kigali", "Huye", "Musanze", "Rubavu", "Nyanza",
            "Muhanga", "Karongi", "Nyagatare", "Rwamagana"
        ]

        self.venues = [
            ("cafe1", "Coffee Shop", "Butare", "restaurant"),
            ("gym1", "Fitness Center", "Kigali", "gym"),
            ("office1", "Tech Hub", "Kigali", "office"),
            ("market1", "Central Market", "Huye", "market"),
            ("church1", "Community Center", "Butare", "community"),
            ("school1", "University", "Huye", "education"),
            ("restaurant1", "Local Restaurant", "Kigali", "restaurant"),
            ("mall1", "Shopping Mall", "Kigali", "retail")
        ]

        self.proximities = ["close", "medium", "far"]

    def generate_individuals(self, count: int = 50):
        """Generate random individuals"""
        logger.info(f"🌱 Generating {count} individuals...")

        individuals = []
        used_names = set()

        for i in range(count):
            # Create unique ID
            name = random.choice(self.first_names)
            suffix = i
            unique_id = f"{name.lower()}{suffix}"

            while unique_id in used_names:
                suffix += 1
                unique_id = f"{name.lower()}{suffix}"

            used_names.add(unique_id)

            phone = f"078{random.randint(1000000, 9999999)}"
            location = random.choice(self.locations)

            query = """
                        MERGE (i:Individual {unique_id: $unique_id})
                        ON CREATE SET 
                            i.phone_number = $phone,
                            i.location = $location,
                            i.infected = false,
                            i.created_at = datetime()
                        RETURN i.unique_id as unique_id
                        """

            result = self.db.execute_write(query, {
                "unique_id": unique_id,
                "phone": phone,
                "location": location,
            })

            if result:
                individuals.append(unique_id)

        logger.info(f"✅ Created {len(individuals)} individuals.")
        return individuals

    def generate_venues(self):
        """Generate venue nodes"""
        logger.info("🌱 Generating venues...")

        for venue_id, name, location, venue_type in self.venues:
            query = """
                        MERGE (v:Venue {venue_id: $venue_id})
                        SET v.name = $name,
                            v.location = $location,
                            v.venue_type = $venue_type,
                            v.created_at = datetime()
                        RETURN v.venue_id as venue_id
                        """

            self.db.execute_write(query, {
                "venue_id": venue_id,
                "name": name,
                "location": location,
                "venue_type": venue_type,
            })

        logger.info(f"✅ Created {len(self.venues)} venues.")

    def generate_contacts(self, individuals: list, contacts_per_person: int = 8):
        """Generate realistic contact networks"""
        logger.info(f"🌱 Generating contacts (avg {contacts_per_person} per person)...")

        contact_count = 0
        today = date.today()

        for person in individuals:
            # Random number of contacts (following normal distribution)
            num_contacts = max(1, int(random.gauss(contacts_per_person, 3)))
            num_contacts = min(num_contacts, len(individuals) - 1)

            # Select random contacts (excluding self)
            possible_contacts = [p for p in individuals if p != person]
            contacts = random.sample(possible_contacts, min(num_contacts, len(possible_contacts)))

            for contact in contacts:
                # Random date in last 30 days
                days_ago = random.randint(0, 30)
                contact_date = today - timedelta(days=days_ago)

                # Random venue
                venue = random.choice(self.venues)[0] if random.random() > 0.3 else None

                # Random duration (5-240 minutes)
                duration = random.choice([15, 30, 45, 60, 90, 120, 180])

                # Random proximity (weighted toward medium)
                proximity = random.choices(
                    self.proximities,
                    weights=[0.3, 0.5, 0.2]
                )[0]

                query = """
                                MATCH (i1:Individual {unique_id: $id1})
                                MATCH (i2:Individual {unique_id: $id2})
                                MERGE (i1)-[r:MET_AT {contact_date: date($contact_date)}]-(i2)
                                SET r.venue_id = $venue,
                                    r.duration_minutes = $duration,
                                    r.proximity = $proximity,
                                    r.created_at = datetime()
                                RETURN r
                                """

                try:
                    self.db.execute_write(query, {
                        "id1": person,
                        "id2": contact,
                        "contact_date": str(contact_date),
                        "venue": venue,
                        "duration": duration,
                        "proximity": proximity,
                    })
                    contact_count += 1
                except Exception as e:
                    logger.warning(f"Failed to create contact: {e}")

        logger.info(f"✅ Created {contact_count} contacts")
        return contact_count

    def infect_random_individuals(self, individuals: list, infection_rate: float = 0.15):
        """Infect a percentage of individuals"""
        num_infected = max(1, int(len(individuals) * infection_rate))
        infected = random.sample(individuals, num_infected)

        logger.info(f"🌱 Infecting {num_infected} individuals ({infection_rate:.0%})...")

        today = date.today()

        for person in infected:
            # Random infection date in last 14 days
            days_ago = random.randint(0, 14)
            infection_date = today - timedelta(days=days_ago)

            severity = random.choices(
                ["mild", "moderate", "severe"],
                weights=[0.6, 0.3, 0.1]
            )[0]

            symptoms = random.sample(
                ["fever", "cough", "fatigue", "headache", "loss_of_taste"],
                k=random.randint(2, 4)
            )

            query = """
                        MATCH (p:Individual {unique_id: $unique_id})
                        SET p.infected = true,
                            p.infection_date = date($infection_date),
                            p.severity = $severity,
                            p.symptoms = $symptoms,
                            p.updated_at = datetime()
                        RETURN p.unique_id as unique_id
                        """

            self.db.execute_write(query, {
                "unique_id": person,
                "infection_date": str(infection_date),
                "severity": severity,
                "symptoms": symptoms,
            })

        logger.info(f"✅ Infected {num_infected} individuals")
        return infected

    def seed_all(self, num_individuals: int = 50, contacts_per_person: int = 8):
        """Run complete seeding process"""
        logger.info("🌱 Starting data seeding...")

        # Generate venues
        self.generate_venues()

        #         Generate individuals
        individuals = self.generate_individuals(num_individuals)

        #         Generate contacts
        self.generate_contacts(individuals, contacts_per_person)

        #         Infect some individuals
        infected = self.infect_random_individuals(individuals)

        logger.info("✅ Data seeding complete!")

        return {
            "individuals": len(individuals),
            "infected": len(infected),
            "message": "Seed data generated successfully",
        }


def seed_database(num_individuals: int = 50):
    """Convenience function to seed database"""
    seeder = DataSeeder()
    return seeder.seed_all(num_individuals=num_individuals)
