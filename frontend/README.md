# Sistem Antrian Kecamatan Jiwan

Aplikasi sistem antrian digital untuk pelayanan administrasi Kecamatan Jiwan.
Project ini terdiri dari backend Flask, database SQLite, dan frontend React Vite.

## Fitur Utama

- Login petugas dengan role `admin_pelayanan` dan `kasi_pelayanan`
- Dashboard ringkasan pengunjung, layanan, dan aktivitas terbaru
- Pendaftaran pengunjung melalui scan RFID/e-KTP atau pencarian NIK manual
- Opsi antrian tanpa KTP untuk warga yang belum memiliki NIK/KTP
- Pengambilan nomor antrian dan cetak tiket
- Pemanggilan, lewati, selesai, dan panggil ulang antrian
- Display antrian realtime melalui SSE
- Master jenis pelayanan dan identitas
- Laporan pelayanan dengan filter, detail, dan export/preview PDF
- Kelola user untuk role `kasi_pelayanan`
- Edit profil petugas

## Struktur Project

```text
sistem-antrian/
  backend/
    app.py              # API Flask
    db_init.py          # Inisialisasi schema SQLite
    antrian.db          # Database lokal, diabaikan git
    printer_service.py  # Integrasi printer tiket
    rfid_reader.py      # Integrasi reader RFID
    tts_service.py      # Pengumuman suara
    requirements.txt
  frontend/
    src/
      api/              # Helper request API
      layout/           # Sidebar, headbar, layout utama
      pages/            # Halaman aplikasi
      components/       # Komponen fitur
    package.json
```

## Kebutuhan

- Python 3.10+
- Node.js 20+
- npm
- Perangkat RFID/printer bersifat opsional saat development. Jika perangkat tidak tersedia, service terkait tetap harus ditangani di environment masing-masing.

## Setup Backend

Jalankan dari folder root project:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend berjalan di:

```text
http://localhost:5000
```

Database SQLite akan dibuat otomatis oleh `db_init.py`.

## Setup Frontend

Jalankan dari folder `frontend`:

```bash
npm install
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

Vite sudah menyiapkan proxy `/api` ke backend di `http://localhost:5000`.

## Akun Default

Seed default dibuat otomatis saat backend berjalan:

```text
Email    : kasi@gmail.com
Password : kasi123
Role     : kasi_pelayanan
```

Segera ubah password setelah aplikasi siap digunakan.

## Environment

Backend memakai `SECRET_KEY` untuk token auth. Untuk production, isi environment variable:

```bash
set SECRET_KEY=isi_secret_yang_panjang_dan_acak
```

Frontend dapat memakai `.env` jika API tidak lewat proxy Vite:

```text
VITE_API_URL=http://localhost:5000
```

## Script Frontend

```bash
npm run dev      # menjalankan development server
npm run build    # build production
npm run preview  # preview hasil build
npm run lint     # cek lint frontend
```

## Endpoint Penting

- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `GET /api/jenis-pelayanan`
- `POST /api/daftar-pengunjung`
- `POST /api/ambil-antrian`
- `GET /api/antrian/stream`
- `POST /api/antrian/call-next`
- `GET /api/laporan`
- `GET /api/dashboard`