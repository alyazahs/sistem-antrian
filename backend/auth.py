from functools import wraps
from flask import jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from config import SECRET_KEY
from db import get_db

serializer = URLSafeTimedSerializer(SECRET_KEY)
PETUGAS = ("admin_pelayanan", "kasi_pelayanan")

def make_token(payload: dict) -> str:
    return serializer.dumps(payload)

def verify_token(token: str, max_age_seconds: int = 60 * 60 * 12) -> dict:
    return serializer.loads(token, max_age=max_age_seconds)

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        token = ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()

        if not token:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
        
        try:
            payload = verify_token(token)
        except SignatureExpired:
            return jsonify({"success": False, "message": "Token expired"}), 401
        except BadSignature:
            return jsonify({"success": False, "message": "Invalid token"}), 401

        user_id = payload.get("id")
        if not user_id:
            return jsonify({"success": False, "message": "Invalid token"}), 401

        conn = get_db()
        try:
            user = conn.execute("""
                SELECT id, nama, email, role, status
                FROM users
                WHERE id=?
            """, (user_id,)).fetchone()
        finally:
            conn.close()

        if not user:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 401

        if user["status"] != "aktif":
            return jsonify({"success": False, "message": f"Akun {user['status']}"}), 403

        request.user = dict(user)

        return fn(*args, **kwargs)

    return wrapper

def require_role(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(request, "user", None)
            if not user or user.get("role") not in roles:
                return jsonify({"success": False, "message": "Forbidden"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator