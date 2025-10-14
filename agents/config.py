"""
Agent system configuration
Settings for LangGraph agents and simulation parameters
"""
from backend.config import get_settings
from typing import List

settings = get_settings()


class AgentConfig:
    """Configuration for AI agents"""

    # API Configuration
    api_base_url: str = f"http://{settings.api_host}:{settings.api_port}"
    api_timeout: int = 30

    # Gemini AI Configuration
    google_api_key: str = settings.google_api_key
    llm_model: str = "gemini-2.0-flash-exp"
    llm_temperature: float = 0.7

    # Simulation Parameters
    simulation_speed: int = settings.simulation_speed
    simulation_days: int = 30  # How many days to simulate

    # Population Settings
    initial_population: int = 100
    daily_new_individuals: int = 5  # New people entering network

    # Movement Patterns
    movement_probability: float = 0.3  # 30% chance person moves daily
    locations: List[str] = [
        "Kigali", "Butare", "Huye", "Musanze", "Rubavu",
        "Nyanza", "Muhanga", "Karongi", "Nyagatare", "Rwamagana"
    ]

    # Contact Patterns
    avg_daily_contacts: int = 3
    contact_std_dev: int = 2
    contact_duration_range: tuple = (15, 180)  # minutes
    proximity_distribution: dict = {
        "close": 0.3,
        "medium": 0.5,
        "far": 0.2
    }

    # Infection Parameters
    base_infection_rate: float = 0.15  # 15% chance of infection per contact
    infection_factors: dict = {
        "close": 2.0,  # 2x multiplier for close contact
        "medium": 1.0,  # Normal rate
        "far": 0.3  # 30% of base rate
    }
    incubation_period_days: int = 5
    infectious_period_days: int = 14

    # Agent Behavior Settings
    agent_check_interval: int = 3600  # Run agents every hour (in seconds)
    agent_batch_size: int = 10  # Process N individuals per batch

    # Analysis Settings
    outbreak_threshold: int = 10  # Alert if 10+ new infections/day
    superspreader_threshold: int = 15  # Alert if someone has 15+ contacts
    high_risk_threshold: float = 0.7  # Risk score threshold

    # Intervention Settings
    enable_auto_interventions: bool = settings.enable_auto_interventions
    quarantine_duration_days: int = 14
    testing_capacity: int = 50  # Max tests per day

    # Reporting
    daily_report_time: str = "09:00"  # Generate daily reports at 9 AM
    save_reports: bool = True
    report_directory: str = "reports/"


# Global config instance
agent_config = AgentConfig()


# Helper function to get config
def get_agent_config() -> AgentConfig:
    """Get agent configuration instance"""
    return agent_config
