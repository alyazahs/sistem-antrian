import json
from queue import Queue
from flask import Blueprint, Response, jsonify, request, stream_with_context
from auth import PETUGAS, require_auth, require_role
from db import get_db
from services.display_service import build_display_payload, broadcast_display_update, listeners
from services.printer_service import printer_service
from services.tts_service import tts_service

antrian_bp = Blueprint("antrian", __name__)

def _next_nomor_antrian(conn) -> int:
    row = conn.execute("""
        SELECT COALESCE(MAX(nomor_antrian), 0) AS last_no
        FROM antrian
        WHERE date(created_at) = date('now', 'localtime')
    """).fetchone()

    return (row["last_no"] or 0) + 1

@antrian_bp.post("/api/ambil-antrian")
@require_auth
@require_role(*PETUGAS)
def ambil_antrian():
    data = request.get_json(silent=True) or {}

    rfid_uid = (data.get("rfid_uid") or "").strip() or None
    nik = (data.get("nik") or "").strip() or None
    pengunjung_id = data.get("pengunjung_id")
    jenis = (data.get("jenis_pelayanan") or "").strip()

    try:
        pengunjung_id = int(pengunjung_id) if pengunjung_id is not None else None
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "ID pengunjung tidak valid"}), 400

    if not jenis:
        return jsonify({"success": False, "message": "Jenis pelayanan wajib diisi"}), 400
    if not pengunjung_id and not rfid_uid and not nik:
        return jsonify({"success": False, "message": "Pengunjung wajib dipilih"}), 400

    conn = get_db()
    try:
        if pengunjung_id:
            pengunjung = conn.execute("SELECT * FROM pengunjung WHERE id=?", (pengunjung_id,)).fetchone()
        elif rfid_uid:
            pengunjung = conn.execute("SELECT * FROM pengunjung WHERE rfid_uid=?", (rfid_uid,)).fetchone()
        else:
            pengunjung = conn.execute("SELECT * FROM pengunjung WHERE nik=?", (nik,)).fetchone()

        if not pengunjung:
            return jsonify({"success": False, "message": "Pengunjung belum terdaftar"}), 400

        nomor = _next_nomor_antrian(conn)

        conn.execute("""
            INSERT INTO antrian (pengunjung_id, nomor_antrian, jenis_pelayanan, status)
            VALUES (?, ?, ?, 'menunggu')
        """, (pengunjung["id"], nomor, jenis))
        conn.commit()

        broadcast_display_update()

        try:
            printer_service.print_ticket(nomor, pengunjung["nama"], jenis, None)
        except Exception as e:
            print(f"Failed to print ticket: {e}")
        return jsonify({
            "success": True,
            "nomor_antrian": nomor,
            "pengunjung": dict(pengunjung)
        })
    finally:
        conn.close()

@antrian_bp.get("/api/antrian/summary")
@require_auth
def antrian_summary():
    conn = get_db()
    try:
        total = conn.execute("""
          SELECT COUNT(*) AS n
          FROM antrian
          WHERE date(created_at) = date('now','localtime')
        """).fetchone()["n"]

        menunggu = conn.execute("""
          SELECT COUNT(*) AS n
          FROM antrian
          WHERE status='menunggu'
            AND date(created_at) = date('now','localtime')
        """).fetchone()["n"]

        dipanggil = conn.execute("""
          SELECT COUNT(*) AS n
          FROM antrian
          WHERE status='dipanggil'
            AND date(created_at) = date('now','localtime')
        """).fetchone()["n"]

        selesai = conn.execute("""
          SELECT COUNT(*) AS n
          FROM antrian
          WHERE status='selesai'
            AND date(created_at) = date('now','localtime')
        """).fetchone()["n"]

        skip = conn.execute("""
          SELECT COUNT(*) AS n
          FROM antrian
          WHERE status='dilewati'
            AND date(created_at) = date('now','localtime')
        """).fetchone()["n"]

        return jsonify({
            "total_hari_ini": total,
            "menunggu": menunggu,
            "dipanggil": dipanggil,
            "dilayani": selesai,
            "dilewati": skip
        })
    finally:
        conn.close()

@antrian_bp.get("/api/antrian/now")
@require_auth
def antrian_now():
    conn = get_db()
    try:
        row = conn.execute("""
          SELECT a.id, a.nomor_antrian, a.jenis_pelayanan, a.status,
                 p.nama, p.nik
          FROM antrian a
          JOIN pengunjung p ON p.id = a.pengunjung_id
          WHERE a.status='dipanggil'
            AND date(a.created_at) = date('now','localtime')
          ORDER BY a.id DESC
          LIMIT 1
        """).fetchone()

        return jsonify(dict(row) if row else None)
    finally:
        conn.close()

