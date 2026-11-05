# Info Harian Kelas 4 Ceria • SDN Kaliwungu 05

Aplikasi web informasi dan absensi harian kelas 4 SDN Kaliwungu 05 berbasis Next.js (TypeScript, Tailwind CSS) dan Firebase Cloud Firestore.

Aplikasi ini mempertahankan 100% antarmuka dan pengalaman pengguna versi awal (**Gaya Wonder**) yang ceria, ramah anak, dan responsif di smartphone maupun desktop, serta mengimplementasikan seluruh kebutuhan pada [PRD v2.0](./prd.md).

---

## 🌟 Fitur Utama

### 1. Dashboard Orang Tua / Wali Murid
- **Presensi Hari Ini:** Menampilkan status kehadiran anak (Hadir, Sakit, Izin, Alpa, Belum diabsen).
- **Jam Pulang & Ekstrakurikuler:** Jam pulang normal/khusus serta informasi kegiatan ekstrakurikuler hari tersebut.
- **Kegiatan Kelas:** Catatan kegiatan harian beserta foto dokumentasi.
- **Pekerjaan Rumah (PR):** Daftar tugas dan tanggal pengumpulan.
- **Jadwal Pelajaran:** Jadwal mata pelajaran mingguan.
- **Tagihan Iuran:** Status pembayaran per iuran (Lunas / Belum bayar).
- **Hari Libur & Pengumuman:** Informasi libur sekolah dan pengumuman guru.
- **Rekap Kehadiran Bulanan:** Statistik persentase kehadiran anak.
- **Pengajuan Izin Online:** Orang tua dapat mengirimkan keterangan izin atau sakit langsung ke guru kelas.

### 2. Mode Guru / Administrator
- **Presensi Harian:** Pilih tanggal, tandai status (H/S/I/A), tombol cepat "Semua Hadir", dan ekspor rekap ke format CSV (Excel).
- **Jadwal Pulang:** Atur jam pulang reguler Senin–Sabtu, ekstrakurikuler, dan tambah jam pulang khusus (pulang lebih awal/lambat).
- **Catatan Kegiatan:** Tulis kegiatan kelas dan upload foto dokumentasi dengan kompresi otomatis.
- **Pengumuman & PR:** Buat dan hapus pengumuman berdasarkan kategori (PR, Jadwal, Libur, Info).
- **Iuran & Kas:** Tambah jenis tagihan (ke semua murid atau murid tertentu), pantau pembayaran, dan toggle status lunas.
- **Izin Online:** Tinjau pengajuan izin dari orang tua dan terapkan langsung ke absensi dengan satu klik.
- **Kelola Data Siswa:** Tambah siswa baru, ubah PIN, atur NISN, dan ekspor data siswa ke CSV.
- **Sinkronisasi Firebase:** Status koneksi dan tombol 1-klik untuk mengunggah seluruh data ke Firebase Cloud Firestore.

---

## 🔑 Akun & PIN Default

### Orang Tua Murid (4 Digit PIN):
| Nama Murid | NISN | PIN |
|---|---|---|
| **Arka** | 0145594001 | `5594` |
| **Karel** | 0146726002 | `6726` |
| **Rashya** | 0144373003 | `4373` |
| **Bella** | 0144090004 | `4090` |
| **Bilqis** | 0147391005 | `7391` |
| **Ghita** | 0149637006 | `9637` |
| **Nazriel** | 0145004007 | `5004` |
| **Nicho** | 0142460008 | `2460` |
| **Yusak** | 0144809009 | `4809` |
| **Ragil** | 0145389010 | `5389` |

### Mode Guru:
- **PIN Guru:** `470560` (langsung masuk ke Mode Guru)
- **Firebase Auth:** Login menggunakan email & password guru jika sudah didaftarkan di Firebase Authentication.

---

## 🚀 Menjalankan Proyek Lokal

```bash
# 1. Install dependencies
npm install

# 2. Jalankan mode pengembangan
npm run dev

# 3. Atau build untuk produksi
npm run build
npm start
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## ☁️ Konfigurasi Firebase

Proyek telah terhubung dengan konfigurasi Firebase:
- **Project ID:** `infokelas-ed434`
- **Auth Domain:** `infokelas-ed434.firebaseapp.com`
- **Storage Bucket:** `infokelas-ed434.firebasestorage.app`

### Langkah Aktivasi di Firebase Console:
1. Masuk ke [Firebase Console](https://console.firebase.google.com/) dan pilih proyek **infokelas-ed434**.
2. **Cloud Firestore:** Buka menu **Build > Firestore Database** > Klik **Create Database** > pilih lokasi (misal `asia-southeast2` Jakarta) > pilih **Start in test mode** atau gunakan aturan di [`firestore.rules`](./firestore.rules).
3. **Sinkronisasi Data:** Setelah database aktif, masuk ke aplikasi dengan PIN Guru (`470560`), buka tab **☁️ Firebase**, dan klik **🚀 Sinkronkan / Unggah Seluruh Data ke Firestore**.

---

## 🚢 Deployment ke Vercel

1. Push repository ini ke GitHub.
2. Buka [Vercel](https://vercel.com/) dan import repository `infokelas`.
3. Tambahkan Environment Variables dari file `.env.example`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Klik **Deploy**.
