"""
Configuration management for PandemicNet
Loads environment variables and provides app-wide settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Neo4j Configuration
    neo4j_uri: str = os.getenv("NEO4J_URI")
    neo4j_user: str = os.getenv("NEO4J_USER")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD")
    neo4j_database: str = os.getenv("NEO4J_DATABASE")

    # Gemini AI Configuration
    google_api_key: str = os.getenv("GOOGLE_API_KEY")

    # API Configuration
    api_host: str = os.getenv("API_HOST")
    api_port: int = os.getenv("API_PORT")
    debug: bool = os.getenv("DEBUG")

    # ML Model Configuration
    ml_model_path: str = os.getenv("ML_MODEL_PATH")

    # Application Metadata
    app_name: str = "PandemicNet AI"
    app_version: str = "1.0.0"

    # CORS Settings
    cors_origins: list = ["http://localhost:3000", "http://localhost:8501"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache
def get_settings() -> Settings:
    """
    Create cached settings instance
    This ensures settings are only loaded once
    """
    return Settings()

# Ensure models directory exists
def ensure_directories():
    """Create necessary directories if the don't exist"""
    Path("models").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)


ensure_directories()