from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    APP_NAME: str = "Care Bridge"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "postgresql+asyncpg://carebridge:carebridge_dev_pass@localhost:5432/carebridge"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    REDIS_URL: str = ""
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = "preciousmofeoluwa@gmail.com"
    BREVO_SENDER_NAME: str = "Care Bridge"

    GENLAYER_NODE_URL: str = "https://studio.genlayer.com/api"
    GENLAYER_CONTRACT_ADDRESS: str = ""
    GENLAYER_VALIDATOR_COUNT: int = 3
    GENLAYER_PRIVATE_KEY: str = ""

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
