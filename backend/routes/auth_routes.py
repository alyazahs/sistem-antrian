import sqlite3
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash
from auth import make_token, require_auth
from db import get_db

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/api/auth/login")
def auth_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"success": False, "message": "Email dan password wajib diisi"}), 400

    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not user:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 404

        if user["status"] != "aktif":
            return jsonify({"success": False, "message": f"Akun {user['status']}"}), 403

        if not check_password_hash(user["password_hash"], password):
            return jsonify({"success": False, "message": "Password salah"}), 401

        token = make_token({
            "id": user["id"],
            "nama": user["nama"],
            "email": user["email"],
            "role": user["role"]
        })

        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "id": user["id"],
                "nama": user["nama"],
                "email": user["email"],
                "role": user["role"],
                "status": user["status"],
            }
        })
    finally:
        conn.close()

@auth_bp.get("/api/auth/me")
@require_auth
def auth_me():
    user_id = (request.user or {}).get("id")
    if not user_id:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    conn = get_db()
    try:
        user = conn.execute("""
            SELECT id, nama, email, role, status, created_at
            FROM users
            WHERE id=?
        """, (user_id,)).fetchone()

        if not user:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 401

        return jsonify({"success": True, "user": dict(user)})
    finally:
        conn.close()

@auth_bp.put("/api/auth/profile")
@require_auth
def auth_update_profile():
    data = request.get_json(silent=True) or {}

    user_id = (request.user or {}).get("id")
    nama = (data.get("nama") or "").strip()
    email = (data.get("email") or "").strip()
    password_before = (
        data.get("password_before")
        or data.get("current_password")
        or ""
    ).strip()
    new_password = (data.get("new_password") or "").strip()
    confirm_password = (data.get("confirm_password") or "").strip()

    if not user_id:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    if not nama or not email:
        return jsonify({"success": False, "message": "Nama dan email wajib diisi"}), 400

    if not password_before:
        return jsonify({"success": False, "message": "Password lama wajib diisi"}), 400

    if new_password or confirm_password:
        if len(new_password) < 6:
            return jsonify({"success": False, "message": "Password baru minimal 6 karakter"}), 400

        if new_password != confirm_password:
            return jsonify({"success": False, "message": "Konfirmasi password tidak sesuai"}), 400

    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        if not user:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 404

        if not check_password_hash(user["password_hash"], password_before):
            return jsonify({"success": False, "message": "Password lama salah"}), 400

        fields = ["nama=?", "email=?"]
        params = [nama, email]

        if new_password:
            fields.append("password_hash=?")
            params.append(generate_password_hash(new_password))

        params.append(user_id)

        try:
            conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=?", params)
            conn.commit()
        except sqlite3.IntegrityError:
            return jsonify({"success": False, "message": "Email sudah digunakan"}), 409

        updated = conn.execute("""
            SELECT id, nama, email, role, status, created_at
            FROM users
            WHERE id=?
        """, (user_id,)).fetchone()

        updated_user = dict(updated)
        token = make_token({
            "id": updated_user["id"],
            "nama": updated_user["nama"],
            "email": updated_user["email"],
            "role": updated_user["role"],
        })

        return jsonify({
            "success": True,
            "token": token,
            "user": updated_user,
        })
    finally:
        conn.close()