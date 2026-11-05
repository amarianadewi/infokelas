# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# INFO HARIAN KELAS 4 CERIA
**SDN Kaliwungu 05**

Versi: 2.0  
Platform: Web Application (Responsive)  
Target deployment: Vercel  
Database: Firebase Cloud Firestore

---

## 1. Ringkasan Produk

**Info Harian Kelas 4 Ceria** merupakan aplikasi informasi dan komunikasi satu arah antara guru kelas dan orang tua/wali siswa. Aplikasi ini menjadi pusat informasi harian yang memudahkan orang tua mengetahui aktivitas, kehadiran, jadwal, pekerjaan rumah, pengumuman, dan informasi administrasi kelas.

Aplikasi merupakan pengembangan dari aplikasi awal dengan mempertahankan fitur-fitur yang sudah tersedia. Pengembangan difokuskan pada pembaruan arsitektur aplikasi, autentikasi pengguna, pengelolaan data, keamanan, dan pengalaman penggunaan lintas perangkat.

### 1.1 Tujuan
- Mempermudah guru menyampaikan informasi kelas.
- Memudahkan orang tua memantau informasi anak.
- Menyediakan data kehadiran dan administrasi kelas secara terpusat.
- Mengurangi ketergantungan pada penyampaian informasi melalui grup pesan.
- Menyediakan aplikasi yang mudah digunakan melalui ponsel maupun komputer.

### 1.2 Prinsip Pengembangan
1. Mempertahankan fitur inti aplikasi awal.
2. Tidak menambahkan modul yang tidak diperlukan.
3. Antarmuka sederhana, bersih, dan mudah dipahami.
4. Mengutamakan penggunaan melalui smartphone tanpa mengurangi kenyamanan di desktop.
5. Data hanya dapat dikelola oleh guru/admin yang berwenang.
6. Orang tua hanya dapat melihat informasi yang relevan dengan anaknya.

---

## 2. Ruang Lingkup

### 2.1 Pengguna

**A. Guru/Admin**
- Satu akun administrator.
- Login menggunakan Firebase Authentication (email dan password).
- Memiliki akses penuh untuk mengelola data kelas.
- Dapat menambah, mengubah, dan menghapus informasi.

**B. Orang Tua/Wali**
- Login menggunakan NISN dan PIN.
- Hanya dapat melihat informasi.
- Tidak memiliki akses untuk mengubah data.
- Akun orang tua terhubung dengan data siswa.

### 2.2 Batasan Produk
- Aplikasi hanya digunakan untuk satu kelas.
- Tidak memerlukan sistem multi-sekolah.
- Tidak memerlukan sistem multi-role yang kompleks.
- Tidak menyediakan fitur chat atau konsultasi pribadi.
- Tidak menyediakan kolom komentar orang tua.
- Tidak menyediakan modul laporan perkembangan akademik baru di luar fitur aplikasi awal.

---

## 3. Modul dan Fitur Utama

### 3.1 Dashboard

**Dashboard Guru**
Menampilkan ringkasan informasi kelas:
- Jumlah siswa.
- Ringkasan kehadiran hari ini.
- Informasi atau pengumuman terbaru.
- Catatan kegiatan terbaru.
- Informasi pekerjaan rumah.
- Informasi administrasi atau iuran.

**Dashboard Orang Tua**
Menampilkan:
- Identitas siswa.
- Status kehadiran hari ini.
- Informasi terbaru dari guru.
- Jadwal pelajaran.
- PR atau tugas.
- Informasi jam pulang.
- Informasi kegiatan kelas.

### 3.2 Data Siswa

Guru dapat:
- Menambahkan data siswa.
- Mengubah data siswa.
- Menghapus data siswa.
- Melihat daftar siswa.
- Mengelola NISN.
- Menghubungkan akun orang tua dengan siswa.

Data minimal:
- Nama lengkap siswa.
- NISN.
- Jenis kelamin.
- Nama orang tua/wali.
- Nomor kontak orang tua (opsional).
- PIN akses orang tua.

