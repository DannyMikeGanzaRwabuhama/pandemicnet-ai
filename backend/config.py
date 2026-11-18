"""
Configuration management for PandemicNet
Loads environment variables and provides app-wide settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache
from pathlib import Path
from typing import Union, List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Neo4j Configuration
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "password123"
    neo4j_database: str = "neo4j"

    # Gemini AI Configuration
    google_api_key: str = ""

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True

    # ML Model Configuration
    ml_model_path: str = "models/contact_model.pkl"

    # Agent Configuration
    api_base_url: str = "http://localhost:8000"
    agent_log_level: str = "INFO"
    enable_auto_interventions: bool = True
    simulation_speed: float = 1.0

    # Application Metadata
    app_name: str = "PandemicNet AI"
    app_version: str = "1.0.0"

    # CORS Settings (Accepts JSON array or comma-separated string)
    cors_origins: Union[List[str], str] = ["http://localhost:3000", "http://localhost:8501"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
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
