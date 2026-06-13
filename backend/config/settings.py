"""Django settings for the TradeMind AI backend."""
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from a .env file if present.
load_dotenv(BASE_DIR / ".env")


def env_bool(key: str, default: bool = False) -> bool:
    return os.getenv(key, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(key: str, default: str = "") -> list[str]:
    raw = os.getenv(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# --- Core ------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-me")
DEBUG = env_bool("DEBUG", True)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")

# POST requests to the frontend's non-slash routes must not be redirected.
APPEND_SLASH = False

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # Local
    "apps.accounts",
    "apps.trading",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# --- Database --------------------------------------------------------------
if env_bool("USE_SQLITE", False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "trademind"),
            "USER": os.getenv("DB_USER", "trademind"),
            "PASSWORD": os.getenv("DB_PASSWORD", "trademind"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }

AUTH_USER_MODEL = "accounts.User"

# Authenticate by email (EmailBackend), with the default username backend as
# a fallback for any internal username-based auth.
AUTHENTICATION_BACKENDS = [
    "apps.accounts.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- I18N ------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --- Static ----------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- DRF + JWT -------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("ACCESS_TOKEN_LIFETIME_MIN", "30"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("REFRESH_TOKEN_LIFETIME_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- CORS ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)

# --- Email -----------------------------------------------------------------
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "TradeMind AI <no-reply@trademind.ai>")

# --- Application / trading configuration -----------------------------------
TRADING = {
    "STARTING_CASH": float(os.getenv("PAPER_STARTING_CASH", "100000")),
    "MAX_OPEN_TRADES": int(os.getenv("MAX_OPEN_TRADES", "3")),
    "STOP_LOSS_PCT": float(os.getenv("STOP_LOSS_PCT", "0.02")),
    "TAKE_PROFIT_PCT": float(os.getenv("TAKE_PROFIT_PCT", "0.04")),
    "MIN_CONFIDENCE": float(os.getenv("MIN_CONFIDENCE", "0.7")),
    "MAX_RSI": float(os.getenv("MAX_RSI", "75")),
    "TRADE_QUANTITY": int(os.getenv("TRADE_QUANTITY", "10")),
    "WATCHLIST": env_list("WATCHLIST", "AAPL,MSFT,GOOGL,AMZN,NVDA,META,TSLA,JPM,V,WMT"),
    "TOP_N_DISCOVERY": int(os.getenv("TOP_N_DISCOVERY", "5")),
}

def _ollama_timeout():
    """Parse OLLAMA_TIMEOUT. Blank / 0 / 'none' means wait indefinitely
    (local LLMs on CPU can take minutes per generation)."""
    raw = os.getenv("OLLAMA_TIMEOUT", "").strip().lower()
    if raw in {"", "0", "none", "null"}:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


OLLAMA = {
    "BASE_URL": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    "MODEL": os.getenv("OLLAMA_MODEL", "llama3"),
    "TIMEOUT": _ollama_timeout(),  # None = no timeout (wait for the result)
}

REDDIT = {
    "CLIENT_ID": os.getenv("REDDIT_CLIENT_ID", ""),
    "CLIENT_SECRET": os.getenv("REDDIT_CLIENT_SECRET", ""),
    "USER_AGENT": os.getenv("REDDIT_USER_AGENT", "trademind-ai/0.1"),
}

# Default admin used by the seeder.
SEED_ADMIN = {
    "USERNAME": os.getenv("ADMIN_USERNAME", "admin"),
    "EMAIL": os.getenv("ADMIN_EMAIL", "admin@trademind.ai"),
    "PASSWORD": os.getenv("ADMIN_PASSWORD", "Admin@12345"),
}

# --- Celery -----------------------------------------------------------------
# Broker/result backend default to a local Redis; override via env in prod.
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
# Don't let a long trading cycle run forever.
CELERY_TASK_TIME_LIMIT = 15 * 60

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "apps": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
