import os

SECRET_KEY = os.environ.get("SECRET_KEY", "DEV_SECRET_CHANGE_ME")
CORS_RESOURCES = {r"/api/*": {"origins": "*"}}
CORS_SUPPORTS_CREDENTIALS = True