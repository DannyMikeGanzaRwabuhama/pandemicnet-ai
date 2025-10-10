"""
Neo4j database connection and initialization
Handles driver creation, session management, and schema setup
"""
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError
from typing import Optional
import logging

from backend.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Neo4jConnection:
    """Neo4j database connection manager"""

    def __init__(self):
        self.driver: Optional[GraphDatabase.driver] = None
        self._connect()

    def _connect(self):
        """Establish connection to Neo4j"""
        try:
            self.driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password)
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            logger.info(f"✅ Connected to Neo4j at {settings.neo4j_uri}")
        except AuthError:
            logger.error("❌ Neo4j authentication failed. Check credentials.")
            raise
        except ServiceUnavailable:
            logger.error("❌ Neo4j service unavailable. Is the database running?")
            raise
        except Exception as e:
            logger.error(f"❌ Failed to connect to Neo4j: {str(e)}")
            raise

    def close(self):
        """Close the database connection"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")

    def get_session(self):
        """Get a new database session"""
        return self.driver.session(database=settings.neo4j_database)

    def execute_query(self, query: str, parameters: dict = None):
        """Execute a single query and return results"""
        with self.get_session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]

    def execute_write(self, query: str, parameters: dict = None):
        """Execute a write transaction"""
        with self.get_session() as session:
            result = session.execute_write(
                lambda tx: tx.run(query, parameters or {}).data()
            )
            return result

    def initialize_schema(self):
        """Create indexes and constraints for optimal performance"""
        constraints_and_indexes = [
            # Unique constraints
            "CREATE CONSTRAINT unique_individual_id IF NOT EXISTS FOR (i:Individual) REQUIRE i.unique_id IS UNIQUE",
            "CREATE CONSTRAINT unique_venue_id IF NOT EXISTS FOR (v:Venue) REQUIRE v.venue_id IS UNIQUE",

            # Indexes for faster lookups
            "CREATE INDEX individual_infected IF NOT EXISTS FOR (i:Individual) ON (i.infected)",
            "CREATE INDEX contact_date IF NOT EXISTS FOR ()-[c:MET_AT]-() ON (c.contact_date)",
            "CREATE INDEX venue_location IF NOT EXISTS FOR (v:Venue) ON (v.location)",
        ]

        with self.get_session() as session:
            for query in constraints_and_indexes:
                try:
                    session.run(query)
                    logger.info(f"✅ Executed: {query[:50]}...")
                except Exception as e:
                    logger.warning(f"⚠️ Schema setup warning: {str(e)}")

        logger.info("🎯 Neo4j schema initialized successfully")

    def clear_database(self):
        """⚠️ WARNING: Deletes all data. Use only for testing!"""
        with self.get_session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            logger.warning("🗑️ Database cleared!")


# Global database instance
db = Neo4jConnection()


def get_db() -> Neo4jConnection:
    """Dependency injection for FastAPI routes"""
    return db


def init_db():
    """Initialize database schema on startup"""
    db.initialize_schema()
