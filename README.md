# Sistem Antrian Kecamatan Jiwan

Aplikasi sistem antrian digital untuk pelayanan administrasi Kecamatan Jiwan. Proyek ini memakai backend Flask, database SQLite lokal, dan frontend React Vite.

## Fitur

- Autentikasi petugas dengan token bearer.
- Role `admin_pelayanan` dan `kasi_pelayanan`.
- Dashboard ringkasan antrian, grafik bulanan, dan aktivitas terbaru.
- Pendaftaran pengunjung melalui scan RFID/e-KTP dummy atau input manual.
- Pencarian NIK dan pengambilan nomor antrian.
- Cetak tiket antrian melalui printer thermal USB, dengan fallback dummy.
- Pemanggilan antrian, selesai dilayani, dilewati, dan panggil ulang.
- Display antrian publik dengan pembaruan realtime via Server-Sent Events.
- Master jenis pelayanan.
- Master identitas/pengunjung.
- Laporan pelayanan dengan filter tanggal/keyword, detail, hapus log, export Excel, dan preview/export PDF.
- Manajemen user untuk role `kasi_pelayanan`.
- Edit profil petugas.
- Pengumuman suara antrian memakai TTS.

## Teknologi

- Backend: Python, Flask, Flask-CORS, SQLite, itsdangerous, Werkzeug.
- Frontend: React 19, Vite 7, React Router, Axios, PrimeReact, Tailwind CSS.
- Export laporan: `xlsx`, `jspdf`, `jspdf-autotable`, `react-pdf`.
- Hardware opsional: MFRC522 RFID, buzzer GPIO, printer thermal ESC/POS USB.

## Struktur Folder

```text
sistem-antrian/
  backend/
    app.py              # API Flask dan route utama
    db_init.py          # Inisialisasi dan migrasi ringan database SQLite
    rfid_reader.py      # Reader RFID; otomatis dummy jika bukan Raspberry Pi
    printer_service.py  # Cetak tiket thermal; fallback dummy jika printer gagal
    tts_service.py      # Antrean pengumuman suara
    requirements.txt    # Dependensi Python
  frontend/
    src/
      api/              # Axios client dan helper API
      components/       # Komponen fitur
      layout/           # Sidebar, headbar, layout aplikasi
      pages/            # Halaman aplikasi
      utils/            # Helper umum
    public/             # Logo dan aset publik
    package.json        # Script dan dependensi frontend
```

## Kebutuhan

- Python 3.10 atau lebih baru.
- Node.js 20 atau lebih baru.
- npm.
- SQLite sudah dipakai melalui modul bawaan Python.
- Untuk perangkat fisik: Raspberry Pi, modul RFID MFRC522, GPIO, dan printer thermal USB ESC/POS sesuai konfigurasi di `backend/printer_service.py`.

Saat development di laptop/PC tanpa hardware, aplikasi tetap bisa berjalan. RFID akan memakai nilai dummy dari `DUMMY_RFID`, dan printer akan menulis output dummy ke console jika koneksi printer tidak tersedia.

## Setup Backend

Jalankan dari root proyek:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Backend berjalan di:

```text
http://localhost:5000
```

Database `backend/antrian.db` dibuat otomatis saat `app.py` dijalankan. Schema utama berisi tabel:

- `users`
- `master_jenis_pelayanan`
- `pengunjung`
- `antrian`
- `metadata`

Catatan untuk development non-Raspberry Pi: beberapa dependensi hardware seperti `RPi.GPIO`, `spidev`, atau `mfrc522` bisa gagal dipasang di Windows. Jika hanya ingin menjalankan mode dummy, pasang dependensi core Flask/frontend terlebih dahulu atau sesuaikan sementara bagian hardware di `requirements.txt` sesuai environment.

## Setup Frontend

Jalankan dari root proyek:

```powershell
cd frontend
npm install
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

Vite sudah mem-proxy request `/api` ke:

```text
http://localhost:5000
```

## Akun Default

Backend membuat akun default jika email berikut belum ada:

```text
Email    : kasi@gmail.com
Password : kasi123
Role     : kasi_pelayanan
Status   : aktif
```

Ubah password setelah aplikasi dipakai di lingkungan nyata.

## Environment

Backend membaca beberapa environment variable opsional:

```powershell
$env:SECRET_KEY="isi_secret_yang_panjang_dan_acak"
$env:DUMMY_RFID="DUMMY-RFID-123456"
```

- `SECRET_KEY` dipakai untuk menandatangani token auth. Default development adalah `DEV_SECRET_CHANGE_ME`.
- `DUMMY_RFID` dipakai oleh mode RFID dummy saat modul Raspberry Pi tidak tersedia.

Frontend saat ini memakai `baseURL: "/api"` sehingga normalnya cukup lewat proxy Vite. Jika deployment tidak memakai proxy yang sama, sesuaikan konfigurasi API di `frontend/src/api/index.js`.

## Role dan Hak Akses

`admin_pelayanan`:

- Login dan edit profil.
- Mengelola pendaftaran dan antrian.
- Melihat dashboard, master, identitas, dan laporan.
- Membuat, mengubah, dan menghapus jenis pelayanan.

`kasi_pelayanan`:

- Semua akses `admin_pelayanan`.
- Mengelola user.
- Menghapus data identitas/pengunjung.
- Menghapus log laporan, baik satu data maupun sesuai filter.

## Route Frontend

```text
/login
/dashboard
/pendaftaran
/antrian
/displayAntrian
/master/jenis
/master/identitas
/laporan
/users
/edit-profile
```

Route `/` dan route tidak dikenal diarahkan ke `/dashboard`.

## Endpoint API Utama

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

Users:

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/<id>`
- `PUT /api/users/<id>/password`
- `DELETE /api/users/<id>`

Master dan pengunjung:

- `GET /api/jenis-pelayanan`
- `POST /api/jenis-pelayanan`
- `PUT /api/jenis-pelayanan/<id>`
- `DELETE /api/jenis-pelayanan/<id>`
- `GET /api/pengunjung`
- `DELETE /api/pengunjung/<id>`
- `GET /api/scan-rfid`
- `GET /api/cari-nik?nik=...`
- `POST /api/daftar-pengunjung`

Antrian:

- `POST /api/ambil-antrian`
- `GET /api/antrian/summary`
- `GET /api/antrian/now`
- `GET /api/antrian/list`
- `POST /api/antrian/call-next`
- `POST /api/antrian/serve/<id>`
- `POST /api/antrian/skip/<id>`
- `POST /api/antrian/recall/<id>`
- `GET /api/antrian/display`
- `GET /api/antrian/stream`

Laporan dan dashboard:

- `GET /api/laporan`
- `DELETE /api/laporan`
- `DELETE /api/laporan/<id>`
- `GET /api/dashboard`
- `GET /api/dashboard/chart?tahun=YYYY`
- `GET /api/dashboard/recent?limit=5`

## Script Frontend

```powershell
npm run dev      # menjalankan Vite development server
npm run build    # build production
npm run preview  # preview hasil build
npm run lint     # cek lint frontend
```

## Catatan Operasional

- Jalankan backend lebih dulu sebelum membuka frontend.
- Token auth berlaku maksimal 12 jam.
- Nomor antrian dihitung ulang per hari berdasarkan tanggal lokal SQLite.
- Display antrian memakai SSE, jadi browser display perlu tetap terhubung ke backend.
- Printer thermal dikonfigurasi dengan `USB_VENDOR_ID = 0x0033` dan `USB_PRODUCT_ID = 0x3107` di `backend/printer_service.py`.
