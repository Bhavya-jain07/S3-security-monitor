from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    AWS_PROFILE: str = "default"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

settings = Settings()