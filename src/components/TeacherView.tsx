"use client";

import React, { useState, useEffect } from "react";
import {
  Student,
  AttendanceRecord,
  DismissalSettings,
  ClassActivity,
  Announcement,
  FeeItem,
  LeaveRequest
} from "@/types";
import {
  STATUS_LABELS,
  DAY_NAMES,
  formatDateIndo,
  formatShortDateIndo,
  formatRupiah,
  getTodayDateString,
  downloadCSV
} from "@/lib/formatters";
import {
  saveStudent,
  deleteStudent,
  saveAttendance,
  getAllAttendance,
  saveDismissalSettings,
  addActivity,
  deleteActivity,
  addAnnouncement,
  deleteAnnouncement,
  addFee,
  deleteFee,
  togglePayment,
  updateLeaveRequestStatus,
  hashPin,
  subscribeStudents,
  subscribeAttendance,
  subscribeDismissal,
  subscribeActivities,
  subscribeAnnouncements,
  subscribeFees,
  subscribePayments,
  subscribeLeaveRequests
} from "@/lib/dataService";
import Header from "./Header";

interface TeacherViewProps {
  onLogout: () => void;
}

export default function TeacherView({ onLogout }: TeacherViewProps) {
  const [tab, setTab] = useState<"absen" | "pulang" | "keg" | "info" | "iuran" | "izin" | "siswa">("absen");
  const [toastMessage, setToastMessage] = useState("");

  // Data state (disinkronkan secara real-time via onSnapshot)
  const [students, setStudents] = useState<Student[]>([]);
  const [currentDate, setCurrentDate] = useState(getTodayDateString());
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [dismissal, setDismissal] = useState<DismissalSettings>({
    regular: { 1: "12:00", 2: "12:45", 3: "13:00", 4: "13:00", 5: "10:30", 6: "10:30" },
    extracurricular: { 2: "Ekstra Tari", 3: "Ekstra TIK", 4: "Ekstra BTQ", 5: "Infak", 6: "Pramuka" },
    specials: []
  });
  const [activities, setActivities] = useState<ClassActivity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [payments, setPayments] = useState<{ [studentName: string]: { [feeId: string]: boolean } }>({});
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Form states
  // Jam pulang khusus
  const [specDate, setSpecDate] = useState(getTodayDateString());
  const [specType, setSpecType] = useState<"awal" | "lambat">("awal");
  const [specTime, setSpecTime] = useState("11:00");
  const [specReason, setSpecReason] = useState("");

  // Kegiatan baru
  const [actText, setActText] = useState("");
  const [actDate, setActDate] = useState(getTodayDateString());
  const [actImage, setActImage] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Info baru
  const [annType, setAnnType] = useState<"PR" | "Jadwal" | "Libur" | "Info">("Info");
  const [annText, setAnnText] = useState("");

  // Iuran baru
  const [feeTarget, setFeeTarget] = useState("*");
  const [feeTitle, setFeeTitle] = useState("");
  const [feeAmount, setFeeAmount] = useState<number | "">("");

  // Siswa baru
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStdName, setNewStdName] = useState("");
  const [newStdNisn, setNewStdNisn] = useState("");
  const [newStdPin, setNewStdPin] = useState("");
  const [newStdGender, setNewStdGender] = useState<"L" | "P">("L");
  const [newStdParent, setNewStdParent] = useState("");

  // Edit Siswa
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editNisn, setEditNisn] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editGender, setEditGender] = useState<"L" | "P">("L");
  const [editParent, setEditParent] = useState("");

  // Setup Realtime Listeners ke Firebase Firestore
  useEffect(() => {
    const unsubStudents = subscribeStudents((list) => setStudents(list));
    const unsubDismissal = subscribeDismissal((data) => setDismissal(data));
    const unsubActivities = subscribeActivities((list) => setActivities(list));
    const unsubAnnouncements = subscribeAnnouncements((list) => setAnnouncements(list));
    const unsubFees = subscribeFees((list) => setFees(list));
    const unsubPayments = subscribePayments((data) => setPayments(data));
    const unsubLeave = subscribeLeaveRequests((list) => setLeaveRequests(list));

    return () => {
      unsubStudents();
      unsubDismissal();
      unsubActivities();
      unsubAnnouncements();
      unsubFees();
      unsubPayments();
      unsubLeave();
    };
  }, []);

  // Realtime listener untuk presensi tanggal yang dipilih
  useEffect(() => {
    const unsubAtt = subscribeAttendance(currentDate, (rec) => {
      setAttendance(rec);
    });
    return () => unsubAtt();
  }, [currentDate]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  }

  // 1. Presensi (Langsung Realtime ke Firestore)
  async function toggleAttendance(studentName: string, status: "H" | "S" | "I" | "A") {
    const updated = { ...attendance };
    if (updated[studentName] === status) {
      delete updated[studentName];
    } else {
      updated[studentName] = status;
    }
    setAttendance(updated);

    try {
      await saveAttendance(currentDate, updated);
      showToast(`Presensi ${studentName} diperbarui! ⚡`);
    } catch (e: any) {
      console.error("Gagal simpan presensi:", e);
    }
  }

  async function setAllPresent() {
    const updated: AttendanceRecord = {};
    students.forEach((s) => {
      updated[s.name] = "H";
    });
    setAttendance(updated);

    try {
      await saveAttendance(currentDate, updated);
      showToast("Semua siswa ditandai hadir! ✅");
    } catch (e: any) {
      console.error("Gagal simpan presensi:", e);
    }
  }

  // 2. Jam Pulang (Langsung Realtime ke Firestore)
  async function handleUpdateRegularTime(dayNum: number, timeVal: string, extraVal?: string) {
    const updated = {
      ...dismissal,
      regular: { ...dismissal.regular, [dayNum]: timeVal },
      extracurricular: extraVal !== undefined ? { ...dismissal.extracurricular, [dayNum]: extraVal } : dismissal.extracurricular
    };
    setDismissal(updated);
    await saveDismissalSettings(updated);
    showToast("Jadwal tetap tersimpan!");
  }

  async function addSpecialDismissal() {
    if (!specTime) return;
    const item = {
      id: "spec-" + Date.now(),
      date: specDate,
      time: specTime,
      type: specType,
      reason: specReason
    };
    const updated = {
      ...dismissal,
      specials: [item, ...dismissal.specials].slice(0, 20)
    };
    setDismissal(updated);
    setSpecReason("");
    await saveDismissalSettings(updated);
    showToast("Jadwal khusus berhasil ditambahkan!");
  }

  async function deleteSpecialDismissal(id: string) {
    const updated = {
      ...dismissal,
      specials: dismissal.specials.filter((s) => s.id !== id)
    };
    setDismissal(updated);
    await saveDismissalSettings(updated);
    showToast("Jadwal khusus dihapus!");
  }

  // 3. Kegiatan & Foto (Kompresi & Realtime)
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          setActImage(dataUrl);
        }
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleAddActivity() {
    if (!actText.trim() && !actImage) return;

    const newAct: ClassActivity = {
      id: "act-" + Date.now(),
      date: actDate,
      text: actText.trim(),
      imageUrl: actImage,
      createdAt: new Date().toISOString()
    };

    await addActivity(newAct);
    setActText("");
    setActImage("");
    showToast("Kegiatan berhasil ditambahkan! 🎨");
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm("Hapus catatan kegiatan ini?")) return;
    await deleteActivity(id);
    showToast("Kegiatan dihapus.");
  }

  // 4. Pengumuman & PR (Realtime)
  async function handleAddAnnouncement() {
    if (!annText.trim()) return;

    const newAnn: Announcement = {
      id: "ann-" + Date.now(),
      date: getTodayDateString(),
      type: annType,
      title: annType === "PR" ? "Pekerjaan Rumah" : annType === "Jadwal" ? "Jadwal" : annType === "Libur" ? "Hari Libur" : "Pengumuman",
      text: annText.trim(),
      createdAt: new Date().toISOString()
    };

    await addAnnouncement(newAnn);
    setAnnText("");
    showToast("Pengumuman berhasil diterbitkan! 📣");
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm("Hapus informasi ini?")) return;
    await deleteAnnouncement(id);
    showToast("Informasi dihapus.");
  }

  // 5. Iuran & Kas (Realtime)
  async function handleAddFee() {
    if (!feeTitle.trim() || !feeAmount) return;

    const newFee: FeeItem = {
      id: "fee-" + Date.now(),
      title: feeTitle.trim(),
      amount: Number(feeAmount),
      target: feeTarget,
      createdAt: new Date().toISOString()
    };

    await addFee(newFee);
    setFeeTitle("");
    setFeeAmount("");
    showToast("Tagihan iuran berhasil dibuat! 💰");
  }

  async function handleTogglePayment(studentName: string, feeId: string) {
    const updatedStatus = await togglePayment(studentName, feeId);
    showToast(`Status pembayaran ${studentName}: ${updatedStatus ? "Lunas ✅" : "Belum Bayar"}`);
  }

  async function handleDeleteFee(feeId: string) {
    if (!confirm("Hapus jenis iuran ini beserta data pembayarannya?")) return;
    await deleteFee(feeId);
    showToast("Tagihan iuran dihapus.");
  }

  // 6. Izin Online (Realtime Approval & Presensi Auto-Update)
  async function handleApproveLeave(req: LeaveRequest, applyToAbsen: boolean) {
    await updateLeaveRequestStatus(req.id, "approved", applyToAbsen);
    showToast(`Izin ${req.studentName} disetujui & diterapkan ke absensi! ✅`);
  }

  async function handleRejectLeave(id: string) {
    await updateLeaveRequestStatus(id, "rejected", false);
    showToast("Pengajuan izin ditolak.");
  }

  // 7. Kelola Siswa (Realtime)
  async function handleSaveNewStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newStdName.trim()) return;

    const pin = newStdPin.trim() || "1234";
    const pHash = await hashPin(pin);

    const newStd: Student = {
      id: "std-" + Date.now(),
      name: newStdName.trim(),
      nisn: newStdNisn.trim() || "-",
      pin: pin,
      pinHash: pHash,
      gender: newStdGender,
      parentName: newStdParent.trim() || "Bapak/Ibu " + newStdName.trim()
    };

    await saveStudent(newStd);
    setShowAddStudentModal(false);
    setNewStdName("");
    setNewStdNisn("");
    setNewStdPin("");
    setNewStdParent("");
    showToast(`Data siswa ${newStd.name} berhasil ditambahkan! 🎒`);
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (!confirm(`Hapus siswa ${name}? Data absensi dan tagihan tetap tersimpan di riwayat.`)) return;
    await deleteStudent(id);
    showToast(`Siswa ${name} dihapus.`);
  }

  function handleStartEdit(s: Student) {
    setEditingStudent(s);
    setEditName(s.name);
    setEditNisn(s.nisn);
    setEditPin(s.pin);
    setEditGender(s.gender || "L");
    setEditParent(s.parentName || "");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent || !editName.trim() || !editPin.trim()) return;

    const pHash = await hashPin(editPin.trim());
    const updated: Student = {
      ...editingStudent,
      name: editName.trim(),
      nisn: editNisn.trim() || "-",
      pin: editPin.trim(),
      pinHash: pHash,
      gender: editGender,
      parentName: editParent.trim() || "Bapak/Ibu " + editName.trim()
    };

    await saveStudent(updated);
    setEditingStudent(null);
    showToast(`Data dan PIN siswa ${updated.name} berhasil diperbarui! 🎒`);
  }

  // Ekspor CSV
  async function exportAttendanceCSV() {
    const allAtt = await getAllAttendance();
    const dates = Object.keys(allAtt).sort();
    let csv = "Nama Siswa,NISN," + dates.join(",") + ",Total Hadir,Total Sakit,Total Izin,Total Alpa,Persentase Hadir\n";

    students.forEach((s) => {
      let h = 0, sk = 0, iz = 0, a = 0;
      const rowStatuses = dates.map((d) => {
        const status = allAtt[d]?.[s.name] || "-";
        if (status === "H") h++;
        if (status === "S") sk++;
        if (status === "I") iz++;
        if (status === "A") a++;
        return status;
      });

      const totalRecorded = h + sk + iz + a;
      const pct = totalRecorded ? Math.round((h / totalRecorded) * 100) + "%" : "0%";
      csv += `"${s.name}","${s.nisn}",` + rowStatuses.join(",") + `,${h},${sk},${iz},${a},${pct}\n`;
    });

    downloadCSV(`Rekap_Absensi_Kelas4_${getTodayDateString()}.csv`, csv);
  }

  function exportStudentsCSV() {
    let csv = "Nama Lengkap,NISN,PIN Orang Tua,Jenis Kelamin,Nama Orang Tua/Wali\n";
    students.forEach((s) => {
      csv += `"${s.name}","${s.nisn}","${s.pin}","${s.gender || "-"}","${s.parentName || "-"}"\n`;
    });
    downloadCSV(`Data_Siswa_Kelas4_${getTodayDateString()}.csv`, csv);
  }

  // Statistik Presensi Tanggal Terpilih
  const counts = { H: 0, S: 0, I: 0, A: 0, N: 0 };
  students.forEach((s) => {
    const st = attendance[s.name];
    if (st === "H") counts.H++;
    else if (st === "S") counts.S++;
    else if (st === "I") counts.I++;
    else if (st === "A") counts.A++;
    else counts.N++;
  });

  return (
    <div className="w pb-12">
      {/* Header Guru */}
      <Header
        title1="Mode"
        title2="Wali Kelas"
        subtitle="SDN Kaliwungu 05 • Kelas 4 Ceria ✏️"
        showPills={false}
      />

      {/* Tabs Menu (Hanya 7 Tab Inti) */}
      <div className="tabs mb-2">
        <button className={tab === "absen" ? "on" : ""} onClick={() => setTab("absen")}>
          📋 Absen
        </button>
        <button className={tab === "pulang" ? "on" : ""} onClick={() => setTab("pulang")}>
          🏠 Pulang &amp; Ekstra
        </button>
        <button className={tab === "keg" ? "on" : ""} onClick={() => setTab("keg")}>
          🎨 Kegiatan
        </button>
        <button className={tab === "info" ? "on" : ""} onClick={() => setTab("info")}>
          📣 Info &amp; PR
        </button>
        <button className={tab === "iuran" ? "on" : ""} onClick={() => setTab("iuran")}>
          💰 Iuran
        </button>
        <button className={tab === "izin" ? "on" : ""} onClick={() => setTab("izin")}>
          📝 Izin {leaveRequests.filter(l => l.status === "pending").length > 0 && `(${leaveRequests.filter(l => l.status === "pending").length})`}
        </button>
        <button className={tab === "siswa" ? "on" : ""} onClick={() => setTab("siswa")}>
          👥 Siswa
        </button>
      </div>

      {/* 1. TAB ABSEN */}
      {tab === "absen" && (
        <div className="c">
          <h2>Presensi Harian Siswa</h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-white/70 p-3 rounded-2xl border border-[#ffd45a]/50">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-[#17456b]">Tanggal:</span>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="text-sm font-semibold flex-1"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={setAllPresent}
                className="btn-wonder text-xs py-2 px-3"
                title="Tandai semua hadir sekaligus"
              >
                ✅ Semua Hadir
              </button>
              <button
                onClick={exportAttendanceCSV}
                className="btn-blue text-xs py-2 px-3 rounded-xl font-bold"
                title="Unduh rekap excel bulanan"
              >
                📊 Ekspor CSV
              </button>
            </div>
          </div>

          {/* Ringkasan status hari ini */}
          <div className="g4 mb-4">
            <div className="H">Hadir<br /><span className="text-lg">{counts.H}</span></div>
            <div className="S">Sakit<br /><span className="text-lg">{counts.S}</span></div>
            <div className="I">Izin<br /><span className="text-lg">{counts.I}</span></div>
            <div className="A">Alpa<br /><span className="text-lg">{counts.A}</span></div>
          </div>

          {/* List Siswa */}
          <div className="space-y-3">
            {students.map((m) => {
              const currentSt = attendance[m.name];
              return (
                <div
                  key={m.id}
                  className="bg-white/80 p-3 rounded-2xl border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-extrabold text-[#17456b] text-base">{m.name}</span>
                    <span className="text-xs text-[#5d7f93] ml-2">({m.nisn})</span>
                  </div>

                  <div className="ab">
                    {(["H", "S", "I", "A"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        className={`${k} ${currentSt === k ? "on" : ""}`}
                        onClick={() => toggleAttendance(m.name, k)}
                      >
                        {STATUS_LABELS[k]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TAB PULANG & EKSTRA */}
      {tab === "pulang" && (
        <>
          <div className="c">
            <h2>Jadwal Tetap Sekolah</h2>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((dayNum) => (
                <div key={dayNum} className="flex flex-col sm:flex-row items-center gap-2 bg-white/70 p-2 rounded-xl">
                  <span className="w-24 font-bold text-sm text-[#17456b]">{DAY_NAMES[dayNum]}</span>
                  <input
                    type="time"
                    value={dismissal.regular[dayNum] || ""}
                    onChange={(e) => handleUpdateRegularTime(dayNum, e.target.value)}
                    className="text-sm font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Ekstrakurikuler (opsional)"
                    value={dismissal.extracurricular[dayNum] || ""}
                    onChange={(e) => handleUpdateRegularTime(dayNum, dismissal.regular[dayNum] || "", e.target.value)}
                    className="flex-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="c">
            <h2>Pengumuman Jam Pulang Khusus</h2>
            <div className="space-y-2 mb-4 bg-white/70 p-3 rounded-2xl border border-[#ffd45a]/50">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={specDate}
                  onChange={(e) => setSpecDate(e.target.value)}
                  className="text-sm flex-1"
                />
                <select
                  value={specType}
                  onChange={(e) => setSpecType(e.target.value as "awal" | "lambat")}
                  className="text-sm font-semibold"
                >
                  <option value="awal">Lebih awal 🏠</option>
                  <option value="lambat">Lebih lambat / Ekstra ⏰</option>
                </select>
                <input
                  type="time"
                  value={specTime}
                  onChange={(e) => setSpecTime(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Keterangan (misal: Rapat Guru, Kerja Bakti, Gladi Resik)"
                  value={specReason}
                  onChange={(e) => setSpecReason(e.target.value)}
                  className="flex-1 text-sm"
                />
                <button onClick={addSpecialDismissal} className="btn-wonder text-sm">
                  + Tambah
                </button>
              </div>
            </div>

            {/* List Jadwal Khusus */}
            <div className="space-y-2">
              {dismissal.specials.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-white/80 p-2.5 rounded-xl border border-black/5 text-sm">
                  <div>
                    <span className="font-bold">{formatShortDateIndo(p.date)}</span> •{" "}
                    <span className="font-semibold text-[#f5a623]">{p.type === "lambat" ? "Lebih lambat" : "Lebih awal"} {p.time} WIB</span>
                    {p.reason && <span className="text-[#5d7f93]"> — {p.reason}</span>}
                  </div>
                  <button
                    onClick={() => deleteSpecialDismissal(p.id)}
                    className="btn-danger text-xs py-1 px-2.5"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 3. TAB KEGIATAN */}
      {tab === "keg" && (
        <>
          <div className="c">
            <h2>Dokumentasi Kegiatan Hari Ini</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="text-xs font-bold text-[#17456b] self-center">Tanggal:</span>
                <input
                  type="date"
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="text-sm font-semibold"
                />
              </div>

              <textarea
                placeholder="Hari ini kami belajar perkalian susun, bermain tebak kata, dan..."
                value={actText}
                onChange={(e) => setActText(e.target.value)}
                className="w-full text-sm min-h-[80px]"
              />

              <div>
                <label className="text-xs font-bold text-[#17456b] block mb-1">
                  Upload Foto Dokumentasi:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-xs"
                />
                {isProcessingImage && (
                  <span className="text-xs text-[#f5a623] font-bold ml-2">Mengoptimalkan foto...</span>
                )}
              </div>

              {actImage && (
                <div className="relative inline-block mt-2">
                  <img
                    src={actImage}
                    alt="Preview"
                    className="w-48 h-32 object-cover rounded-xl border-2 border-white shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setActImage("")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                onClick={handleAddActivity}
                className="btn-wonder w-full sm:w-auto"
                disabled={isProcessingImage}
              >
                + Tambah Kegiatan
              </button>
            </div>
          </div>

          {/* List Kegiatan */}
          <div className="space-y-3">
            {activities.map((k) => (
              <div key={k.id} className="c">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#5d7f93]">{formatDateIndo(k.date)}</span>
                  <button
                    onClick={() => handleDeleteActivity(k.id)}
                    className="btn-danger text-xs py-1 px-2.5"
                  >
                    Hapus
                  </button>
                </div>
                <div className="text-sm font-medium text-[#17456b]">{k.text}</div>
                {k.imageUrl && (
                  <img
                    src={k.imageUrl}
                    alt="Foto"
                    className="w-full rounded-2xl mt-3 shadow-md border-2 border-white object-cover max-h-72"
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 4. TAB INFO & PR */}
      {tab === "info" && (
        <>
          <div className="c">
            <h2>Buat Informasi Baru</h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={annType}
                  onChange={(e) => setAnnType(e.target.value as any)}
                  className="text-sm font-semibold w-full sm:w-48"
                >
                  <option value="PR">📚 PR (Pekerjaan Rumah)</option>
                  <option value="Jadwal">🗓️ Jadwal Pelajaran</option>
                  <option value="Libur">🏖️ Libur</option>
                  <option value="Info">📣 Info &amp; Pengumuman</option>
                </select>

                <textarea
                  placeholder="Ketik isi pengumuman atau tugas di sini..."
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  className="flex-1 text-sm min-h-[70px]"
                />
              </div>

              <button onClick={handleAddAnnouncement} className="btn-wonder">
                + Tambah Informasi
              </button>
            </div>
          </div>

          {/* List Info */}
          <div className="space-y-2">
            {announcements.map((x) => (
              <div key={x.id} className="c flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="st text-xs py-0.5 px-2.5" style={{
                      background: x.type === "PR" ? "var(--b)" : x.type === "Jadwal" ? "var(--g)" : x.type === "Libur" ? "var(--r)" : "var(--pr)"
                    }}>
                      {x.type}
                    </span>
                    <span className="text-xs font-bold text-[#5d7f93]">{formatDateIndo(x.date)}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#17456b] whitespace-pre-line">{x.text}</div>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(x.id)}
                  className="btn-danger text-xs py-1 px-2.5 whitespace-nowrap"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 5. TAB IURAN */}
      {tab === "iuran" && (
        <>
          <div className="c">
            <h2>Tambah Tagihan / Iuran</h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={feeTarget}
                  onChange={(e) => setFeeTarget(e.target.value)}
                  className="text-sm font-semibold"
                >
                  <option value="*">Semua Murid</option>
                  {students.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Nama tagihan (mis. Kas Nov, Buku LKS, Baju Olahraga)"
                  value={feeTitle}
                  onChange={(e) => setFeeTitle(e.target.value)}
                  className="flex-1 text-sm"
                />

                <input
                  type="number"
                  placeholder="Nominal Rp"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full sm:w-36 text-sm font-semibold"
                />
              </div>

              <button onClick={handleAddFee} className="btn-wonder">
                + Tambah Tagihan
              </button>
            </div>
          </div>

          {/* List Siswa & Tagihan */}
          <div className="space-y-3">
            {students.map((m) => {
              const studentFees = fees.filter((f) => f.target === "*" || f.target === m.name);
              return (
                <div key={m.id} className="c">
                  <div className="font-extrabold text-[#17456b] mb-2">{m.name}</div>
                  {studentFees.length > 0 ? (
                    <div className="space-y-2">
                      {studentFees.map((f) => {
                        const isPaid = !!payments[m.name]?.[f.id];
                        return (
                          <div
                            key={f.id}
                            className="flex justify-between items-center bg-white/70 p-2.5 rounded-xl border border-black/5"
                          >
                            <span className="text-sm font-semibold">
                              {f.title} • <span className="text-[#f5a623]">{formatRupiah(f.amount)}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTogglePayment(m.name, f.id)}
                                className={`text-xs font-bold py-1 px-3 rounded-xl transition ${
                                  isPaid ? "bg-[#27a98a] text-white" : "bg-[#5d7f93] text-white"
                                }`}
                              >
                                {isPaid ? "Lunas ✅" : "Belum bayar"}
                              </button>
                              <button
                                onClick={() => handleDeleteFee(f.id)}
                                className="text-red-500 hover:text-red-700 font-extrabold px-1"
                                title="Hapus tagihan ini"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-[#5d7f93]">Tidak ada tagihan</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 6. TAB IZIN ONLINE */}
      {tab === "izin" && (
        <div className="c">
          <h2>Pengajuan Izin dari Orang Tua</h2>
          <p className="text-xs text-[#5d7f93] text-center mb-4">
            Guru dapat meninjau dan menerapkan izin ke absensi hari tersebut secara langsung.
          </p>

          {leaveRequests.length > 0 ? (
            <div className="space-y-3">
              {leaveRequests.map((lr) => (
                <div
                  key={lr.id}
                  className="bg-white/80 p-3 rounded-2xl border border-black/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#17456b] text-base">{lr.studentName}</span>
                      <span className={`st text-xs py-0.5 px-2.5 ${lr.category === "Sakit" ? "S" : "I"}`}>
                        {lr.category}
                      </span>
                      <span className="text-xs text-[#5d7f93] font-bold">
                        Tanggal: {formatShortDateIndo(lr.date)}
                      </span>
                    </div>
                    <div className="text-sm text-[#17456b] font-medium mt-1">
                      Keterangan: <span className="italic font-normal">{lr.note}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {lr.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApproveLeave(lr, true)}
                          className="btn-wonder text-xs py-1.5 px-3 bg-[#27a98a] text-white"
                        >
                          ✅ Setujui &amp; Terapkan Absen
                        </button>
                        <button
                          onClick={() => handleRejectLeave(lr.id)}
                          className="btn-danger text-xs py-1.5 px-2.5"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <span className={`st text-xs py-1 px-3 ${lr.status === "approved" ? "H" : "S"}`}>
                        {lr.status === "approved" ? "Disetujui ✅" : "Ditolak ✕"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#5d7f93] py-4 text-sm">
              Belum ada permohonan izin dari orang tua siswa 👍
            </div>
          )}
        </div>
      )}

      {/* 7. TAB SISWA */}
      {tab === "siswa" && (
        <div className="c">
          <div className="flex justify-between items-center mb-3">
            <h2 className="mb-0">Kelola Data Siswa &amp; Orang Tua</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn-wonder text-xs py-2 px-3"
              >
                + Tambah Siswa
              </button>
              <button
                onClick={exportStudentsCSV}
                className="btn-blue text-xs py-2 px-3 rounded-xl font-bold"
              >
                📥 Ekspor CSV
              </button>
            </div>
          </div>

          {/* Form Tambah Siswa */}
          {showAddStudentModal && (
            <form onSubmit={handleSaveNewStudent} className="bg-white/80 p-4 rounded-2xl border-2 border-[#ffd45a] mb-4 space-y-3">
              <div className="font-bold text-sm text-[#17456b]">Tambah Siswa Baru:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama Lengkap Siswa"
                  value={newStdName}
                  onChange={(e) => setNewStdName(e.target.value)}
                  className="text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="NISN"
                  value={newStdNisn}
                  onChange={(e) => setNewStdNisn(e.target.value)}
                  className="text-sm"
                />
                <input
                  type="text"
                  placeholder="PIN Orang Tua (contoh: 1234)"
                  value={newStdPin}
                  onChange={(e) => setNewStdPin(e.target.value)}
                  className="text-sm"
                  required
                />
                <select
                  value={newStdGender}
                  onChange={(e) => setNewStdGender(e.target.value as "L" | "P")}
                  className="text-sm"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
                <input
                  type="text"
                  placeholder="Nama Orang Tua/Wali"
                  value={newStdParent}
                  onChange={(e) => setNewStdParent(e.target.value)}
                  className="text-sm sm:col-span-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="btn-wonder text-xs bg-gray-200 text-gray-700"
                >
                  Batal
                </button>
                <button type="submit" className="btn-wonder text-xs">
                  Simpan Siswa
                </button>
              </div>
            </form>
          )}

          {/* Form Edit Siswa */}
          {editingStudent && (
            <form onSubmit={handleSaveEdit} className="bg-white p-4 rounded-2xl border-2 border-[#27a98a] mb-4 space-y-3 shadow-md">
              <div className="flex justify-between items-center">
                <div className="font-bold text-sm text-[#17456b]">✏️ Edit Data &amp; PIN Siswa ({editingStudent.name}):</div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-bold"
                >
                  ✕ Batal
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#17456b] block mb-0.5">Nama Lengkap:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-sm w-full"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#17456b] block mb-0.5">NISN:</label>
                  <input
                    type="text"
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    className="text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#17456b] block mb-0.5">
                    PIN Orang Tua <span className="text-[#f5a623]">(Bisa diubah bebas)</span>:
                  </label>
                  <input
                    type="text"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    className="text-sm w-full font-bold tracking-wider"
                    placeholder="PIN 4 digit"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#17456b] block mb-0.5">Jenis Kelamin:</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as "L" | "P")}
                    className="text-sm w-full font-semibold"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-[#17456b] block mb-0.5">Nama Orang Tua/Wali:</label>
                  <input
                    type="text"
                    value={editParent}
                    onChange={(e) => setEditParent(e.target.value)}
                    className="text-sm w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="btn-wonder text-xs bg-gray-200 text-gray-700"
                >
                  Batal
                </button>
                <button type="submit" className="btn-wonder btn-save text-xs">
                  💾 Simpan Perubahan
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {students.map((s, idx) => (
              <div
                key={s.id}
                className="bg-white/70 p-3 rounded-xl border border-black/5 flex justify-between items-center text-sm"
              >
                <div>
                  <div className="font-extrabold text-[#17456b]">
                    {idx + 1}. {s.name} <span className="text-xs text-[#5d7f93]">({s.gender || "L"})</span>
                  </div>
                  <div className="text-xs text-[#5d7f93] mt-0.5">
                    NISN: <span className="font-bold text-[#17456b]">{s.nisn}</span> • PIN: <span className="font-bold text-[#f5a623]">{s.pin}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(s)}
                    className="btn-wonder text-xs py-1 px-2.5 bg-[#ffd45a] text-[#5a3a00]"
                    title="Edit data atau PIN siswa ini"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(s.id, s.name)}
                    className="btn-danger text-xs py-1 px-2.5"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tombol Keluar Mode Guru */}
      <div className="flex justify-center my-6">
        <button
          onClick={onLogout}
          className="btn-wonder"
          style={{ background: "var(--mu)", color: "#fff", boxShadow: "none" }}
        >
          Keluar Mode Guru
        </button>
      </div>

      {/* Notifikasi Toast Realtime */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#17456b] text-white py-2 px-5 rounded-2xl shadow-xl z-50 text-sm font-bold animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
