from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from db_init import init_db, DB_PATH
from rfid_reader import rfid_reader
from printer_service import printer_service
from tts_service import tts_service

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
 
init_db()

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def _next_nomor_antrian(conn: sqlite3.Connection) -> int:
    conn.execute("BEGIN IMMEDIATE")  # lock untuk mencegah bentrok

    row = conn.execute("SELECT value FROM metadata WHERE key='last_nomor_antrian'").fetchone()
    last_num = int(row["value"]) if row and row["value"] is not None else 0
    next_num = last_num + 1

    conn.execute("""
      INSERT INTO metadata(key,value) VALUES('last_nomor_antrian', ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    """, (str(next_num),))
    return next_num


@app.get("/")
def health():
    return jsonify({"status": "ok", "service": "antrian-kecamatan-api"})

@app.get("/api/jenis-pelayanan")
def list_jenis():
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT id, nama, aktif, created_at
            FROM master_jenis_pelayanan
            ORDER BY nama ASC
        """).fetchall()
        return jsonify([dict(r) for r in rows   ])
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
    nik      = clean_str(data.get("nik"))
    nama     = (data.get("nama") or "").strip()
    nohp     = clean_str(data.get("nohp"))      # ✅ aman kalau int
    alamat   = clean_str(data.get("alamat"))

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
          SELECT COUNT(*) AS n FROM antrian WHERE status='menunggu'
        """).fetchone()["n"]

        dipanggil = conn.execute("""
          SELECT COUNT(*) AS n FROM antrian WHERE status='dipanggil'
        """).fetchone()["n"]

        selesai = conn.execute("""
          SELECT COUNT(*) AS n FROM antrian WHERE status='selesai'
        """).fetchone()["n"]
        
        skip = conn.execute("""
          SELECT COUNT(*) AS n FROM antrian WHERE status='dilewati'
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
          SET status='menunggu',
              created_at=datetime('now','localtime')
          WHERE id=?
        """, (antrian_id,))
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Antrian tidak ditemukan"}), 404

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)