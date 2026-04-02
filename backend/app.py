from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sqlite3
import os
from io import BytesIO
from datetime import datetime
from functools import wraps
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash
import openpyxl
from db_init import init_db, DB_PATH
from rfid_reader import rfid_reader
from printer_service import printer_service
from tts_service import tts_service
from flask import Flask, jsonify, request, send_file, Response, stream_with_context
import json
from queue import Queue

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

listeners = set()

# SECRET untuk token
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "DEV_SECRET_CHANGE_ME")
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

init_db()

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def _next_nomor_antrian(conn: sqlite3.Connection) -> int:
    row = conn.execute("""
        SELECT COALESCE(MAX(nomor_antrian), 0) AS last_no
        FROM antrian
        WHERE date(created_at) = date('now', 'localtime')
    """).fetchone()

    return (row["last_no"] or 0) + 1

def format_tanggal_indo(dt_str):
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        bulan = [
            "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
            "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ]
        return f"{dt.day:02d} {bulan[dt.month - 1]} {dt.year}"
    except Exception:
        return dt_str

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
                 p.nama, p.nik
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

# AUTH HELPERS
def make_token(payload: dict) -> str:
    return serializer.dumps(payload)

def verify_token(token: str, max_age_seconds: int = 60 * 60 * 12):
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
            request.user = payload
        except SignatureExpired:
            return jsonify({"success": False, "message": "Token expired"}), 401
        except BadSignature:
            return jsonify({"success": False, "message": "Invalid token"}), 401

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

seed_defaults()

# HEALTH
@app.get("/")
def health():
    return jsonify({"status": "ok", "service": "antrian-kecamatan-api"})

# AUTH ENDPOINTS
@app.post("/api/auth/login")
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

@app.get("/api/auth/me")
@require_auth
def auth_me():
    return jsonify({"success": True, "user": request.user})

# USERS CRUD (ADMIN ONLY)
@app.get("/api/users")
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

@app.post("/api/users")
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

@app.put("/api/users/<int:user_id>")
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
        fields.append("nama=?"); params.append(nama)
    if role:
        fields.append("role=?"); params.append(role)
    if status:
        fields.append("status=?"); params.append(status)

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

@app.put("/api/users/<int:user_id>/password")
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


@app.delete("/api/users/<int:user_id>")
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

@app.get("/api/jenis-pelayanan")
def list_jenis():
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT id, nama, aktif, created_at
            FROM master_jenis_pelayanan
            ORDER BY nama ASC
        """).fetchall()
        return jsonify([dict(r) for r in rows])
    finally:
        conn.close()

@app.post("/api/jenis-pelayanan")
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

@app.put("/api/jenis-pelayanan/<int:jenis_id>")
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

@app.delete("/api/jenis-pelayanan/<int:jenis_id>")
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

@app.get("/api/pengunjung")
def list_pengunjung():
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT id, rfid_uid, nik, nama, nohp, umur, alamat, created_at
            FROM pengunjung
            ORDER BY created_at DESC
        """).fetchall()
        return jsonify([dict(r) for r in rows])
    finally:
        conn.close()

# 1) Scan RFID
@app.get("/api/scan-rfid")
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

# 2) Cari pengunjung via NIK
@app.get("/api/cari-nik")
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