### 3.3 Absensi Siswa

Guru dapat mengelola kehadiran siswa dengan kategori:
- Hadir.
- Sakit.
- Izin.
- Alpa.

Kemampuan:
- Mengisi absensi harian.
- Mengubah status kehadiran.
- Melihat daftar kehadiran berdasarkan tanggal.
- Melihat rekap kehadiran bulanan.
- Menampilkan status kehadiran kepada orang tua.

Orang tua dapat melihat riwayat kehadiran anaknya.

### 3.4 Izin Online

Orang tua dapat mengirimkan pemberitahuan izin atau sakit melalui aplikasi.

Data pengajuan:
- Nama siswa (terisi otomatis).
- Tanggal izin.
- Kategori: Sakit atau Izin.
- Keterangan.
- Waktu pengajuan.

Guru dapat:
- Melihat pengajuan izin.
- Menggunakan informasi pengajuan sebagai dasar pembaruan absensi.
- Mengubah status kehadiran siswa sesuai kondisi sebenarnya.

Pengajuan izin tidak otomatis mengubah status absensi tanpa tindakan atau konfirmasi guru.

### 3.5 Jam Pulang

Guru dapat:
- Mengatur jam pulang reguler.
- Mengumumkan perubahan jam pulang.
- Menambahkan keterangan perubahan.

Orang tua dapat melihat informasi jam pulang terbaru.

### 3.6 Ekstrakurikuler

Guru dapat:
- Menambahkan informasi ekstrakurikuler.
- Mengatur hari dan waktu kegiatan.
- Menambahkan keterangan kegiatan.
- Mengubah atau menghapus informasi.

Orang tua dapat melihat informasi ekstrakurikuler kelas.

### 3.7 Catatan Kegiatan Kelas

Guru dapat membuat dokumentasi kegiatan kelas dengan:
- Judul kegiatan.
- Tanggal kegiatan.
- Deskripsi kegiatan.
- Foto dokumentasi.

Orang tua dapat melihat dokumentasi kegiatan yang telah dipublikasikan.

### 3.8 Informasi dan Pengumuman

Guru dapat:
- Membuat pengumuman.
- Mengubah pengumuman.
- Menghapus pengumuman.
- Menambahkan tanggal publikasi.
- Menentukan informasi yang ditampilkan kepada orang tua.

Pengumuman ditujukan kepada seluruh orang tua siswa di kelas.

### 3.9 Pekerjaan Rumah (PR)

Guru dapat:
- Menambahkan PR atau tugas.
- Menentukan tanggal pemberian.
- Menentukan batas pengumpulan jika diperlukan.
- Menambahkan deskripsi tugas.
- Mengubah atau menghapus tugas.

Orang tua dapat melihat daftar PR dan informasi tugas anak.

### 3.10 Jadwal Pelajaran

Guru dapat:
- Mengelola jadwal pelajaran.
- Menentukan mata pelajaran berdasarkan hari.
- Mengubah jadwal.
- Menghapus jadwal.

Orang tua dapat melihat jadwal pelajaran mingguan.

### 3.11 Hari Libur

Guru dapat:
- Menambahkan tanggal libur.
- Menambahkan nama atau keterangan hari libur.
- Mengubah dan menghapus data.

Informasi hari libur dapat dilihat seluruh orang tua.

### 3.12 Iuran dan Tagihan

Guru dapat:
- Membuat jenis iuran atau tagihan.
- Menentukan nominal.
- Menentukan periode atau tanggal pembayaran.
- Mengelola status pembayaran setiap siswa.
- Mengubah status pembayaran.
- Melihat rekap pembayaran.

Status pembayaran minimal:
- Belum membayar.
- Sudah membayar.

Orang tua hanya dapat melihat tagihan dan status pembayaran anaknya.

### 3.13 Rekap Kehadiran Bulanan

Guru dapat melihat:
- Rekap jumlah hadir.
- Rekap sakit.
- Rekap izin.
- Rekap alpa.
- Rekap per siswa.
- Rekap berdasarkan bulan.

