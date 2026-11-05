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
  getStudents,
  saveStudent,
  deleteStudent,
  getAttendance,
  saveAttendance,
  getAllAttendance,
  getDismissalSettings,
  saveDismissalSettings,
  getActivities,
  addActivity,
  deleteActivity,
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  getFees,
  addFee,
  deleteFee,
  getPayments,
  togglePayment,
  getLeaveRequests,
  updateLeaveRequestStatus,
  syncAllToFirebase,
  getFirestoreSyncState,
  hashPin
} from "@/lib/dataService";
import Header from "./Header";

interface TeacherViewProps {
  onLogout: () => void;
}

export default function TeacherView({ onLogout }: TeacherViewProps) {
  const [tab, setTab] = useState<"absen" | "pulang" | "keg" | "info" | "iuran" | "izin" | "siswa" | "cloud">("absen");
  const [dirty, setDirty] = useState(false);
  const [savingMessage, setSavingMessage] = useState("");

  // Data state
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
  const [syncState, setSyncState] = useState({ isAvailable: true, lastError: "" });

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

  // Siswa baru / edit
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStdName, setNewStdName] = useState("");
  const [newStdNisn, setNewStdNisn] = useState("");
  const [newStdPin, setNewStdPin] = useState("");
  const [newStdGender, setNewStdGender] = useState<"L" | "P">("L");
  const [newStdParent, setNewStdParent] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadAttendanceForDate(currentDate);
  }, [currentDate]);

  async function loadAll() {
    try {
      const [stds, dism, acts, anns, fList, pays, leaves] = await Promise.all([
        getStudents(),
        getDismissalSettings(),
        getActivities(),
        getAnnouncements(),
        getFees(),
        getPayments(),
        getLeaveRequests()
      ]);
      setStudents(stds);
      setDismissal(dism);
      setActivities(acts);
      setAnnouncements(anns);
      setFees(fList);
      setPayments(pays);
      setLeaveRequests(leaves);
      setSyncState(getFirestoreSyncState());
    } catch (e) {
      console.error("Error loading teacher data:", e);
    }
  }

  async function loadAttendanceForDate(d: string) {
    const att = await getAttendance(d);
    setAttendance(att);
  }

  // Attendance toggles
  function toggleAttendance(studentName: string, status: "H" | "S" | "I" | "A") {
    const updated = { ...attendance };
    if (updated[studentName] === status) {
      delete updated[studentName];
    } else {
      updated[studentName] = status;
    }
    setAttendance(updated);
    setDirty(true);
  }

  function setAllPresent() {
    const updated: AttendanceRecord = {};
    students.forEach((s) => {
      updated[s.name] = "H";
    });
    setAttendance(updated);
    setDirty(true);
  }

  // Save changes
  async function handleSaveAndPublish() {
    setSavingMessage("Menerbitkan & menyimpan ke cloud...");
    try {
      await saveAttendance(currentDate, attendance);
      await saveDismissalSettings(dismissal);
      setDirty(false);
      setSavingMessage("Berhasil disimpan & diterbitkan! 🎉");
      setTimeout(() => setSavingMessage(""), 3000);
      setSyncState(getFirestoreSyncState());
    } catch (e: any) {
      setSavingMessage("Gagal menyimpan: " + (e?.message || "Coba lagi"));
    }
  }

  // Dismissal special
  function addSpecialDismissal() {
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
    setDirty(true);
    setSpecReason("");
  }

  function deleteSpecialDismissal(id: string) {
    const updated = {
      ...dismissal,
      specials: dismissal.specials.filter((s) => s.id !== id)
    };
    setDismissal(updated);
    setDirty(true);
  }

  // Image compression
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
    setActivities([newAct, ...activities]);
    setActText("");
    setActImage("");
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm("Hapus catatan kegiatan ini?")) return;
    await deleteActivity(id);
    setActivities(activities.filter((a) => a.id !== id));
  }

  // Info
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
    setAnnouncements([newAnn, ...announcements]);
    setAnnText("");
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm("Hapus informasi ini?")) return;
    await deleteAnnouncement(id);
    setAnnouncements(announcements.filter((a) => a.id !== id));
  }

  // Fees
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
    setFees([newFee, ...fees]);
    setFeeTitle("");
    setFeeAmount("");
  }

  async function handleTogglePayment(studentName: string, feeId: string) {
    const updatedStatus = await togglePayment(studentName, feeId);
    setPayments((prev) => ({
      ...prev,
      [studentName]: {
        ...(prev[studentName] || {}),
        [feeId]: updatedStatus
      }
    }));
  }

  async function handleDeleteFee(feeId: string) {
    if (!confirm("Hapus jenis iuran ini beserta data pembayarannya?")) return;
    await deleteFee(feeId);
    setFees(fees.filter((f) => f.id !== feeId));
  }

  // Leave approval
  async function handleApproveLeave(req: LeaveRequest, applyToAbsen: boolean) {
    await updateLeaveRequestStatus(req.id, "approved", applyToAbsen);
    setLeaveRequests(
      leaveRequests.map((l) => (l.id === req.id ? { ...l, status: "approved" } : l))
    );
    if (applyToAbsen && req.date === currentDate) {
      setAttendance((prev) => ({
        ...prev,
        [req.studentName]: req.category === "Sakit" ? "S" : "I"
      }));
      setDirty(true);
    }
  }

  async function handleRejectLeave(id: string) {
    await updateLeaveRequestStatus(id, "rejected", false);
    setLeaveRequests(
      leaveRequests.map((l) => (l.id === id ? { ...l, status: "rejected" } : l))
    );
  }

  // Student CRUD
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
    setStudents([...students, newStd]);
    setShowAddStudentModal(false);
    setNewStdName("");
    setNewStdNisn("");
    setNewStdPin("");
    setNewStdParent("");
  }

  async function handleDeleteStudent(id: string, name: string) {
    if (!confirm(`Hapus siswa ${name}? Data absensi dan tagihan tetap tersimpan di riwayat.`)) return;
    await deleteStudent(id);
    setStudents(students.filter((s) => s.id !== id));
  }

  // Export CSV functions
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

  // Sync to Firebase
  const [syncStatusText, setSyncStatusText] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSyncToFirestore() {
    setIsSyncing(true);
    setSyncStatusText("Sedang menyinkronkan data ke Cloud Firestore...");
    const res = await syncAllToFirebase();
    setIsSyncing(false);
    setSyncStatusText(res.message);
    setSyncState(getFirestoreSyncState());
  }

  // Stats calculation for current date
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
    <div className="w pb-24">
      {/* Header Guru */}
      <Header
        title1="Mode"
        title2="Wali Kelas"
        subtitle="SDN Kaliwungu 05 • amarianadewi@gmail.com ✏️"
        showPills={false}
      />

      {/* Tabs Menu */}
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
          📝 Izin Online {leaveRequests.filter(l => l.status === "pending").length > 0 && `(${leaveRequests.filter(l => l.status === "pending").length})`}
        </button>
        <button className={tab === "siswa" ? "on" : ""} onClick={() => setTab("siswa")}>
          👥 Siswa
        </button>
        <button className={tab === "cloud" ? "on" : ""} onClick={() => setTab("cloud")}>
          ☁️ Firebase
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
                    onChange={(e) => {
                      setDismissal({
                        ...dismissal,
                        regular: { ...dismissal.regular, [dayNum]: e.target.value }
                      });
                      setDirty(true);
                    }}
                    className="text-sm font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Ekstrakurikuler (opsional)"
                    value={dismissal.extracurricular[dayNum] || ""}
                    onChange={(e) => {
                      setDismissal({
                        ...dismissal,
                        extracurricular: { ...dismissal.extracurricular, [dayNum]: e.target.value }
                      });
                      setDirty(true);
                    }}
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
            Guru dapat meninjau dan menerapkan izin ke absensi hari tersebut.
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

                <div className="flex items-center gap-2">
                  <button
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

      {/* 8. TAB FIREBASE */}
      {tab === "cloud" && (
        <div className="c">
          <h2>Status Firebase Cloud Firestore</h2>
          
          <div className="space-y-4 text-sm">
            <div className="bg-white/80 p-3 rounded-2xl border border-black/10">
              <div className="font-bold text-[#17456b] mb-1">Status Koneksi Database:</div>
              {syncState.isAvailable ? (
                <div className="text-[#27a98a] font-bold flex items-center gap-1">
                  ✅ Terhubung dengan Firebase Cloud Firestore (Project: infokelas-ed434)
                </div>
              ) : (
                <div className="text-[#ee6b6e] font-semibold">
                  ⚠️ Cloud Firestore belum diaktifkan di Firebase Console atau permission denied.
                  <div className="text-xs text-[#5d7f93] mt-1">
                    Detail: {syncState.lastError}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>💡 Panduan Aktivasi di Firebase Console:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Buka console.firebase.google.com dan pilih proyek <b>infokelas-ed434</b>.</li>
                <li>Klik menu <b>Build &gt; Firestore Database</b> di sebelah kiri.</li>
                <li>Klik <b>Create Database</b> &gt; pilih lokasi (mis. asia-southeast2 / Jakarta) &gt; pilih <b>Start in test mode</b>.</li>
                <li>Setelah database aktif, klik tombol di bawah untuk menyinkronkan seluruh data kelas!</li>
              </ol>
            </div>

            <div className="text-center">
              <button
                onClick={handleSyncToFirestore}
                disabled={isSyncing}
                className="btn-wonder btn-save text-sm font-bold py-2.5 px-6"
              >
                {isSyncing ? "Menyinkronkan..." : "🚀 Sinkronkan / Unggah Seluruh Data ke Firestore"}
              </button>
              {syncStatusText && (
                <div className="mt-2 text-xs font-bold text-[#17456b]">
                  {syncStatusText}
                </div>
              )}
            </div>
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

      {/* Floating Save & Publish Button */}
      {dirty && (
        <div className="sv">
          <button
            onClick={handleSaveAndPublish}
            className="btn-wonder btn-save shadow-lg"
          >
            💾 Simpan &amp; Terbitkan Perubahan
          </button>
        </div>
      )}

      {savingMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#17456b] text-white py-2 px-5 rounded-2xl shadow-xl z-50 text-sm font-bold">
          {savingMessage}
        </div>
      )}
    </div>
  );
}

