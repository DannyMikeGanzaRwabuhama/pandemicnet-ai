"""
Analysis Agent - AI-powered outbreak detection and analysis
Uses Gemini AI to analyze patterns and generate insights
"""
import logging
from typing import Dict, List
from langchain_google_genai import ChatGoogleGenerativeAI
from agents.state import SimulationState
from agents.config import get_agent_config
from agents.tools.api_tools import api_tools

logger = logging.getLogger(__name__)
config = get_agent_config()


class AnalysisAgent:
    """
    AI-powered analysis of network and infection patterns
    - Detects outbreaks early
    - Identifies transmission chains
    - Calculates R value
    - Generates natural language insights
    """

    def __init__(self):
        # Initialize Gemini LLM
        try:
            self.llm = ChatGoogleGenerativeAI(
                model=config.llm_model,
                temperature=config.llm_temperature,
                google_api_key=config.google_api_key
            )
            self.ai_enabled = True
            logger.info("✅ Gemini AI initialized for analysis")
        except Exception as e:
            logger.warning(f"⚠️ Gemini AI unavailable: {e}")
            self.ai_enabled = False

    @staticmethod
    def _calculate_r_value(new_infections: int,
                           active_infections: int) -> float:
        """
        Calculate basic reproduction number (R0)
        R > 1 means epidemic is growing
        """
        if active_infections == 0:
            return 0.0

        # Simplified R calculation
        r_value = new_infections / max(active_infections, 1)
        return round(r_value, 2)

    @staticmethod
    def _detect_superspreaders(centrality_data: Dict) -> List[str]:
        """
        Identify individuals with unusually high contact counts
        """
        superspreaders = []

        if 'most_connected' in centrality_data:
            for person in centrality_data['most_connected']:
                if person['connections'] >= config.superspreader_threshold:
                    superspreaders.append(person['unique_id'])

        return superspreaders

    async def _generate_ai_analysis(self,
                                    state: SimulationState,
                                    statistics: Dict) -> str:
        """
        Use Gemini AI to generate natural language analysis
        """
        if not self.ai_enabled:
            return self._generate_fallback_analysis(state, statistics)

        try:
            # Prepare context for AI
            context = f"""
                    Analyze this pandemic simulation data and provide insights:

                    Day: {state['simulation_day']}
                    Total Individuals: {statistics.get('total_individuals', 0)}
                    Infected: {statistics.get('infected_count', 0)}
                    New Infections Today: {len(state.get('newly_infected', []))}
                    R Value: {state.get('r_value', 0)}
                    Outbreak Detected: {state.get('outbreak_detected', False)}
                    Contacts Today: {state.get('contacts_created_today', 0)}
                    Superspreaders: {len(state.get('superspreaders', []))}

                    Provide:
                    1. Overall situation assessment
                    2. Key trends
                    3. Specific concerns
                    4. Brief recommendations

                    Keep it concise (3-4 sentences).
                    """

            response = await self.llm.ainvoke(context)
            return response.content.strip()

        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return self._generate_fallback_analysis(state, statistics)

    @staticmethod
    def _generate_fallback_analysis(state: SimulationState, statistics: Dict) -> str:
        """
        Rule-based analysis when AI unavailable
        """
        total = statistics.get('total_individuals', 0)
        infected = statistics.get('infected_count', 0)
        new_cases = len(state.get('newly_infected', []))
        r_value = state.get('r_value', 0)

        if state.get('outbreak_detected'):
            return (
                f"🚨 OUTBREAK ALERT: {new_cases} new cases detected. "
                f"Infection rate: {infected / total * 100:.1f}%. "
                f"R value: {r_value}. Immediate interventions recommended."
            )
        elif r_value > 1.0:
            return (
                f"⚠️ Epidemic growing: R={r_value} indicates accelerating spread. "
                f"{infected} total cases ({infected / total * 100:.1f}%). "
                f"Enhanced monitoring needed."
            )
        elif infected > 0:
            return (
                f"📊 Situation stable: {infected} cases ({infected / total * 100:.1f}%). "
                f"R={r_value}. Continue routine surveillance."
            )
        else:
            return (
                f"✅ No active infections. Network of {total} individuals "
                f"with {statistics.get('total_contacts', 0)} contacts monitored."
            )

    async def __call__(self, state: SimulationState) -> SimulationState:
        """
        Main agent function - called by LangGraph
        """
        logger.info(f"🔬 Analysis Agent: Day {state['simulation_day']}")

        try:
            #             Get network statistics
            statistics = await api_tools.get_network_statistics()
            stats = statistics.get('statistics', {})

            # Get centrality data (superspreaders)
            centrality_data = await api_tools.get_centrality(limit=20)

            # Calculate R value
            new_infections = len(state.get('newly_infected', []))
            active_infections = len(state.get('active_infections', []))
            r_value = self._calculate_r_value(new_infections, active_infections)

            state["r_value"] = r_value

            # Identify superspreaders
            superspreaders = self._detect_superspreaders(centrality_data)
            state["superspreaders"] = superspreaders

            # Update network metrics
            state["network_density"] = stats.get('network_density', 0.0)
            state["average_contacts"] = stats.get('average_contacts', 0.0)
            state["total_individuals"] = stats.get('total_individuals', 0)

            # Generate AI analysis
            analysis = await self._generate_ai_analysis(state, stats)
            state["daily_analysis"] = analysis

            #             Generate recommendations
            recommendations = []

            if state.get('outbreak_detected'):
                recommendations.append("Implement mass testing in affected areas")
                recommendations.append("Enforce strict social distancing")
                recommendations.append("Quarantine all high-risk contacts")

            if r_value > 1.5:
                recommendations.append("R value critical - consider lockdown measures")

            if superspreaders:
                recommendations.append(
                    f"Priority monitoring for {len(superspreaders)} superspreaders"
                )

            state["recommendations"] = recommendations

            # Log analysis
            state["messages"].append(
                f"Analysis Agent: R={r_value}, {new_infections} new cases."
            )

            logger.info(f"✅ Analysis complete: R={r_value}, {len(superspreaders)} superspreaders")

        except Exception as e:
            error_msg = f"Analysis Agent error: {str(e)}"
            logger.error(error_msg)
            state["errors"].append(error_msg)

        return state


# Create agent instance
analysis_agent = AnalysisAgent()