# 3) Daftar pengunjung baru
@app.post("/api/daftar-pengunjung")
def daftar_pengunjung():
    data = request.get_json(silent=True) or {}

    def clean_str(v):
        if v is None:
            return None
        v = str(v).strip()
        return v if v != "" else None

    rfid_uid = clean_str(data.get("rfid_uid"))
    nik = clean_str(data.get("nik"))
    nama = (data.get("nama") or "").strip()
    nohp = clean_str(data.get("nohp"))
    alamat = clean_str(data.get("alamat"))

    umur = data.get("umur")
    try:
        umur = int(umur) if umur not in (None, "", "null") else None
    except Exception:
        umur = None

    if not nama:
        return jsonify({"success": False, "message": "Nama wajib diisi"}), 400
    if not rfid_uid and not nik:
        return jsonify({"success": False, "message": "RFID UID atau NIK wajib diisi"}), 400

    conn = get_db()
    try:
        if rfid_uid and conn.execute("SELECT 1 FROM pengunjung WHERE rfid_uid=?", (rfid_uid,)).fetchone():
            return jsonify({"success": False, "message": "RFID sudah terdaftar"}), 400
        if nik and conn.execute("SELECT 1 FROM pengunjung WHERE nik=?", (nik,)).fetchone():
            return jsonify({"success": False, "message": "NIK sudah terdaftar"}), 400

        conn.execute("""
            INSERT INTO pengunjung (rfid_uid, nik, nama, nohp, umur, alamat)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (rfid_uid, nik, nama, nohp, umur, alamat))
        conn.commit()

        row = conn.execute("""
            SELECT * FROM pengunjung
            WHERE (rfid_uid = ? AND ? IS NOT NULL) OR (nik = ? AND ? IS NOT NULL)
            ORDER BY id DESC LIMIT 1
        """, (rfid_uid, rfid_uid, nik, nik)).fetchone()

        return jsonify({"success": True, "pengunjung": dict(row) if row else None})
    finally:
        conn.close()

# 4) Ambil antrian
@app.post("/api/ambil-antrian")
def ambil_antrian():
    data = request.get_json(silent=True) or {}

    rfid_uid = (data.get("rfid_uid") or "").strip() or None
    nik = (data.get("nik") or "").strip() or None
    jenis = (data.get("jenis_pelayanan") or "").strip()

    if not jenis:
        return jsonify({"success": False, "message": "Jenis pelayanan wajib diisi"}), 400
    if not rfid_uid and not nik:
        return jsonify({"success": False, "message": "RFID UID atau NIK wajib diisi"}), 400

    conn = get_db()
    try:
        if rfid_uid:
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

# 5) API Halaman Antrian
@app.get("/api/antrian/summary")
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

@app.get("/api/antrian/now")
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

@app.get("/api/antrian/list")
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

@app.post("/api/antrian/call-next")
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

@app.post("/api/antrian/serve/<int:antrian_id>")
def antrian_serve(antrian_id):
    conn = get_db()
    try:
        cur = conn.execute("""
          UPDATE antrian
          SET status='selesai'
          WHERE id=?
        """, (antrian_id,))
        conn.commit()
        
        broadcast_display_update()

        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Antrian tidak ditemukan"}), 404

        return jsonify({"success": True})
    finally:
        conn.close()

@app.post("/api/antrian/skip/<int:antrian_id>")
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
        
@app.post("/api/antrian/recall/<int:antrian_id>")
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
        
@app.get("/api/antrian/display")
def antrian_display():
    return jsonify(build_display_payload())


@app.get("/api/antrian/stream")
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

# LAPORAN
@app.get("/api/laporan")
def list_laporan():
    keyword = (request.args.get("keyword") or "").strip().lower()
    tanggal_awal = (request.args.get("tanggal_awal") or "").strip()
    tanggal_akhir = (request.args.get("tanggal_akhir") or "").strip()

    conn = get_db()
    try:
        query = """
            SELECT
                a.id,
                a.created_at AS tanggal_raw,
                p.nik,
                p.nama,
                p.nohp,
                p.umur,
                p.alamat,
                a.jenis_pelayanan AS keperluan
            FROM antrian a
            JOIN pengunjung p ON p.id = a.pengunjung_id
            WHERE a.status = 'selesai'
        """
        params = []

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

        query += " ORDER BY a.created_at DESC "

        rows = conn.execute(query, params).fetchall()

        data = []
        for r in rows:
            item = dict(r)
            item["tanggal_kunjungan"] = format_tanggal_indo(item["tanggal_raw"])
            data.append(item)

        return jsonify({"success": True, "data": data})
    finally:
        conn.close()

@app.delete("/api/laporan/<int:laporan_id>")
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

@app.get("/api/laporan/export-excel")
def export_laporan_excel():
    keyword = (request.args.get("keyword") or "").strip().lower()
    tanggal_awal = (request.args.get("tanggal_awal") or "").strip()
    tanggal_akhir = (request.args.get("tanggal_akhir") or "").strip()

    conn = get_db()
    try:
        query = """
            SELECT
                a.id,
                a.created_at AS tanggal_raw,
                p.nik,
                p.nama,
                p.nohp,
                p.umur,
                p.alamat,
                a.jenis_pelayanan AS keperluan
            FROM antrian a
            JOIN pengunjung p ON p.id = a.pengunjung_id
            WHERE a.status = 'selesai'
        """
        params = []

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

        query += " ORDER BY a.created_at DESC "

        rows = conn.execute(query, params).fetchall()

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Laporan Pelayanan"

        headers = ["No", "Tanggal", "NIK", "Nama", "No HP", "Umur", "Alamat", "Keperluan"]
        ws.append(headers)

        for idx, r in enumerate(rows, start=1):
            row = dict(r)
            ws.append([
                idx,
                format_tanggal_indo(row["tanggal_raw"]),
                row.get("nik"),
                row.get("nama"),
                row.get("nohp"),
                row.get("umur"),
                row.get("alamat"),
                row.get("keperluan"),
            ])

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        return send_file(
            output,
            as_attachment=True,
            download_name="Laporan_Pelayanan.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    finally:
        conn.close()
        
# DASHBOARD
@app.get("/api/dashboard")
def dashboard_summary():
    conn = get_db()
    try:
        total_pengunjung = conn.execute("""
            SELECT COUNT(*) AS n
            FROM pengunjung
        """).fetchone()["n"]

        total_antrian = conn.execute("""
            SELECT COUNT(*) AS n
            FROM antrian
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
                "total_antrian": total_antrian or 0,
                "total_layanan": total_layanan or 0,
                "total_pengunjung_bulan_ini": total_pengunjung_bulan_ini or 0,
            }
        })
    finally:
        conn.close()
        
@app.get("/api/dashboard/chart")
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
        
@app.get("/api/dashboard/recent")
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)