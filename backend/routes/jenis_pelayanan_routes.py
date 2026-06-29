import sqlite3
from flask import Blueprint, jsonify, request
from auth import PETUGAS, require_auth, require_role
from db import get_db

jenis_pelayanan_bp = Blueprint("jenis_pelayanan", __name__)

@jenis_pelayanan_bp.get("/api/jenis-pelayanan")
def list_jenis():
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT id, nama, aktif, created_at
            FROM master_jenis_pelayanan
            ORDER BY id ASC
        """).fetchall()
        return jsonify([dict(r) for r in rows])
    finally:
        conn.close()

@jenis_pelayanan_bp.post("/api/jenis-pelayanan")
@require_auth
@require_role(*PETUGAS)
def create_jenis():
    data = request.get_json(silent=True) or {}
    nama = (data.get("nama") or "").strip()
    if not nama:
        return jsonify({"success": False, "message": "Nama wajib diisi"}), 400

    conn = get_db()
    try:
        try:
            conn.execute("INSERT INTO master_jenis_pelayanan (nama) VALUES (?)", (nama,))
            conn.commit()
            return jsonify({"success": True})
        except sqlite3.IntegrityError:
            return jsonify({"success": False, "message": "Nama sudah ada"}), 409
    finally:
        conn.close()

@jenis_pelayanan_bp.put("/api/jenis-pelayanan/<int:jenis_id>")
@require_auth
@require_role(*PETUGAS)
def update_jenis(jenis_id):
    data = request.get_json(silent=True) or {}
    nama = (data.get("nama") or "").strip()
    aktif = data.get("aktif", 1)

    if not nama:
        return jsonify({"success": False, "message": "Nama wajib diisi"}), 400

    conn = get_db()
    try:
        try:
            cur = conn.execute(
                "UPDATE master_jenis_pelayanan SET nama=?, aktif=? WHERE id=?",
                (nama, int(aktif), jenis_id),
            )
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"success": False, "message": "Data tidak ditemukan"}), 404
            return jsonify({"success": True})
        except sqlite3.IntegrityError:
            return jsonify({"success": False, "message": "Nama sudah ada"}), 409
    finally:
        conn.close()

@jenis_pelayanan_bp.delete("/api/jenis-pelayanan/<int:jenis_id>")
@require_auth
@require_role(*PETUGAS)
def delete_jenis(jenis_id):
    conn = get_db()
    try:
        cur = conn.execute("DELETE FROM master_jenis_pelayanan WHERE id=?", (jenis_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Data tidak ditemukan"}), 404
        return jsonify({"success": True})
    finally:
        conn.close()