@antrian_bp.get("/api/antrian/list")
@require_auth
def antrian_list():
    status = (request.args.get("status") or "menunggu").strip()

    conn = get_db()
    try:
        rows = conn.execute("""
          SELECT a.id, a.nomor_antrian, a.jenis_pelayanan, a.status,
                 p.nama
          FROM antrian a
          JOIN pengunjung p ON p.id = a.pengunjung_id
          WHERE a.status=?
            AND date(a.created_at) = date('now','localtime')
          ORDER BY a.created_at ASC
        """, (status,)).fetchall()

        return jsonify([dict(r) for r in rows])
    finally:
        conn.close()

@antrian_bp.post("/api/antrian/call-next")
@require_auth
@require_role(*PETUGAS)
def antrian_call_next():
    conn = get_db()
    try:
        current = conn.execute("""
          SELECT id FROM antrian
          WHERE status='dipanggil'
            AND date(created_at) = date('now','localtime')
          LIMIT 1
        """).fetchone()

        if current:
            return jsonify({
                "success": False,
                "message": "Masih ada antrian dipanggil. Selesaikan dulu."
            }), 409

        row = conn.execute("""
          SELECT id FROM antrian
          WHERE status='menunggu'
            AND date(created_at) = date('now','localtime')
          ORDER BY created_at ASC
          LIMIT 1
        """).fetchone()

        if not row:
            return jsonify({"success": False, "message": "Tidak ada antrian menunggu"}), 404

        antrian_id = row["id"]

        conn.execute("""
          UPDATE antrian
          SET status='dipanggil'
          WHERE id=?
        """, (antrian_id,))
        conn.commit()

        broadcast_display_update()

        data = conn.execute("""
        SELECT a.id, a.nomor_antrian, a.jenis_pelayanan, a.status,
                p.nama
        FROM antrian a
        JOIN pengunjung p ON p.id = a.pengunjung_id
        WHERE a.id=?
        """, (antrian_id,)).fetchone()

        try:
            if data:
                tts_service.pengumuman(data["nama"], data["nomor_antrian"])
        except Exception as e:
            print("TTS Error:", e)

        return jsonify({"success": True, **dict(data)})
    finally:
        conn.close()

@antrian_bp.post("/api/antrian/serve/<int:antrian_id>")
@require_auth
@require_role(*PETUGAS)
def antrian_serve(antrian_id):
    user = getattr(request, "user", {}) or {}

    conn = get_db()
    try:
        cur = conn.execute("""
          UPDATE antrian
          SET status='selesai',
              handled_by_user_id=?,
              handled_by_nama=?
          WHERE id=?
            AND status='dipanggil'
        """, (
            user.get("id"),
            user.get("nama"),
            antrian_id,
        ))
        conn.commit()

        broadcast_display_update()

        if cur.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Antrian tidak ditemukan atau tidak sedang dipanggil"
            }), 404

        return jsonify({
            "success": True,
            "handled_by": {
                "id": user.get("id"),
                "nama": user.get("nama"),
            }
        })
    finally:
        conn.close()

@antrian_bp.post("/api/antrian/skip/<int:antrian_id>")
@require_auth
@require_role(*PETUGAS)
def antrian_skip(antrian_id):
    conn = get_db()
    try:
        cur = conn.execute("""
          UPDATE antrian
          SET status='dilewati'
          WHERE id=?
            AND status='dipanggil'
        """, (antrian_id,))
        conn.commit()

        broadcast_display_update()

        if cur.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Antrian tidak ditemukan atau tidak sedang dipanggil"
            }), 404

        return jsonify({"success": True})
    finally:
        conn.close()

@antrian_bp.post("/api/antrian/recall/<int:antrian_id>")
@require_auth
@require_role(*PETUGAS)
def antrian_recall(antrian_id):
    conn = get_db()
    try:
        row = conn.execute("""
          SELECT a.id, a.nomor_antrian, a.jenis_pelayanan,
                 p.nama
          FROM antrian a
          JOIN pengunjung p ON p.id = a.pengunjung_id
          WHERE a.id=? AND a.status='dipanggil'
        """, (antrian_id,)).fetchone()

        if not row:
            return jsonify({"success": False, "message": "Antrian tidak sedang dipanggil"}), 400

        try:
            tts_service.pengumuman(row["nama"], row["nomor_antrian"])
        except Exception as e:
            print("TTS Recall Error:", e)

        return jsonify({"success": True})
    finally:
        conn.close()

@antrian_bp.get("/api/antrian/display")
def antrian_display():
    return jsonify(build_display_payload())

@antrian_bp.get("/api/antrian/stream")
def antrian_stream():
    def event_stream():
        q = Queue()
        listeners.add(q)
        try:
            yield f"data: {json.dumps(build_display_payload())}\n\n"
            while True:
                data = q.get()
                yield f"data: {data}\n\n"
        finally:
            listeners.discard(q)

    return Response(
        stream_with_context(event_stream()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )