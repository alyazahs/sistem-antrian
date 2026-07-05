from flask import Blueprint, jsonify, request
from auth import PETUGAS, require_auth, require_role
from db import get_db
from services.rfid_reader import rfid_reader
from utils.date_utils import hitung_umur
from utils.pengunjung_utils import merge_pengunjung_records, update_pengunjung_from_input

pengunjung_bp = Blueprint("pengunjung", __name__)

@pengunjung_bp.get("/api/pengunjung")
@require_auth
def list_pengunjung():
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT id, rfid_uid, nik, nama, nohp, tanggal_lahir, alamat, created_at
            FROM pengunjung
            ORDER BY created_at DESC
        """).fetchall()

        data = []
        for r in rows:
            item = dict(r)
            item["umur"] = hitung_umur(item.get("tanggal_lahir"))
            data.append(item)

        return jsonify(data)
    finally:
        conn.close()

@pengunjung_bp.delete("/api/pengunjung/<int:pengunjung_id>")
@require_auth
@require_role("kasi_pelayanan")
def delete_pengunjung(pengunjung_id):
    conn = get_db()
    try:
        cur = conn.execute("DELETE FROM pengunjung WHERE id=?", (pengunjung_id,))
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Data pengunjung tidak ditemukan"}), 404

        return jsonify({"success": True, "message": "Data identitas berhasil dihapus"})
    finally:
        conn.close()

@pengunjung_bp.get("/api/scan-rfid")
@require_auth
def scan_rfid():
    uid = rfid_reader.read_id()
    if not uid:
        return jsonify({"status": "no_card"})

    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM pengunjung WHERE rfid_uid = ?", (uid,)).fetchone()
        if row:
            return jsonify({"status": "registered", "pengunjung": dict(row)})
        return jsonify({"status": "not_registered", "rfid_uid": uid})
    finally:
        conn.close()

@pengunjung_bp.get("/api/cari-nik")
@require_auth
def cari_nik():
    nik = (request.args.get("nik") or "").strip()
    if not nik:
        return jsonify({"success": False, "message": "NIK wajib diisi"}), 400

    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM pengunjung WHERE nik = ?", (nik,)).fetchone()
        if not row:
            return jsonify({"success": True, "found": False})
        return jsonify({"success": True, "found": True, "pengunjung": dict(row)})
    finally:
        conn.close()

@pengunjung_bp.post("/api/daftar-pengunjung")
@require_auth
@require_role(*PETUGAS)
def daftar_pengunjung():
    data = request.get_json(silent=True) or {}

    def clean_str(v):
        if v is None:
            return None
        v = str(v).strip()
        return v if v != "" else None

    rfid_uid = clean_str(data.get("rfid_uid"))
    nik = clean_str(data.get("nik"))
    tanpa_ktp = bool(data.get("tanpa_ktp"))
    nama = clean_str(data.get("nama"))
    nohp = clean_str(data.get("nohp"))
    alamat = clean_str(data.get("alamat"))
    tanggal_lahir = clean_str(data.get("tanggal_lahir"))
    incoming = {
        "rfid_uid": rfid_uid,
        "nik": nik,
        "nama": nama,
        "nohp": nohp,
        "tanggal_lahir": tanggal_lahir,
        "alamat": alamat,
    }

    if tanpa_ktp:
        rfid_uid = None
        nik = None
        incoming["rfid_uid"] = None
        incoming["nik"] = None

    if not nama:
        return jsonify({"success": False, "message": "Nama wajib diisi"}), 400
    if not tanpa_ktp and not nik:
        return jsonify({
            "success": False,
            "message": "NIK wajib diisi untuk pendaftaran KTP. Gunakan Antrian Tanpa KTP jika belum punya NIK."
        }), 400

    conn = get_db()
    try:
        existing_by_rfid = None
        existing_by_nik = None

        if rfid_uid:
            existing_by_rfid = conn.execute(
                "SELECT * FROM pengunjung WHERE rfid_uid=?",
                (rfid_uid,),
            ).fetchone()

        if nik:
            existing_by_nik = conn.execute(
                "SELECT * FROM pengunjung WHERE nik=?",
                (nik,),
            ).fetchone()

        if existing_by_rfid and existing_by_nik:
            if existing_by_rfid["id"] == existing_by_nik["id"]:
                row = update_pengunjung_from_input(conn, existing_by_nik, incoming)
                conn.commit()
                return jsonify({
                    "success": True,
                    "pengunjung": dict(row),
                    "linked": True,
                })

            if existing_by_rfid["nik"] and existing_by_rfid["nik"] != nik:
                return jsonify({
                    "success": False,
                    "message": "RFID sudah terdaftar dengan NIK lain"
                }), 409

            if existing_by_nik["rfid_uid"] and existing_by_nik["rfid_uid"] != rfid_uid:
                return jsonify({
                    "success": False,
                    "message": "NIK sudah terdaftar dengan RFID lain"
                }), 409

            row = merge_pengunjung_records(
                conn,
                target=existing_by_nik,
                duplicate=existing_by_rfid,
                incoming=incoming,
            )
            conn.commit()

            return jsonify({
                "success": True,
                "pengunjung": dict(row),
                "linked": True,
                "merged": True,
            })

        if existing_by_rfid:
            if nik and existing_by_rfid["nik"] and existing_by_rfid["nik"] != nik:
                return jsonify({
                    "success": False,
                    "message": "RFID sudah terdaftar dengan NIK lain"
                }), 409

            row = update_pengunjung_from_input(conn, existing_by_rfid, incoming)
            conn.commit()

            return jsonify({
                "success": True,
                "pengunjung": dict(row),
                "linked": True,
            })

        if existing_by_nik:
            if rfid_uid and existing_by_nik["rfid_uid"] and existing_by_nik["rfid_uid"] != rfid_uid:
                return jsonify({
                    "success": False,
                    "message": "NIK sudah terdaftar dengan RFID lain"
                }), 409

            row = update_pengunjung_from_input(conn, existing_by_nik, incoming)
            conn.commit()

            return jsonify({
                "success": True,
                "pengunjung": dict(row),
                "linked": True,
            })

        cur = conn.execute("""
            INSERT INTO pengunjung (rfid_uid, nik, nama, nohp, tanggal_lahir, alamat)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (rfid_uid, nik, nama, nohp, tanggal_lahir, alamat))
        conn.commit()

        row = conn.execute(
            "SELECT * FROM pengunjung WHERE id=?",
            (cur.lastrowid,),
        ).fetchone()

        return jsonify({"success": True, "pengunjung": dict(row) if row else None})
    finally:
        conn.close()