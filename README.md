# Sistem Manajemen Antrian Digital Kecamatan Jiwan

Dokumentasi ini disusun sebagai panduan bagi pengembang dalam melakukan instalasi, konfigurasi, pemeliharaan, serta pengembangan lanjutan Sistem Manajemen Antrian Digital Berbasis RFID E-KTP dan Text-to-Speech pada Kantor Kecamatan Jiwan.

## Deskripsi Sistem

Sistem Manajemen Antrian Digital Kecamatan Jiwan merupakan aplikasi berbasis web yang digunakan untuk mendukung proses pelayanan administrasi masyarakat secara digital. Sistem terintegrasi dengan teknologi RFID E-KTP untuk identifikasi pengunjung, printer thermal untuk pencetakan tiket antrian, serta Text-to-Speech (TTS) untuk pemanggilan nomor antrian secara otomatis.

## Fitur Utama

* Autentikasi pengguna berbasis token.
* Manajemen hak akses berdasarkan role pengguna.
* Dashboard statistik pelayanan dan aktivitas terbaru.
* Pendaftaran pengunjung melalui RFID E-KTP maupun input manual.
* Pengambilan nomor antrian secara otomatis.
* Pemanggilan antrian dengan teknologi Text-to-Speech (TTS).
* Display antrian publik secara real-time menggunakan Server-Sent Events (SSE).
* Pengelolaan data jenis pelayanan.
* Pengelolaan data identitas pengunjung.
* Laporan pelayanan dengan fitur pencarian, filter, export Excel, dan export PDF.
* Manajemen pengguna.
* Pengelolaan profil pengguna.

## Teknologi yang Digunakan

### Backend

* Python
* Flask
* Flask-CORS
* SQLite
* Werkzeug
* itsdangerous

### Frontend

* React 19
* Vite 7
* React Router
* Axios
* PrimeReact
* Tailwind CSS

### Export Laporan

* xlsx
* jspdf
* jspdf-autotable
* react-pdf

### Perangkat Keras

* Raspberry Pi 4 Model B
* RFID RC522 (MFRC522)
* Printer Thermal ESC/POS USB
* Speaker Audio
* Buzzer GPIO

## Kebutuhan Sistem

### Perangkat Lunak

* Python 3.10 atau lebih baru
* Node.js 20 atau lebih baru
* npm
* SQLite

### Perangkat Keras

* Raspberry Pi 4 Model B
* Modul RFID RC522
* Sensor Buzzer
* Printer Thermal USB
* Speaker Audio

Catatan:

Sistem tetap dapat dijalankan pada komputer atau laptop tanpa perangkat keras fisik. Dalam mode pengembangan, sistem menggunakan RFID dummy dan printer dummy untuk simulasi proses antrian.

## Instalasi Backend

Masuk ke folder backend:

```powershell
cd backend
```

Buat virtual environment:

```powershell
python -m venv .venv
```

Aktifkan virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependency:

```powershell
pip install -r requirements.txt
```

Jalankan aplikasi:

```powershell
python app.py
```

Database SQLite akan dibuat secara otomatis saat aplikasi dijalankan pertama kali.

## Instalasi Frontend

Masuk ke folder frontend:

```powershell
cd frontend
```

Install dependency:

```powershell
npm install
```

Jalankan aplikasi:

```powershell
npm run dev
```

## Hak Akses Pengguna

### Admin Pelayanan

* Login ke sistem
* Mengelola pendaftaran pengunjung
* Mengelola antrian
* Mengelola jenis pelayanan
* Melihat dashboard
* Mengakses laporan
* Mengubah profil

### Kasi Pelayanan

Memiliki seluruh hak akses Admin Pelayanan ditambah:

* Mengelola pengguna
* Menghapus data identitas pengunjung
* Menghapus data laporan

## Script Frontend

```powershell
npm run dev
npm run build
```
