import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://root:root@localhost/rebook_bd"   # local dev fallback
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # MySQL-specific: prevent connection timeouts on PythonAnywhere
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 280,
        "pool_pre_ping": True,
    }
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
