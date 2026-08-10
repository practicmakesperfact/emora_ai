"""
Emora Backend - Core Configuration
Uses pydantic-settings for type-safe environment variable management.
"""

from functools import lru_cache
from typing import List

from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ─────────────────────────────────────────────
    APP_NAME: str = "Emora Mental Health Chatbot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # ─── Database ────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/emora_db"
    )

    # ─── JWT Authentication ───────────────────────────────────────
    SECRET_KEY: str = Field(default="change-this-secret-key-in-production-32chars!!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Groq (LLM) ──────────────────────────────────────────────
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # ─── Ollama (Embeddings) ──────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "nomic-embed-text"

    # ─── ChromaDB ────────────────────────────────────────────────
    CHROMA_PERSIST_DIR: str = "./data/chroma"

    # ─── File Storage ─────────────────────────────────────────────
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # ─── Security ────────────────────────────────────────────────
    BCRYPT_ROUNDS: int = 12
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """
    Return cached application settings.
    Using lru_cache ensures settings are only loaded once.
    """
    return Settings()


# Global settings instance for convenience
settings = get_settings()
