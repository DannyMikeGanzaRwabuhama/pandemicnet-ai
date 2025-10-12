"""
AI service using Gemini for intelligent explanations
Generates human-readable insights from network data
"""
import google.generativeai as genai
from typing import Dict, List
import logging
from backend.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AIService:
    """Service for generating AI-powered explanations and insights"""

    def __init__(self):
        self.model = None
        self._initialize_gemini()

    def _initialize_gemini(self):
        """Initialize Gemini AI model"""
        try:
            if not settings.google_api_key:
                logger.warning("⚠️ GOOGLE_API_KEY not set. AI explanations will be disabled.")
                return

            genai.configure(api_key=settings.google_api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
            logger.info("✅ Gemini AI initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini: {e}")
            self.model = None

    def generate_contact_explanation(
            self,
            unique_id: str,
            confidence: float,
            factors: Dict
    ) -> str:
        """
        Generate natural language explanation for predicted contact
        """
        if not self.model:
            return self._fallback_contact_explanation(unique_id, confidence, factors)

        try:
            prompt = f"""
            Generate a brief, friendly explanation (2-3 sentences max) for why {unique_id}
            might be a contact with {confidence:.2f} confidence.
            
            Factors:
            - Contact count: {factors.get('contact_count', 0)}
            - Days since last contact: {factors.get('days_ago', 0)}
            - Mutual connections: {factors.get('mutual_contacts', 0)}
            - Proximity: {factors.get('proximity_score', 0.5)}
            
            Be conversational and emphasize the most important factor.
            Don't use bullet points. Write in natural language.
"""

            response = self.model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.warning(f"Gemini API failed: {e}. Using fallback.")
            return self._fallback_contact_explanation(unique_id, confidence, factors)

    @staticmethod
    def _fallback_contact_explanation(
            unique_id: str,
            confidence: float,
            factors: Dict
    ) -> str:
        """Fallback explanation when Gemini is unavailable"""
        contact_count = factors.get('contact_count', 0)
        days_ago = int(factors.get('days_ago', 0))
        mutuals = factors.get('mutual_contacts', 0)

        if confidence >= 0.7:
            vibe = "Strong connection"
        elif confidence >= 0.5:
            vibe = "Possible link"
        else:
            vibe = "Weak signal"

        return (
            f"{vibe}: {unique_id} has {contact_count} contacts with {mutuals} mutual "
            f"connections. Last activity was {days_ago} days ago. "
            f"Confidence: {confidence:.0%}."
        )

    def generate_risk_explanation(self,
                                  person_id: str,
                                  risk_data: Dict) -> str:
        """Generate explanation for infection risk"""
        if not self.model:
            return self._fallback_risk_explanation(person_id, risk_data)

        try:
            risk_score = risk_data.get('risk_score', 0.0)
            exposed_contacts = risk_data.get('exposed_contacts', 0)
            total_contacts = risk_data.get('total_contacts', 0)

            prompt = f"""
            Generate a clear, empathetic health advisory (3-4 sentences) for {person_id}.
            
            Risk Assessment:
            - Risk Score: {risk_score:.2%}
            - Exposed to {exposed_contacts} infected contacts out of {total_contacts} total
            - Risk Level = {risk_data.get('risk_level', 'UNKNOWN')}
            
            Provide actionable advice based on the risk level. Be reassuring but accurate.
            Don't use medical jargon. Write in a supportive, informative tone.
"""

            response = self.model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.warning(f"Gemini API failed: {e}. Using fallback.")
            return self._fallback_risk_explanation(person_id, risk_data)

    @staticmethod
    def _fallback_risk_explanation(person_id: str, risk_data: Dict) -> str:
        """Fallback risk explanation"""
        risk_level = risk_data.get('risk_level', 'LOW')
        exposed = risk_data.get('exposed_contacts', 0)

        if risk_level == "HIGH":
            return (
                f"⚠️ {person_id} has high exposure risk with {exposed} infected contacts. "
                f"Please monitor symptoms, consider testing, and limit close contacts."
            )
        elif risk_level == "MEDIUM":
            return (
                f"⚡ {person_id} has moderate exposure risk with {exposed} infected contacts. "
                f"Stay alert for symptoms and follow health guidelines."
            )
        else:
            return (
                f"✅ {person_id} has low exposure risk. {exposed} infected contacts found. "
                f"Continue practicing good hygiene and social distancing."
            )

    def generate_network_insights(self, stats: Dict) -> str:
        """Generate insights about the overall network"""
        if not self.model:
            return self._fallback_network_insights(stats)

        try:
            prompt = f"""
Provide a brief network analysis summary (3-4 sentences) based on these statistics:

- Total individuals: {stats.get('total_individuals', 0)}
- Total contacts: {stats.get('total_contacts', 0)}
- Infected: {stats.get('infected_count', 0)}
- Average contacts per person: {stats.get('average_contacts', 0)}
- Network density: {stats.get('network_density', 0)}

Highlight key patterns and potential concerns. Be data-driven and clear.
"""

            response = self.model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.warning(f"Gemini API failed: {e}. Using fallback.")
            return self._fallback_network_insights(stats)

    @staticmethod
    def _fallback_network_insights(stats: Dict) -> str:
        """Fallback network insights"""
        total = stats.get('total_individuals', 0)
        infected = stats.get('infected_count', 0)
        avg_contacts = stats.get('average_contacts', 0)

        infection_rate = (infected / total * 100) if total > 0 else 0

        if infection_rate > 10:
            concern = "High infection rate detected"
        elif infection_rate > 5:
            concern = "Moderate infection spread"
        else:
            concern = "Low infection rate"

        return (
            f"Network: {total} individuals, {infected} infected ({infection_rate:.1f}%). "
            f"{concern}. Average {avg_contacts:.1f} contacts per person. "
            f"Monitor superspreaders and isolate infected individuals."
        )

    def generate_superspreader_alert(self, superspreaders: List[Dict]) -> str:
        """Generate alert about potential superspreaders"""
        if not superspreaders:
            return "No superspreaders detected in the network."

        if not self.model:
            return self._fallback_superspreader_alert(superspreaders)

        try:
            top_spreader = superspreaders[0]

            prompt = f"""
            Generate a public health alert (2-3 sentences) about potential superspreaders.
            
            Top superspreader: {top_spreader['unique_id']} with {top_spreader['contact_count']} contacts
            Total superspreaders identified: {len(superspreaders)}
            
            Be urgent but not alarmist. Focus on action items.
"""
            response = self.model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.warning(f"Gemini API failed: {e}. Using fallback.")
            return self._fallback_superspreader_alert(superspreaders)

    @staticmethod
    def _fallback_superspreader_alert(superspreaders: List[Dict]) -> str:
        """Fallback superspreader alert"""
        count = len(superspreaders)
        top = superspreaders[0]

        return (
            f"🚨 {count} potential superspreader(s) identified. "
            f"Top: {top['unique_id']} with {top['contact_count']} contacts. "
            f"Priority: Contact tracing and isolation recommended."
        )


# Global AI service instance
ai_service = AIService()


def get_ai_service() -> AIService:
    """Dependency injection for FastAPI routes"""
    return ai_service