Orang tua hanya dapat melihat rekap kehadiran anaknya.

---

## 4. Hak Akses Pengguna

| Modul | Guru/Admin | Orang Tua |
|---|---|---|
| Dashboard | Kelola dan lihat | Lihat |
| Data siswa | Kelola | Lihat identitas anak |
| Absensi | Kelola | Lihat |
| Izin online | Lihat dan tindak lanjuti | Kirim pengajuan |
| Jam pulang | Kelola | Lihat |
| Ekstrakurikuler | Kelola | Lihat |
| Catatan kegiatan | Kelola | Lihat |
| Pengumuman | Kelola | Lihat |
| PR | Kelola | Lihat |
| Jadwal pelajaran | Kelola | Lihat |
| Hari libur | Kelola | Lihat |
| Iuran/tagihan | Kelola | Lihat |
| Rekap kehadiran | Lihat dan kelola | Lihat data anak |

---

## 5. Autentikasi dan Keamanan

### 5.1 Login Guru
Menggunakan Firebase Authentication dengan metode:
- Email.
- Password.

Guru dapat:
- Login.
- Logout.
- Mengubah password melalui mekanisme Firebase Authentication.
- Mempertahankan sesi login secara aman.

Tidak tersedia registrasi akun guru secara publik.

### 5.2 Login Orang Tua
Menggunakan kombinasi:
- NISN.
- PIN.

Alur:
1. Orang tua membuka halaman login.
2. Memasukkan NISN dan PIN.
3. Server memverifikasi data melalui Firebase Admin SDK.
4. Jika valid, server membuat sesi autentikasi yang sesuai.
5. Orang tua diarahkan ke dashboard.
6. Aplikasi hanya menampilkan data siswa yang terhubung dengan akun tersebut.

**Ketentuan keamanan penting:**
- PIN tidak boleh disimpan dalam bentuk teks biasa.
- Verifikasi PIN dilakukan di server, bukan hanya di browser.
- Gunakan hashing PIN yang aman.
- Terapkan pembatasan percobaan login.
- Hindari memberikan informasi yang dapat membocorkan apakah suatu NISN terdaftar.
- Sediakan mekanisme perubahan atau reset PIN oleh guru/admin.

Firestore berfungsi sebagai database, bukan penyedia autentikasi. Karena itu, proses verifikasi NISN dan PIN harus dilakukan melalui backend yang aman.

### 5.3 Firestore Security Rules
- Pengguna tidak boleh membaca data di luar hak aksesnya.
- Orang tua hanya boleh membaca data anak yang terhubung dengannya.
- Orang tua tidak boleh mengubah data absensi, pembayaran, pengumuman, atau informasi kelas.
- Operasi administratif dilakukan melalui backend dengan Firebase Admin SDK.
- Validasi hak akses wajib dilakukan di server dan Firestore Security Rules.

---

## 6. Struktur Teknologi

| Komponen | Teknologi |
|---|---|
| Framework | Next.js |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| Komponen UI | shadcn/ui |
| Autentikasi guru | Firebase Authentication |
| Autentikasi orang tua | NISN + PIN melalui backend |
| Database | Cloud Firestore |
| Penyimpanan foto | Firebase Storage |
| Backend | Next.js API Routes / Server Functions |
| Hosting | Vercel |
| Version control | GitHub |
| Admin SDK | Firebase Admin SDK |

### 6.1 Arsitektur
- Frontend menggunakan Next.js.
- Data disimpan di Cloud Firestore.
- Foto kegiatan disimpan di Firebase Storage.
- Operasi sensitif diproses melalui backend.
- Firebase Admin SDK hanya digunakan di server.
- Aplikasi di-deploy melalui Vercel.
- Kode sumber dikelola melalui GitHub.

### 6.2 Environment Variables
Seluruh konfigurasi sensitif harus menggunakan environment variables.

Contoh kebutuhan konfigurasi:
- Firebase project configuration.
- Firebase Admin credentials.
- Firebase Storage configuration.
- Konfigurasi domain aplikasi.

