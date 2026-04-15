import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class Config:
    DEBUG = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    PORT = os.getenv("PORT", "5000")
    SECRET_KEY = os.getenv("SECRET_KEY", "resume-detector-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/fake_resume_detector",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    UPLOAD_FOLDER = str(BASE_DIR / "uploads")

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    TWILIO_SID = os.getenv("TWILIO_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE = os.getenv("TWILIO_PHONE", "")

    GITHUB_API_BASE = os.getenv("GITHUB_API_BASE", "https://api.github.com")
    ALLOW_DEV_OTP_BYPASS = os.getenv("ALLOW_DEV_OTP_BYPASS", "true").lower() == "true"
