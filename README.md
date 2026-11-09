# MeetMe — Sistem Reservasi Ruang Rapat Kantor (BPS)

Aplikasi web reservasi dan manajemen ruang rapat kantor modern berbasis **Laravel 11 (Backend API)** dan **React 18 + TailwindCSS + Vite (Frontend)**.

---

## 🌟 Fitur Utama

1. **Katalog & Pemilihan Jadwal Ruangan Rapat:**
   - Visualisasi ruangan, kapasitas, fasilitas lengkap, dan status ketersediaan secara real-time.
   - Pengecekan bentrok jadwal otomatis hingga tingkat menit.
2. **📲 Pengingat & Berbagi Jadwal via WhatsApp:**
   - Generator tautan otomatis untuk membagikan detail rapat lengkap ke WhatsApp tim (ruangan, waktu, agenda, PIN, dan link Google Calendar).
3. **📱 QR Code & PIN Check-In Ruangan:**
   - Mencegah *ghost booking* / *no-show* dengan sistem verifikasi mandiri di aplikasi web atau tablet pintu.
4. **☕ Layanan Fasilitas & Konsumsi Rapat (Catering):**
   - Pemesanan peralatan teknis (Mic Wireless, Pointer, HDMI Converter, Whiteboard Marker) dan konsumsi (Kopi/Teh, Snack Box, Nasi Box) beserta jumlah Pax.
5. **🔁 Reservasi Berulang (Recurring Meeting):**
   - Mendukung jadwal rutin mingguan (4 sesi), 2 mingguan (2 sesi), dan bulanan (3 sesi) dengan validasi bentrok menyeluruh.
6. **📺 Layanan Layar Pintu Ruangan (Door Signage / Kiosk Mode):**
   - Rute mandiri `/rooms/:id/display` yang didesain khusus untuk tablet dinding pintu meeting room.
   - Indikator visual hijau/merah, hitung mundur sisa waktu, dan tombol **⚡ Rapat Kilat Spontan (15 / 30 / 45 / 60 menit)** sekali sentuh.
7. **📊 Export Laporan Penggunaan Ruangan (CSV / Excel):**
   - Admin dapat mengekspor rekap seluruh data reservasi ke format CSV (UTF-8 BOM) yang langsung terbaca rapi di Microsoft Excel.
8. **💬 Alasan Pembatalan dari Admin:**
   - Admin dapat mencatat alasan pembatalan yang langsung tampil di detail reservasi peminjam.
9. **👥 Manajemen Pengguna & Multi-Role:**
   - Role Administrator (kelola ruangan, reservasi, pantau seluruh data karyawan) dan Karyawan/User.
   - Autentikasi Google Login & kredensial reguler.

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat Sistem
- PHP >= 8.2 & Composer
- Node.js >= 18 & npm
- MySQL / MariaDB

### 2. Backend (Laravel 11)
```bash
cd backend

# Salin konfigurasi environment
cp .env.example .env

# Install dependensi PHP
composer install

# Generate application key
php artisan key:generate

# Konfigurasi database di file .env, lalu jalankan migrasi & seeder:
php artisan migrate --seed

# Buat symbolic link storage berkas & gambar:
php artisan storage:link

# Jalankan server backend:
php artisan serve
# Berjalan di: http://localhost:8000
```

### 3. Frontend (React 18 + Vite)
```bash
cd frontend

# Salin konfigurasi environment
cp .env.example .env

# Install dependensi Node.js
npm install

# Jalankan server pengembangan Vite:
npm run dev
# Berjalan di: http://localhost:5173
```

---

## 🔒 Akun Bawaan Demo
- **Administrator:** `admin@roombooking.com` / `password`
- **User / Karyawan:** `user@roombooking.com` / `password`

---

## 📄 Lisensi
MeetMe dikembangkan untuk keperluan internal kantor Badan Pusat Statistik (BPS).
