import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "antrian.db")

SCHEMA = """
PRAGMA foreign_keys = ON;

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
  rfid_uid TEXT UNIQUE,          -- UID RFID e-KTP (boleh NULL kalau daftar manual via NIK)
  nik TEXT UNIQUE,               -- NIK (untuk pencarian manual)
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
  status TEXT NOT NULL DEFAULT 'menunggu', -- menunggu | dipanggil | selesai
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (pengunjung_id) REFERENCES pengunjung(id) ON DELETE CASCADE
);

-- Metadata untuk nomor antrian
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);
"""

def init_db():
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()