import sqlite3
from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from auth import require_auth, require_role
from db import get_db

user_bp = Blueprint("users", __name__)

@user_bp.get("/api/users")
@require_auth
@require_role("kasi_pelayanan")
def users_list():
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT id, nama, email, role, status, created_at
            FROM users
            ORDER BY id DESC
        """).fetchall()
        return jsonify({"success": True, "data": [dict(r) for r in rows]})
    finally:
        conn.close()

@user_bp.post("/api/users")
@require_auth
@require_role("kasi_pelayanan")
def users_create():
    data = request.get_json(silent=True) or {}

    nama = (data.get("nama") or "").strip()
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()
    role = (data.get("role") or "").strip()
    status = (data.get("status") or "aktif").strip()

    if not all([nama, email, password, role]):
        return jsonify({"success": False, "message": "nama, email, role, password wajib"}), 400

    if role not in ("admin_pelayanan", "kasi_pelayanan"):
        return jsonify({"success": False, "message": "Role tidak valid"}), 400

    if status not in ("aktif", "tidak_aktif", "cuti"):
        return jsonify({"success": False, "message": "Status tidak valid"}), 400

    conn = get_db()
    try:
        try:
            conn.execute("""
                INSERT INTO users (nama,email,password_hash,role,status)
                VALUES (?,?,?,?,?)
            """, (nama, email, generate_password_hash(password), role, status))
            conn.commit()
            return jsonify({"success": True})
        except sqlite3.IntegrityError:
            return jsonify({"success": False, "message": "Email sudah digunakan"}), 409
    finally:
        conn.close()

@user_bp.put("/api/users/<int:user_id>")
@require_auth
@require_role("kasi_pelayanan")
def users_update(user_id):
    data = request.get_json(silent=True) or {}
    nama = (data.get("nama") or "").strip()
    role = (data.get("role") or "").strip()
    status = (data.get("status") or "").strip()

    if role and role not in ("admin_pelayanan", "kasi_pelayanan"):
        return jsonify({"success": False, "message": "Role tidak valid"}), 400

    if status and status not in ("aktif", "tidak_aktif", "cuti"):
        return jsonify({"success": False, "message": "Status tidak valid"}), 400

    fields = []
    params = []

    if nama:
        fields.append("nama=?")
        params.append(nama)
    if role:
        fields.append("role=?")
        params.append(role)
    if status:
        fields.append("status=?")
        params.append(status)

    if not fields:
        return jsonify({"success": False, "message": "Tidak ada data diubah"}), 400

    params.append(user_id)

    conn = get_db()
    try:
        cur = conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id=?", params)
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 404
        return jsonify({"success": True})
    finally:
        conn.close()

@user_bp.put("/api/users/<int:user_id>/password")
@require_auth
@require_role("kasi_pelayanan")
def users_reset_password(user_id):
    data = request.get_json(silent=True) or {}
    password = (data.get("password") or "").strip()
    if not password:
        return jsonify({"success": False, "message": "Password wajib"}), 400

    conn = get_db()
    try:
        cur = conn.execute(
            "UPDATE users SET password_hash=? WHERE id=?",
            (generate_password_hash(password), user_id),
        )
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 404
        return jsonify({"success": True})
    finally:
        conn.close()

@user_bp.delete("/api/users/<int:user_id>")
@require_auth
@require_role("kasi_pelayanan")
def users_delete(user_id):
    current_user = getattr(request, "user", {}) or {}
    if int(current_user.get("id", 0) or 0) == int(user_id):
        return jsonify({"success": False, "message": "Tidak bisa menghapus akun yang sedang login"}), 400

    conn = get_db()
    try:
        cur = conn.execute("DELETE FROM users WHERE id=?", (user_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "User tidak ditemukan"}), 404
        return jsonify({"success": True})
    finally:
        conn.close()