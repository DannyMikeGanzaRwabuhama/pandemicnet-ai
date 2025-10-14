"""
Agent state definitions for LangGraph workflows
Defines shared state between all agents
"""
from typing import TypedDict, List, Dict, Optional, Annotated
from datetime import datetime, date
import operator


class SimulationState(TypedDict):
    """
    Shared state for simulation agents
    This state flows through the LangGraph workflow
    """

    # Simulation metadata
    simulation_day: int  # Current simulation day
    current_date: date  # Simulated date
    start_date: date  # Simulation start date

    # Messages and logs
    messages: Annotated[List[str], operator.add]  # Agent messages
    logs: Annotated[List[Dict], operator.add]  # Event logs

    # Population data
    total_individuals: int  # Total people in network
    new_individuals_today: List[str]  # New people added
    active_individuals: List[str]  # Currently active people

    # Contact data
    contacts_created_today: int  # New contacts today
    total_contacts: int  # All-time contacts

    # Infection data
    newly_infected: List[str]  # New infections today
    total_infected: int  # Cumulative infections
    active_infections: List[str]  # Currently infected
    recovered: List[str]  # Recovered individuals

    # Network metrics
    network_density: float  # Network density score
    average_contacts: float  # Avg contacts per person
    superspreaders: List[str]  # Identified superspreaders

    # Risk analysis
    high_risk_individuals: List[Dict]  # People at high risk
    outbreak_detected: bool  # Outbreak flag
    r_value: float  # Reproduction number

    # Interventions
    quarantined: List[str]  # Quarantined individuals
    tested_today: List[str]  # People tested today
    interventions_active: List[Dict]  # Active interventions

    # AI insights
    daily_analysis: Optional[str]  # AI-generated analysis
    recommendations: List[str]  # AI recommendations
    alerts: List[str]  # Critical alerts

    # Performance metrics
    execution_time: float  # Workflow execution time
    errors: List[str]  # Any errors encountered


class AnalysisState(TypedDict):
    """
    State for analysis agents
    Used for outbreak detection and reporting
    """

    # Analysis metadata
    analysis_type: str  # "daily", "outbreak", "on-demand"
    analysis_date: datetime  # When analysis was run

    # Data snapshots
    current_statistics: Dict  # Current network stats
    historical_data: List[Dict]  # Time series data

    # Analysis results
    outbreak_probability: float  # P(outbreak) 0-1
    hotspot_locations: List[str]  # Geographic hotspots
    transmission_chains: List[Dict]  # Identified chains

    # Predictions
    predicted_cases_7d: int  # 7-day forecast
    predicted_r_value: float  # Future R value
    peak_date: Optional[date]  # Predicted peak

    # Recommendations
    priority_testing: List[str]  # Who to test first
    priority_quarantine: List[str]  # Who to quarantine
    resource_needs: Dict  # Resource requirements

    # Reporting
    report_generated: bool  # Report status
    report_path: Optional[str]  # Where report saved
    report_summary: Optional[str]  # Summary text


def create_initial_simulation_state(start_date: date = None) -> SimulationState:
    """Create initial state for simulation workflow"""
    if start_date is None:
        start_date = date.today()

    return {
        "simulation_day": 0,
        "current_date": start_date,
        "start_date": start_date,
        "messages": [],
        "logs": [],
        "total_individuals": 0,
        "new_individuals_today": [],
        "active_individuals": [],
        "contacts_created_today": 0,
        "total_contacts": 0,
        "newly_infected": [],
        "total_infected": 0,
        "active_infections": [],
        "recovered": [],
        "network_density": 0.0,
        "average_contacts": 0.0,
        "superspreaders": [],
        "high_risk_individuals": [],
        "outbreak_detected": False,
        "r_value": 0.0,
        "quarantined": [],
        "tested_today": [],
        "interventions_active": [],
        "daily_analysis": None,
        "recommendations": [],
        "alerts": [],
        "execution_time": 0.0,
        "errors": [],
    }


def create_initial_analysis_state() -> AnalysisState:
    """Create initial state for analysis workflow"""
    return {
        "analysis_type": "daily",
        "analysis_date": datetime.now(),
        "current_statistics": {},
        "historical_data": [],
        "outbreak_probability": 0.0,
        "hotspot_locations": [],
        "transmission_chains": [],
        "predicted_cases_7d": 0,
        "predicted_r_value": 0.0,
        "peak_date": None,
        "priority_testing": [],
        "priority_quarantine": [],
        "resource_needs": {},
        "report_generated": False,
        "report_path": None,
        "report_summary": None,
    }
