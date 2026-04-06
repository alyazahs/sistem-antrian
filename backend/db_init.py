import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "antrian.db")

SCHEMA = """
PRAGMA foreign_keys = ON;

-- Tabel user 
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin_pelayanan','kasi_pelayanan')),
  status TEXT NOT NULL DEFAULT 'aktif' CHECK(status IN ('aktif','tidak_aktif','cuti')),
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- MASTER: Jenis Pelayanan (untuk dropdown)
CREATE TABLE IF NOT EXISTS master_jenis_pelayanan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  aktif INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- Tabel data pengunjung (master)
CREATE TABLE IF NOT EXISTS pengunjung (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rfid_uid TEXT UNIQUE,
  nik TEXT UNIQUE,
  nama TEXT NOT NULL,
  nohp TEXT,
  umur INTEGER,
  alamat TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- Tabel antrian
CREATE TABLE IF NOT EXISTS antrian (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pengunjung_id INTEGER NOT NULL,
  nomor_antrian INTEGER NOT NULL,
  jenis_pelayanan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu', -- menunggu | dipanggil | selesai | dilewati
  handled_by_user_id INTEGER,
  handled_by_nama TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (pengunjung_id) REFERENCES pengunjung(id) ON DELETE CASCADE
);

-- Metadata untuk nomor antrian
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);
"""

def ensure_column_exists(conn, table_name, column_name, column_def):
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    existing_columns = [row[1] for row in rows]

    if column_name not in existing_columns:
        conn.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}"
        )
        conn.commit()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SCHEMA)

        # migration untuk database lama
        ensure_column_exists(conn, "antrian", "handled_by_user_id", "INTEGER")
        ensure_column_exists(conn, "antrian", "handled_by_nama", "TEXT")

        conn.commit()
    finally:
        conn.close()