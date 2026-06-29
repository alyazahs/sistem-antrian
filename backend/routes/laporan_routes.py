from flask import Blueprint, jsonify, request
from auth import require_auth, require_role
from db import get_db
from utils.date_utils import format_tanggal_indo, hitung_umur

laporan_bp = Blueprint("laporan", __name__)

def _get_laporan_filters(args):
    return {
        "keyword": (args.get("keyword") or "").strip().lower(),
        "tanggal_awal": (args.get("tanggal_awal") or "").strip(),
        "tanggal_akhir": (args.get("tanggal_akhir") or "").strip(),
    }

def _append_laporan_filters(query, params, filters):
    keyword = filters["keyword"]
    tanggal_awal = filters["tanggal_awal"]
    tanggal_akhir = filters["tanggal_akhir"]

    if keyword:
        query += """
            AND (
                LOWER(COALESCE(p.nik, '')) LIKE ?
                OR LOWER(COALESCE(p.nama, '')) LIKE ?
                OR LOWER(COALESCE(a.jenis_pelayanan, '')) LIKE ?
            )
        """
        like_keyword = f"%{keyword}%"
        params.extend([like_keyword, like_keyword, like_keyword])

    if tanggal_awal:
        query += " AND date(a.created_at) >= date(?) "
        params.append(tanggal_awal)

    if tanggal_akhir:
        query += " AND date(a.created_at) <= date(?) "
        params.append(tanggal_akhir)

    return query, params

@laporan_bp.get("/api/laporan")
@require_auth
def list_laporan():
    filters = _get_laporan_filters(request.args)

    conn = get_db()
    try:
        query = """
            SELECT
                a.id,
                a.created_at AS tanggal_raw,
                p.nik,
                p.nama,
                p.nohp,
                p.tanggal_lahir,
                p.alamat,
                a.jenis_pelayanan AS keperluan,
                a.handled_by_nama AS petugas_nama
            FROM antrian a
            JOIN pengunjung p ON p.id = a.pengunjung_id
            WHERE a.status = 'selesai'
        """
        params = []

        query, params = _append_laporan_filters(query, params, filters)
        query += " ORDER BY a.created_at DESC "

        rows = conn.execute(query, params).fetchall()

        data = []
        for r in rows:
            item = dict(r)
            item["tanggal_kunjungan"] = format_tanggal_indo(item["tanggal_raw"])
            item["umur"] = hitung_umur(item.get("tanggal_lahir"))
            data.append(item)

        return jsonify({"success": True, "data": data})
    finally:
        conn.close()

@laporan_bp.delete("/api/laporan")
@require_auth
@require_role("kasi_pelayanan")
def delete_laporan_bulk():
    filters = _get_laporan_filters(request.args)

    conn = get_db()
    try:
        query = """
            DELETE FROM antrian
            WHERE id IN (
                SELECT a.id
                FROM antrian a
                JOIN pengunjung p ON p.id = a.pengunjung_id
                WHERE a.status = 'selesai'
        """
        params = []
        query, params = _append_laporan_filters(query, params, filters)
        query += ")"

        cur = conn.execute(query, params)
        conn.commit()

        return jsonify({
            "success": True,
            "deleted": cur.rowcount,
            "message": f"{cur.rowcount} log laporan berhasil dihapus",
        })
    finally:
        conn.close()

@laporan_bp.delete("/api/laporan/<int:laporan_id>")
@require_auth
@require_role("kasi_pelayanan")
def delete_laporan(laporan_id):
    conn = get_db()
    try:
        cur = conn.execute("DELETE FROM antrian WHERE id=?", (laporan_id,))
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Data laporan tidak ditemukan"}), 404

        return jsonify({"success": True, "message": "Data laporan berhasil dihapus"})
    finally:
        conn.close()