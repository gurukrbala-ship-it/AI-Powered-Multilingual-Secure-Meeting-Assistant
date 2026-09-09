from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    APP_NAME: str = "LinguaMeet AI"
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "change-this-secret"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./linguameet.db"

    JWT_SECRET: str = "change-this-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    IBM_STT_API_KEY: str = ""
    IBM_STT_URL: str = "https://api.us-south.speech-to-text.watson.cloud.ibm.com"

    IBM_TRANSLATOR_API_KEY: str = ""
    IBM_TRANSLATOR_URL: str = "https://api.us-south.language-translator.watson.cloud.ibm.com"

    WATSONX_API_KEY: str = ""
    WATSONX_PROJECT_ID: str = ""
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"

    IBM_COS_API_KEY: str = ""
    IBM_COS_INSTANCE_CRN: str = ""
    IBM_COS_ENDPOINT: str = ""

    DEMO_MODE: bool = True

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origins_list(self):
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_demo_mode(self):
        """True when no IBM credentials are configured or DEMO_MODE is explicitly true."""
        if self.DEMO_MODE:
            return True
        has_stt = bool(self.IBM_STT_API_KEY)
        has_translator = bool(self.IBM_TRANSLATOR_API_KEY)
        has_watsonx = bool(self.WATSONX_API_KEY and self.WATSONX_PROJECT_ID)
        return not (has_stt and has_translator and has_watsonx)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
