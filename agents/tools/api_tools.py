"""
API Tools for LangGraph agents
Interface between agents and FastAPI backend
"""
import httpx
from typing import Dict, List, Optional
import logging
from agents.config import get_agent_config

logger = logging.getLogger(__name__)
config = get_agent_config()


class PandemicNetAPITools:
    """Tools for agent to interact with backend API"""

    def __init__(self):
        self.base_url = config.api_base_url
        self.timeout = config.api_timeout
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    # ==================== INDIVIDUALS ====================

    async def create_individual(self,
                                unique_id: str,
                                phone_number: Optional[str] = None,
                                location: Optional[str] = None) -> Dict:
        """Create a new individual in the network"""
        try:
            response = await self.client.post(
                f"{self.base_url}/individuals/",
                json={
                    "unique_id": unique_id,
                    "phone_number": phone_number,
                    "location": location,
                }
            )
            response.raise_for_status()
            logger.info(f"Created individual {unique_id}")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to create individual {unique_id}: {e}")
            return {"error": str(e)}

    async def get_individual(self, unique_id: str) -> Dict:
        """Get individual details"""
        try:
            response = await self.client.get(
                f"{self.base_url}/individuals/{unique_id}/",
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get individual {unique_id}: {e}")
            return {"error": str(e)}

    async def list_individuals(self, limit: int = 100, infected_only: bool = False) -> List[Dict]:
        """List all individuals"""
        try:
            response = await self.client.get(
                f"{self.base_url}/individuals/",
                params={"limit": limit, "infected_only": infected_only}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to list individuals: {e}")
            return []

    async def update_individual(
            self,
            unique_id: str,
            phone_number: Optional[str] = None,
            location: Optional[str] = None
    ) -> Dict:
        """Update individual information"""
        try:
            response = await self.client.put(
                f"{self.base_url}/individuals/{unique_id}",
                json={
                    "unique_id": unique_id,
                    "phone_number": phone_number,
                    "location": location
                }
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to update individual {unique_id}: {e}")
            return {"error": str(e)}

    # ==================== CONTACTS ====================

    async def create_contact(self,
                             individual_id: str,
                             contact_id: str,
                             contact_date: str,
                             venue_id: Optional[str] = None,
                             duration_minutes: Optional[int] = None,
                             proximity: Optional[str] = None, ) -> Dict:
        """Create a contact between two individuals"""
        try:
            response = await self.client.post(
                f"{self.base_url}/contacts/",
                json={
                    "individual_id": individual_id,
                    "contact_id": contact_id,
                    "contact_date": contact_date,
                    "venue_id": venue_id,
                    "duration_minutes": duration_minutes,
                    "proximity": proximity,
                }
            )
            response.raise_for_status()
            logger.info(f"Created contact {individual_id} -> {contact_id}")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to create contact: {e}")
            return {"error": str(e)}

    async def get_direct_contacts(
            self,
            unique_id: str,
            days: int = 14
    ) -> List[Dict]:
        """Get direct contacts for an individual"""
        try:
            response = await self.client.get(
                f"{self.base_url}/contacts/{unique_id}/direct",
                params={"days": days}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get contacts for {unique_id}: {e}")
            return []

    async def trace_contacts(
            self,
            unique_id: str,
            days: int = 14
    ) -> Dict:
        """Perform comprehensive contact tracing"""
        try:
            response = await self.client.get(
                f"{self.base_url}/contacts/{unique_id}/trace",
                params={"days": days}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to trace contacts for {unique_id}: {e}")
            return {"error": str(e)}

    # ==================== INFECTIONS ====================

    async def report_infection(
            self,
            unique_id: str,
            infection_date: str,
            symptoms: Optional[List[str]] = None,
            severity: Optional[str] = None
    ) -> Dict:
        """Report an infection"""
        try:
            response = await self.client.post(
                f"{self.base_url}/infections/report",
                json={
                    "unique_id": unique_id,
                    "infection_date": infection_date,
                    "symptoms": symptoms,
                    "severity": severity
                }
            )
            response.raise_for_status()
            logger.warning(f"⚠️ Infection reported: {unique_id}")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to report infection for {unique_id}: {e}")
            return {"error": str(e)}

    async def get_risk(self, unique_id: str) -> Dict:
        """Calculate infection risk for individual"""
        try:
            response = await self.client.get(
                f"{self.base_url}/infections/risk/{unique_id}"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get risk for {unique_id}: {e}")
            return {"error": str(e)}

    async def get_superspreaders(self, threshold: int = 15) -> Dict:
        """Identify superspreaders"""
        try:
            response = await self.client.get(
                f"{self.base_url}/infections/superspreaders",
                params={"threshold": threshold}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get superspreaders: {e}")
            return {"error": str(e)}

    async def get_infection_statistics(self) -> Dict:
        """Get overall infection statistics"""
        try:
            response = await self.client.get(
                f"{self.base_url}/infections/statistics"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get infection statistics: {e}")
            return {"error": str(e)}

    # ==================== GRAPH/NETWORK ====================

    async def get_network(self, limit: int = 100) -> Dict:
        """Get network graph data"""
        try:
            response = await self.client.get(
                f"{self.base_url}/graph/network",
                params={"limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get network: {e}")
            return {"error": str(e)}

    async def get_network_statistics(self) -> Dict:
        """Get network statistics"""
        try:
            response = await self.client.get(
                f"{self.base_url}/graph/statistics"
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get network statistics: {e}")
            return {"error": str(e)}

    async def get_centrality(self, limit: int = 10) -> Dict:
        """Get most connected individuals"""
        try:
            response = await self.client.get(
                f"{self.base_url}/graph/centrality",
                params={"limit": limit}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get centrality: {e}")
            return {"error": str(e)}


# Global API tools instance
api_tools = PandemicNetAPITools()
