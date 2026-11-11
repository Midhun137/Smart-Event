import os
from pathlib import Path

# Load .env if present
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        root_env = Path(__file__).parent.parent / '.env'
        if root_env.exists():
            load_dotenv(dotenv_path=root_env)
except ImportError:
    pass

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smartevent_super_secret_jwt_key_2026")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_NAME = os.getenv("DB_NAME", "smartevent")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "midhun")
