from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    cors_allow_origin: str = "http://localhost:3000"


settings = Settings()
