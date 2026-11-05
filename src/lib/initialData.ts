import { Student, DismissalSettings, ClassActivity, Announcement, FeeItem, AttendanceRecord } from "@/types";

export const INITIAL_STUDENTS: Student[] = [
  { id: "std-1", name: "Arka", nisn: "0145594001", pin: "5594", pinHash: "864380e4c9a9bcfbd25db1f05f11a5748d20535ff0cb32e2760b0edadafa8a5e", gender: "L", parentName: "Bapak/Ibu Arka" },
  { id: "std-2", name: "Karel", nisn: "0146726002", pin: "6726", pinHash: "da62206ad3e7082dce03611c2674144feb7b6417ff66d7fb7ffd2352ef592ee0", gender: "L", parentName: "Bapak/Ibu Karel" },
  { id: "std-3", name: "Rashya", nisn: "0144373003", pin: "4373", pinHash: "15ebccd88dd5efd210146fd94546c5aa98de22d4b04d084b94e10beafc7f2786", gender: "L", parentName: "Bapak/Ibu Rashya" },
  { id: "std-4", name: "Bella", nisn: "0144090004", pin: "4090", pinHash: "2427ffcd041a0f5e3eb6b625f32a02c4306786dfda368ef7be3c9ee37e5b8cd9", gender: "P", parentName: "Bapak/Ibu Bella" },
  { id: "std-5", name: "Bilqis", nisn: "0147391005", pin: "7391", pinHash: "bdc774318fbd25b67e7d5c8f96f4e90d5900fdd709d2b488161617a52357488c", gender: "P", parentName: "Bapak/Ibu Bilqis" },
  { id: "std-6", name: "Ghita", nisn: "0149637006", pin: "9637", pinHash: "16f46d525720f43554c887bfed7a87c35c2d5d53edef0ab5d0222d3ac7cc5270", gender: "P", parentName: "Bapak/Ibu Ghita" },
  { id: "std-7", name: "Nazriel", nisn: "0145004007", pin: "5004", pinHash: "f8e3a1226c14f6e29d3442b1e1fb4cc7e41e6ed7ea7554a8cbe2b3924fca75d1", gender: "L", parentName: "Bapak/Ibu Nazriel" },
  { id: "std-8", name: "Nicho", nisn: "0142460008", pin: "2460", pinHash: "ade643f4661f5c788e5f2241ed3c2ec879b9ac1a82e9cc98e75a3bdbc4ef453a", gender: "L", parentName: "Bapak/Ibu Nicho" },
  { id: "std-9", name: "Yusak", nisn: "0144809009", pin: "4809", pinHash: "d80a47f0fe1a11059da163799aa34335178080cb6d17992ebaaf1df66c45c1a1", gender: "L", parentName: "Bapak/Ibu Yusak" },
  { id: "std-10", name: "Ragil", nisn: "0145389010", pin: "5389", pinHash: "f3f12062bc5ed8400f00ac9c668f7eee78d6aa530372aa594f1cb9ddac8be37f", gender: "L", parentName: "Bapak/Ibu Ragil" },
];

export const INITIAL_DISMISSAL: DismissalSettings = {
  regular: {
    1: "12:00",
    2: "12:45",
    3: "13:00",
    4: "13:00",
    5: "10:30",
    6: "10:30"
  },
  extracurricular: {
    2: "Ekstra Tari Prajuritan",
    3: "Ekstra TIK",
    4: "Ekstra BTQ (bagi yang beragama Islam)",
    5: "Infak / Persembahan",
    6: "Pramuka"
  },
  specials: []
};

export const INITIAL_ATTENDANCE_RECORD: AttendanceRecord = {
  Arka: "H",
  Karel: "S",
  Rashya: "H",
  Bella: "H",
  Bilqis: "H",
  Ghita: "H",
  Nazriel: "H",
  Nicho: "H",
  Yusak: "S",
  Ragil: "H"
};

export const INITIAL_ACTIVITIES: ClassActivity[] = [
  {
    id: "act-1",
    date: "2026-11-05",
    title: "Pembelajaran Tematik & Ekstra",
    text: "Selamat datang di Info Harian Kelas 4! 🎉 Absen, jam pulang, dan kegiatan kelas bisa dilihat di sini.",
    imageUrl: ""
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    date: "2026-11-05",
    type: "Info",
    title: "Portal Informasi Kelas 4",
    text: "Mulai sekarang informasi kelas dikabarkan lewat halaman ini untuk mempermudah komunikasi dan absensi harian."
  },
  {
    id: "ann-2",
    date: "2026-11-05",
    type: "PR",
    title: "Pekerjaan Rumah Tematik",
    text: "Membaca Buku Siswa Halaman 45-48 dan menjawab 3 pertanyaan latihan di buku tugas. Dikumpulkan besok pagi."
  },
  {
    id: "ann-3",
    date: "2026-11-05",
    type: "Jadwal",
    title: "Jadwal Pelajaran Kelas 4",
    text: "Senin: Upacara, Tematik, PJOK • Selasa: Tematik, Seni Tari • Rabu: Matematika, IPAS, TIK • Kamis: Bhs. Indonesia, PPKn, BTQ • Jumat: Senam, Agama, Infak • Sabtu: Bhs. Jawa, Bhs. Inggris, Pramuka"
  },
  {
    id: "ann-4",
    date: "2026-11-05",
    type: "Libur",
    title: "Informasi Hari Libur",
    text: "Tidak ada hari libur minggu ini. Seluruh kegiatan belajar mengajar berjalan sesuai jadwal normal."
  }
];

export const INITIAL_FEES: FeeItem[] = [
  {
    id: "fee-1",
    title: "Kas Kelas Bulan November",
    amount: 10000,
    target: "*"
  }
];

export const APP_SALT = "kw05";
export const ADMIN_PIN = "470560";
export const ADMIN_HASH = "e9e2c42b37346dc4908a971a0aa7104e5edf7bdf034aacecc89d9ba0df736fcd";
