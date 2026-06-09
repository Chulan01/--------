from functools import lru_cache
from pathlib import Path

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=PROJECT_ROOT / ".env", env_file_encoding="utf-8", extra="ignore")

    project_name: str = "News Aggregator"
    database_url: str = "postgresql+psycopg://news:news@127.0.0.1:5432/newsdb"
    secret_key: str = Field(min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    backup_dir: str = "backups"
    cors_origins: str = "http://localhost:4200,http://localhost"
    newsdata_api_key: str | None = None
    first_admin_username: str | None = None
    first_admin_email: str | None = None
    first_admin_password: str | None = Field(default=None, min_length=8)

    @computed_field
    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
