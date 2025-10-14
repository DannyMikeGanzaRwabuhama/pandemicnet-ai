"""
Configuration management for PandemicNet
Loads environment variables and provides app-wide settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Neo4j Configuration
    neo4j_uri: str
    neo4j_user: str
    neo4j_password: str
    neo4j_database: str

    # Gemini AI Configuration
    google_api_key: str

    # API Configuration
    api_host: str
    api_port: int
    debug: bool

    # ML Model Configuration
    ml_model_path: str

    # Agent Configuration
    api_base_url: str
    agent_log_level: str
    enable_auto_interventions: bool
    simulation_speed: float

    # Application Metadata
    app_name: str = "PandemicNet AI"
    app_version: str = "1.0.0"

    # CORS Settings (Add a suitable default if not in .env)
    cors_origins: list = ["http://localhost:3000", "http://localhost:8501"]


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


@lru_cache
def get_settings() -> Settings:
    """
    Create cached settings instance
    This ensures settings are only loaded once
    """
    return Settings()

# Ensure models directory exists
def ensure_directories():
    """Create necessary directories if they don't exist"""
    Path("models").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)


ensure_directories()
