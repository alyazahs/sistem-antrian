import json
from db import get_db

listeners = set()

def build_display_payload():
    conn = get_db()
    try:
        summary = conn.execute("""
          SELECT
            COUNT(*) AS total_hari_ini,
            SUM(CASE WHEN status='menunggu' THEN 1 ELSE 0 END) AS menunggu,
            SUM(CASE WHEN status='dipanggil' THEN 1 ELSE 0 END) AS dipanggil,
            SUM(CASE WHEN status='selesai' THEN 1 ELSE 0 END) AS dilayani,
            SUM(CASE WHEN status='dilewati' THEN 1 ELSE 0 END) AS dilewati
          FROM antrian
          WHERE date(created_at) = date('now','localtime')
        """).fetchone()

        current = conn.execute("""
          SELECT a.id, a.nomor_antrian, a.jenis_pelayanan, a.status,
                 p.nama
          FROM antrian a
          JOIN pengunjung p ON p.id = a.pengunjung_id
          WHERE a.status='dipanggil'
            AND date(a.created_at) = date('now','localtime')
          ORDER BY a.id DESC
          LIMIT 1
        """).fetchone()

        next_queue = conn.execute("""
          SELECT a.id, a.nomor_antrian, a.jenis_pelayanan, a.status,
                 p.nama
          FROM antrian a
          JOIN pengunjung p ON p.id = a.pengunjung_id
          WHERE a.status='menunggu'
            AND date(a.created_at) = date('now','localtime')
          ORDER BY a.created_at ASC
          LIMIT 1
        """).fetchone()

        return {
            "summary": {
                "total_hari_ini": summary["total_hari_ini"] or 0,
                "menunggu": summary["menunggu"] or 0,
                "dipanggil": summary["dipanggil"] or 0,
                "dilayani": summary["dilayani"] or 0,
                "dilewati": summary["dilewati"] or 0,
            },
            "current": dict(current) if current else None,
            "next": dict(next_queue) if next_queue else None,
        }
    finally:
        conn.close()

def broadcast_display_update():
    payload = json.dumps(build_display_payload())
    dead = []

    for q in listeners:
        try:
            q.put(payload)
        except Exception:
            dead.append(q)

    for q in dead:
        listeners.discard(q)