Jangan pernah memasukkan private key atau secret ke dalam kode frontend maupun repository publik.

---

## 7. Struktur Data Firestore

Struktur koleksi yang direkomendasikan:

| Collection | Fungsi |
|---|---|
| `students` | Data siswa |
| `parent_accounts` | Akun dan relasi orang tua dengan siswa |
| `attendance` | Data absensi harian |
| `leave_requests` | Pengajuan izin online |
| `announcements` | Pengumuman |
| `activities` | Catatan dan dokumentasi kegiatan |
| `homework` | Pekerjaan rumah |
| `schedules` | Jadwal pelajaran |
| `holidays` | Hari libur |
| `extracurriculars` | Informasi ekstrakurikuler |
| `dismissal_settings` | Pengaturan jam pulang |
| `fees` | Jenis iuran dan tagihan |
| `payments` | Status pembayaran siswa |
| `settings` | Konfigurasi aplikasi |

Setiap dokumen yang relevan perlu memiliki metadata:
- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`

Gunakan server timestamp untuk pencatatan waktu.

---

## 8. Desain UI/UX

### 8.1 Prinsip Desain
- Modern.
- Bersih dan minimalis.
- Ramah untuk guru dan orang tua.
- Tidak terlalu ramai.
- Navigasi mudah dipahami.
- Tipografi mudah dibaca.
- Warna memiliki kontras yang baik.

### 8.2 Responsive Design
Aplikasi wajib mendukung:
- Smartphone Android.
- Smartphone iOS.
- Tablet.
- Laptop.
- Desktop.

Pendekatan desain:
- Mobile-first.
- Navigasi mobile sederhana.
- Dashboard desktop memanfaatkan ruang layar.
- Tabel data desktop dapat berubah menjadi tampilan kartu pada perangkat kecil.
- Formulir mudah diisi menggunakan layar sentuh.
- Tombol memiliki ukuran yang nyaman untuk pengguna ponsel.

### 8.3 Layout Guru
- Sidebar pada desktop.
- Navigasi ringkas pada perangkat mobile.
- Dashboard dengan kartu ringkasan.
- Tabel pengelolaan data.
- Formulir tambah/edit menggunakan dialog atau halaman khusus.
- Konfirmasi sebelum penghapusan data.

### 8.4 Layout Orang Tua
- Dashboard sederhana.
- Informasi penting ditampilkan lebih dahulu.
- Navigasi menggunakan menu yang mudah dijangkau.
- Status kehadiran, PR, jam pulang, dan pengumuman mudah ditemukan.

---

## 9. Deployment dan Operasional

### 9.1 Deployment
- Repository proyek berada di GitHub.
- Vercel terhubung dengan repository.
- Setiap perubahan pada branch utama dapat memicu deployment.
- Environment variables dikonfigurasi melalui dashboard Vercel.
- Domain dapat disesuaikan kemudian.

### 9.2 Backup
Sediakan kemampuan ekspor data penting ke format CSV atau Excel, terutama:
- Data siswa.
- Absensi.
- Rekap kehadiran.
- Data iuran dan pembayaran.

Backup data Firestore tetap perlu direncanakan secara terpisah dari ekspor laporan aplikasi.

### 9.3 Penyimpanan Foto
- Foto kegiatan disimpan di Firebase Storage.
- Ukuran gambar dioptimalkan sebelum upload.
- Validasi jenis dan ukuran file.
- Hapus file terkait ketika dokumentasi dihapus jika tidak lagi digunakan.

---

## 10. Kebutuhan Nonfungsional

1. Aplikasi harus responsif dan nyaman digunakan di perangkat mobile maupun desktop.
2. Waktu pemuatan halaman harus dioptimalkan.
3. Data harus konsisten antara tampilan guru dan orang tua.
4. Operasi penting harus memiliki validasi.
5. Aplikasi harus menangani kondisi loading, data kosong, dan error.
6. Data pribadi siswa harus dilindungi.
7. Tidak boleh ada akses publik terhadap data administrasi siswa.
8. Penghapusan data penting harus memiliki konfirmasi.
9. Tanggal dan waktu menggunakan zona waktu Indonesia Barat (WIB).
10. Aplikasi harus memiliki penanganan sesi login dan logout yang baik.

---

## 11. Kriteria Penerimaan (Acceptance Criteria)

Aplikasi dinyatakan memenuhi kebutuhan apabila:

### Autentikasi
- Guru dapat login menggunakan email dan password.
- Orang tua dapat login menggunakan NISN dan PIN.
- Orang tua tidak dapat mengakses data siswa lain.
- Pengguna yang belum login tidak dapat mengakses dashboard privat.

### Pengelolaan Data
- Guru dapat mengelola seluruh fitur utama.
- Data tersimpan di Firestore.
- Data yang diperbarui dapat ditampilkan sesuai hak akses.
- Orang tua hanya dapat melihat data.

### Absensi
- Guru dapat mengisi status kehadiran.
- Orang tua dapat melihat status kehadiran anak.
- Rekap bulanan dapat ditampilkan dengan benar.

### Izin Online
- Orang tua dapat mengirim pengajuan izin.
- Guru dapat melihat pengajuan.
- Pengajuan tidak otomatis mengubah absensi.

### Tampilan
- Semua fitur utama dapat digunakan di smartphone.
- Semua fitur utama dapat digunakan di PC/laptop.
- Tidak ada elemen penting yang terpotong pada ukuran layar umum.

### Deployment
- Aplikasi dapat diakses melalui domain Vercel.
- Konfigurasi rahasia tidak terekspos di frontend.
- Firebase dapat berkomunikasi dengan aplikasi yang telah di-deploy.

---

## 12. Di Luar Ruang Lingkup

Untuk menjaga aplikasi tetap sederhana, fitur berikut tidak termasuk dalam pengembangan:
- Chat pribadi guru dan orang tua.
- Forum diskusi atau komentar.
- Sistem pembayaran online.
- Integrasi payment gateway.
- Multi-kelas.
- Multi-sekolah.
- Multi-role administrator.
- Sistem rapor digital.
- Modul penilaian akademik baru.

---

## 13. Prioritas Pengembangan

**Tahap 1 — Fondasi**
- Setup Next.js dan TypeScript.
- Setup Firebase.
- Setup autentikasi guru.
- Setup autentikasi orang tua.
- Setup struktur Firestore.
- Setup keamanan backend dan Firestore Rules.

**Tahap 2 — Fitur Inti**
- Dashboard.
- Data siswa.
- Absensi.
- Pengumuman.
- PR.
- Jadwal pelajaran.
- Jam pulang.

**Tahap 3 — Fitur Pendukung**
- Catatan kegiatan dan foto.
- Ekstrakurikuler.
- Hari libur.
- Iuran dan tagihan.
- Rekap kehadiran.
- Izin online.

**Tahap 4 — Penyempurnaan**
- Responsive testing.
- Validasi keamanan.
- Optimasi performa.
- Pengujian hak akses.
- Deployment Vercel.
- Pengujian akhir bersama guru dan orang tua.

---

## 14. Catatan untuk Tim Pengembang

Aplikasi harus dikembangkan berdasarkan fitur dan alur kerja aplikasi awal. Jangan menghilangkan fitur lama hanya karena arsitektur teknologinya berubah.

Sebelum implementasi:
1. Pelajari seluruh tampilan dan alur aplikasi awal.
2. Petakan setiap fitur lama ke modul baru.
3. Pertahankan istilah dan informasi yang sudah dikenal pengguna.
4. Pastikan data siswa, absensi, dan administrasi tidak tercampur antar pengguna.
5. Implementasikan autentikasi dan keamanan sebelum membuka akses orang tua.
6. Uji aplikasi pada smartphone dan desktop.

**Target akhir:** aplikasi informasi kelas yang sederhana, aman, cepat, mudah dikelola guru, dan mudah diakses orang tua.