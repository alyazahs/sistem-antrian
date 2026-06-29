from datetime import datetime
from flask import Blueprint, jsonify, request
from auth import require_auth
from db import get_db
from utils.date_utils import format_tanggal_indo

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.get("/api/dashboard")
@require_auth
def dashboard_summary():
    conn = get_db()
    try:
        total_pengunjung = conn.execute("""
            SELECT COUNT(*) AS n
            FROM pengunjung
        """).fetchone()["n"]

        total_dilayani = conn.execute("""
            SELECT COUNT(*) AS n
            FROM antrian
            WHERE status = 'selesai'
        """).fetchone()["n"]

        total_layanan = conn.execute("""
            SELECT COUNT(*) AS n
            FROM master_jenis_pelayanan
            WHERE aktif = 1
        """).fetchone()["n"]

        total_pengunjung_bulan_ini = conn.execute("""
            SELECT COUNT(*) AS n
            FROM antrian
            WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
        """).fetchone()["n"]

        return jsonify({
            "success": True,
            "cards": {
                "total_pengunjung": total_pengunjung or 0,
                "total_dilayani": total_dilayani or 0,
                "total_layanan": total_layanan or 0,
                "total_pengunjung_bulan_ini": total_pengunjung_bulan_ini or 0,
            }
        })
    finally:
        conn.close()

@dashboard_bp.get("/api/dashboard/chart")
@require_auth
def dashboard_chart():
    tahun = (request.args.get("tahun") or "").strip()

    conn = get_db()
    try:
        if not tahun:
            tahun = datetime.now().strftime("%Y")

        rows = conn.execute("""
            SELECT
                CAST(strftime('%m', created_at) AS INTEGER) AS bulan,
                COUNT(*) AS total
            FROM antrian
            WHERE strftime('%Y', created_at) = ?
            GROUP BY strftime('%m', created_at)
            ORDER BY bulan ASC
        """, (tahun,)).fetchall()

        data_map = {row["bulan"]: row["total"] for row in rows}

        labels = [
            "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
            "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ]
        values = [data_map.get(i, 0) for i in range(1, 13)]

        return jsonify({
            "success": True,
            "tahun": tahun,
            "labels": labels,
            "values": values
        })
    finally:
        conn.close()

@dashboard_bp.get("/api/dashboard/recent")
@require_auth
def dashboard_recent():
    limit = request.args.get("limit", 5)

    try:
        limit = int(limit)
    except Exception:
        limit = 5

    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT
                a.id,
                a.nomor_antrian,
                a.jenis_pelayanan,
                a.status,
                a.created_at,
                p.nama,
                p.nik
            FROM antrian a
            JOIN pengunjung p ON p.id = a.pengunjung_id
            ORDER BY a.created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()

        data = []
        for r in rows:
            item = dict(r)
            item["tanggal_format"] = format_tanggal_indo(item["created_at"])
            data.append(item)

        return jsonify({
            "success": True,
            "data": data
        })
    finally:
        conn.close()