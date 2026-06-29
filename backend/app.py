from flask import Flask
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from config import CORS_RESOURCES, CORS_SUPPORTS_CREDENTIALS, SECRET_KEY
from db import get_db
from db_init import init_db
from routes import register_routes

def seed_defaults():
    conn = get_db()
    try:
        row = conn.execute("SELECT id FROM users WHERE email=?", ("kasi@gmail.com",)).fetchone()
        if not row:
            conn.execute("""
                INSERT INTO users (nama,email,password_hash,role,status)
                VALUES (?,?,?,?,?)
            """, (
                "Kasi Pelayanan",
                "kasi@gmail.com",
                generate_password_hash("kasi123"),
                "kasi_pelayanan",
                "aktif"
            ))
            conn.commit()
    finally:
        conn.close()

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    CORS(
        app,
        resources=CORS_RESOURCES,
        supports_credentials=CORS_SUPPORTS_CREDENTIALS,
    )

    init_db()
    seed_defaults()
    register_routes(app)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)