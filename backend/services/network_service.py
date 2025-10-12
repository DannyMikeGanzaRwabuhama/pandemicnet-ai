"""
Network analysis service
Graph algorithms and network metrics using Neo4j
"""
from backend.database import get_db
from typing import Dict, List
from datetime import date
from neo4j.time import Date as Neo4jDate
import logging

logger = logging.getLogger(__name__)


class NetworkService:
    """Service for network analysis and graph algorithms"""

    def __init__(self):
        self.db = get_db()

    def calculate_degrees_of_separation(self, person_id: str, max_depth: int = 6) -> Dict:
        """
        Calculate degrees of separation form a person
        Returns dict with depth as key and list of people at that depth
        """
        query = """
        MATCH path = (start:Individual {unique_id: $person_id})-[:MET_AT*1..%d]-(end:Individual)
        WHERE start <> end
        WITH end, min(length(path)) as degree
        RETURN degree, collect(DISTINCT end.unique_id) as people
        ORDER BY degree
        """ % max_depth

        results = self.db.execute_query(query, {"person_id": person_id})

        degrees = {}
        for record in results:
            degrees[record["degree"]] = record["people"]

        return degrees

    def find_shortest_path(self, person1: str, person2: str) -> List[str]:
        """Find the shortest path between two people"""
        query = """
        MATCH path = shortestPath(
        MATCH path = shortestPath(
            (p1:Individual {unique_id: $person1})-[:MET_AT*]-(p2:Individual {unique_id: $person2})
        )
        RETURN [node in nodes(path) | node.unique_id] as path
        """

        results = self.db.execute_query(query, {
            "person1": person1,
            "person2": person2,
        })

        if results:
            return results[0]['path']
        return []

    def get_network_centrality(self, limit: int = 10) -> List[Dict]:
        """
        Calculate degree centrality (most connected people)
        Returns top N most connected individuals
        """
        query = """
        MATCH (p:Individual)-[r:MET_AT]-()
        WITH p, count(r) as connections
        RETURN p.unique_id as unique_id, 
               connections,
               p.infected as infected
        ORDER BY connections DESC
        LIMIT $limit
        """

        results = self.db.execute_query(query, {"limit": limit})
        return results

    def detect_communities(self) -> List[Dict]:
        """
        Detect communities/clusters in the network
        Users Louvain algorithm if available, otherwise connected components
        """
        # First try connected components (simpler, always available)
        query = """
                CALL gds.graph.project(
                    'contact-network',
                    'Individual',
                    'MET_AT'
                )
                YIELD graphName

                CALL gds.wcc.stream('contact-network')
                YIELD nodeId, componentId
                RETURN gds.util.asNode(nodeId).unique_id as unique_id, 
                       componentId as community
                """
        try:
            results = self.db.execute_query(query)
            # Clean up the projection
            self.db.execute_query("CALL gds.graph.drop('contact-network')")
            return results
        except Exception as e:
            logger.warning(f"Community detection failed: {e}")
            # Fallback: simple connected components
            return self._simple_connected_components()

    def _simple_connected_components(self) -> List[Dict]:
        """Fallback: find connected components manually"""
        query = """
        MATCH (p:Individual)
        OPTIONAL MATCH (p)-[:MET_AT*]-(connected:Individual)
        WITH p, collect(DISTINCT connected.unique_id) as component
        RETURN p.unique_id as unique_id, component
        """

        return self.db.execute_query(query)

    def find_superspreaders(self, threshold: int = 10) -> List[Dict]:
        """
        Identify potential superspreaders
        People with high contact count who are infected
        """
        query = """
                MATCH (p:Individual {infected: true})-[r:MET_AT]-()
                WITH p, count(r) as contact_count
                WHERE contact_count >= $threshold
                RETURN p.unique_id as unique_id,
                       contact_count,
                       p.infection_date as infection_date
                ORDER BY contact_count DESC
                """

        results = self.db.execute_query(query, {"threshold": threshold})
        # Convert Neo4j date to Python date
        cleaned = []
        for record in results:
            infection_date = record.get("infection_date")
            if isinstance(infection_date, Neo4jDate):
                infection_date = date(
                    infection_date.year,
                    infection_date.month,
                    infection_date.day
                )

            cleaned.append({
                "unique_id": record.get("unique_id"),
                "contact_count": record.get("contact_count"),
                "infection_date": infection_date,
            })

        return cleaned

    def calculate_infection_chains(self, source_id: str, max_depth: int = 5) -> Dict:
        """
        Trace potential infections chains from a source
        Return infection propagation tree
        """
        query = """
                MATCH path = (source:Individual {unique_id: $source_id})-[:MET_AT*1..%d]->(exposed:Individual)
                WHERE source.infected = true
                WITH exposed, 
                     min(length(path)) as depth,
                     [node in nodes(path) | node.unique_id] as chain
                RETURN exposed.unique_id as person,
                       depth,
                       exposed.infected as is_infected,
                       chain
                ORDER BY depth
                """ % max_depth

        results = self.db.execute_query(query, {"source_id": source_id})

        chains = {
            "source": source_id,
            "exposed": [],
            "infected_count": 0,
            "total_exposed": len(results)
        }

        for record in results:
            chains["exposed"].append({
                "person": record["person"],
                "depth": record["depth"],
                "is_infected": record["is_infected"],
                "chain": record["chain"]
            })
            if record["is_infected"]:
                chains["infected_count"] += 1

        return chains

    def get_network_statistics(self) -> Dict:
        """Calculate overall network statistics"""
        stats = {}

        # Total nodes
        result = self.db.execute_query("MATCH (p:Individual) RETURN count(p) as count")
        stats["total_individuals"] = result[0]["count"] if result else 0

        # Total relationships
        result = self.db.execute_query("MATCH ()-[r:MET_AT]->() RETURN count(r) as count")
        stats["total_contacts"] = result[0]["count"] if result else 0

        # Infected count
        result = self.db.execute_query("MATCH (p:Individual {infected: true}) RETURN count(p) as count")
        stats["infected_count"] = result[0]["count"] if result else 0

        # Average degree
        result = self.db.execute_query("""
                            MATCH (p:Individual)
                            OPTIONAL MATCH (p)-[r:MET_AT]-()
                            WITH p, count(r) as degree
                            RETURN avg(degree) as avg_degree
                        """)

        avg_degree = result[0].get("avg_degree") if result and result[0] else None
        stats["average_contacts"] = round(avg_degree, 2) if avg_degree is not None else 0.0

        # Network density
        if stats["total_individuals"] > 1:
            max_edges = stats["total_individuals"] * (stats["total_individuals"] - 1) / 2
            stats["network_density"] = round(stats["total_contacts"] / max_edges, 4) if max_edges > 0 else 0.0
        else:
            stats["network_density"] = 0.0

        return stats

    def find_exposure_risk_contacts(self, person_id: str, days: int = 14) -> List[Dict]:
        """
        Find contacts within the infectious period
        Returns contacts from the last N days
        """
        query = """
                MATCH (p:Individual {unique_id: $person_id})-[r:MET_AT]-(contact:Individual)
                WHERE r.contact_date >= date() - duration({days: $days})
                RETURN contact.unique_id as unique_id,
                       contact.infected as infected,
                       r.contact_date as contact_date,
                       r.duration_minutes as duration,
                       r.proximity as proximity
                ORDER BY r.contact_date DESC
                """

        results = self.db.execute_query(query, {
            "person_id": person_id,
            "days": days
        })

        return results
