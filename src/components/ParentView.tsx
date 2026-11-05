"use client";

import React, { useState, useEffect } from "react";
import { Student, ClassActivity, Announcement, StudentFeeStatus, LeaveRequest } from "@/types";
import {
  STATUS_LABELS,
  formatDateIndo,
  formatShortDateIndo,
  formatRupiah,
  getTodayDateString
} from "@/lib/formatters";
import {
  getAllAttendance,
  addLeaveRequest,
  subscribeAttendance,
  subscribeDismissal,
  subscribeActivities,
  subscribeAnnouncements,
  subscribeFees,
  subscribePayments,
  subscribeLeaveRequests
} from "@/lib/dataService";
import Header from "./Header";

interface ParentViewProps {
  student: Student;
  onLogout: () => void;
}

export default function ParentView({ student, onLogout }: ParentViewProps) {
  const [todayAttendance, setTodayAttendance] = useState<string>("N");
  const [dismissalInfo, setDismissalInfo] = useState<{ time: string; note: string; extra: string }>({
    time: "-",
    note: "Memuat jadwal...",
    extra: ""
  });
  const [activities, setActivities] = useState<ClassActivity[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fees, setFees] = useState<StudentFeeStatus[]>([]);
  const [monthlyRecap, setMonthlyRecap] = useState({ H: 0, S: 0, I: 0, A: 0, total: 0, percent: 0 });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Form Izin Online
  const [leaveDate, setLeaveDate] = useState(getTodayDateString());
  const [leaveCategory, setLeaveCategory] = useState<"Sakit" | "Izin">("Sakit");
  const [leaveNote, setLeaveNote] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState("");

  const today = getTodayDateString();
  const currentMonth = today.slice(0, 7);

  useEffect(() => {
    // 1. Realtime Presensi Hari Ini
    const unsubAtt = subscribeAttendance(today, (rec) => {
      setTodayAttendance(rec[student.name] || "N");
    });

    // 2. Realtime Jam Pulang
    const unsubDism = subscribeDismissal((dSettings) => {
      const dayOfWeek = new Date(today + "T00:00:00").getDay();
      const extraToday = dSettings.extracurricular[dayOfWeek] || "";
      const special = (dSettings.specials || []).find((s) => s.date === today);

      if (special) {
        setDismissalInfo({
          time: special.time,
          note: special.type === "lambat"
            ? "⚠️ Pulang lebih lambat" + (special.reason ? ": " + special.reason : "")
            : "⚠️ Pulang lebih awal" + (special.reason ? ": " + special.reason : ""),
          extra: extraToday
        });
      } else {
        const regularTime = dSettings.regular[dayOfWeek] || "";
        setDismissalInfo({
          time: regularTime,
          note: regularTime ? "Jadwal normal" : "Tidak ada jadwal sekolah",
          extra: extraToday
        });
      }
    });

    // 3. Realtime Kegiatan
    const unsubActs = subscribeActivities((list) => {
      setActivities(list.slice(0, 5));
    });

    // 4. Realtime Pengumuman
    const unsubAnns = subscribeAnnouncements((list) => {
      setAnnouncements(list);
    });

    // 5. Realtime Iuran & Pembayaran
    let latestFees: any[] = [];
    let latestPayments: Record<string, any> = {};

    function updateStudentFees() {
      const studentPayments = latestPayments[student.name] || {};
      const feeList = latestFees
        .filter((f) => f.target === "*" || f.target === student.name)
        .map((f) => ({
          id: f.id,
          feeId: f.id,
          title: f.title,
          amount: f.amount,
          paid: !!studentPayments[f.id]
        }));
      setFees(feeList);
    }

    const unsubFees = subscribeFees((fList) => {
      latestFees = fList;
      updateStudentFees();
    });

    const unsubPayments = subscribePayments((pMap) => {
      latestPayments = pMap;
      updateStudentFees();
    });

    // 6. Realtime Izin Online
    const unsubLeaves = subscribeLeaveRequests((list) => {
      setLeaveRequests(list.filter((l) => l.studentName === student.name));
    });

    // 7. Rekap Absen Bulanan
    getAllAttendance().then((allAtt) => {
      const counts = { H: 0, S: 0, I: 0, A: 0 };
      for (const [dStr, rec] of Object.entries(allAtt)) {
        if (dStr.startsWith(currentMonth) && rec[student.name]) {
          const st = rec[student.name];
          if (st === "H") counts.H++;
          if (st === "S") counts.S++;
          if (st === "I") counts.I++;
          if (st === "A") counts.A++;
        }
      }
      const tot = counts.H + counts.S + counts.I + counts.A;
      setMonthlyRecap({
        ...counts,
        total: tot,
        percent: tot ? Math.round((counts.H / tot) * 100) : 0
      });
    });

    return () => {
      unsubAtt();
      unsubDism();
      unsubActs();
      unsubAnns();
      unsubFees();
      unsubPayments();
      unsubLeaves();
    };
  }, [student.name]);

  async function handleSendLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveNote.trim()) {
      setLeaveMessage("Silakan tulis keterangan izin / sakit ya 🙏");
      return;
    }

    setIsSubmittingLeave(true);
    setLeaveMessage("");

    try {
      const newReq: LeaveRequest = {
        id: "leave-" + Date.now(),
        studentName: student.name,
        date: leaveDate,
        category: leaveCategory,
        note: leaveNote.trim(),
        createdAt: new Date().toISOString(),
        status: "pending"
      };

      await addLeaveRequest(newReq);
      setLeaveNote("");
      setLeaveMessage("Pengajuan izin berhasil dikirim ke guru kelas! 📨");
    } catch (err: any) {
      setLeaveMessage("Gagal mengirim pengajuan, silakan coba lagi.");
    } finally {
      setIsSubmittingLeave(false);
    }
  }

  // Filter pengumuman per kategori
  const prList = announcements.filter(a => a.type === "PR").slice(0, 3);
  const jadwalList = announcements.filter(a => a.type === "Jadwal").slice(0, 3);
  const liburList = announcements.filter(a => a.type === "Libur").slice(0, 3);
  const infoList = announcements.filter(a => a.type === "Info").slice(0, 5);

  const totalUnpaid = fees.filter(f => !f.paid).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="w">
      {/* Header Orang Tua */}
      <Header
        title1="Halo, Orang Tua"
        title2={`${student.name}!`}
        subtitle={`${formatShortDateIndo(today)} • Kelas 4 SDN Kaliwungu 05`}
        showPills={true}
      />

      {/* 1. Kehadiran Hari Ini */}
      <div className="c text-center">
        <h2>📋 Kehadiran hari ini</h2>
        <div className="my-2">
          <span className={`st ${todayAttendance}`}>
            {STATUS_LABELS[todayAttendance] || "Belum diabsen"}
          </span>
        </div>
        <div className="text-xs text-[#5d7f93] mt-2">
          NISN: {student.nisn || "-"} • Data tercatat otomatis oleh wali kelas
        </div>
      </div>

      {/* 2. Jam Pulang Hari Ini */}
      <div className="c text-center">
        <h2>🏠 Jam pulang hari ini</h2>
        <div className="text-3xl font-extrabold text-[#17456b] my-1">
          {dismissalInfo.time ? dismissalInfo.time + " WIB" : "-"}
        </div>
        <div className="text-sm font-semibold text-[#5d7f93]">
          {dismissalInfo.note}
        </div>
        {dismissalInfo.extra && (
          <div className="st I inline-block mt-3 text-xs sm:text-sm">
            🎭 {dismissalInfo.extra}
          </div>
        )}
      </div>

      {/* 3. Kegiatan Kelas */}
      <div className="c">
        <h2>🎨 Kegiatan kelas</h2>
        {activities.length > 0 ? (
          activities.map((k) => (
            <div key={k.id} className="mb-4 pb-3 border-b border-dashed border-[#ffd45a]/50 last:border-none last:pb-0 last:mb-0">
              <div className="text-xs font-bold text-[#5d7f93] mb-1">
                {formatDateIndo(k.date)}
              </div>
              <div className="text-[#17456b] font-medium leading-relaxed">
                {k.text}
              </div>
              {k.imageUrl && (
                <img
                  src={k.imageUrl}
                  alt="Dokumentasi kegiatan"
                  className="w-full rounded-2xl mt-3 shadow-md border-2 border-white object-cover max-h-80"
                />
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-[#5d7f93] py-2">
            Belum ada dokumentasi kegiatan baru 📸
          </div>
        )}
      </div>

      {/* 4. PR (Pekerjaan Rumah) */}
      <div className="c" style={{ borderLeft: "8px solid var(--b)" }}>
        <h2>📚 PR (Pekerjaan Rumah)</h2>
        {prList.length > 0 ? (
          prList.map((item) => (
            <div key={item.id} className="mb-3 pb-2 border-b border-black/5 last:border-none last:mb-0">
              <span className="text-xs font-bold text-[#5d7f93]">{formatDateIndo(item.date)}</span>
              <div className="text-[#17456b] font-semibold mt-0.5">{item.text}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#5d7f93] text-center py-1">
            Tidak ada PR hari ini 🎉
          </div>
        )}
      </div>

      {/* 5. Jadwal Pelajaran */}
      <div className="c" style={{ borderLeft: "8px solid var(--g)" }}>
        <h2>🗓️ Jadwal Pelajaran</h2>
        {jadwalList.length > 0 ? (
          jadwalList.map((item) => (
            <div key={item.id} className="mb-3 pb-2 border-b border-black/5 last:border-none last:mb-0">
              <span className="text-xs font-bold text-[#5d7f93]">{formatDateIndo(item.date)}</span>
              <div className="text-[#17456b] font-medium mt-0.5">{item.text}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#5d7f93] text-center py-1">
            Belum ada info jadwal baru
          </div>
        )}
      </div>

      {/* 6. Tagihan Iuran Siswa */}
      <div className="c" style={{ borderLeft: "8px solid var(--y)" }}>
        <h2>💰 Tagihan iuran {student.name}</h2>
        {fees.length > 0 ? (
          <div className="space-y-3">
            {fees.map((fee) => (
              <div key={fee.id} className="flex justify-between items-center bg-white/60 p-2.5 rounded-xl border border-[#ffd45a]/30">
                <div>
                  <div className="font-semibold text-[#17456b]">{fee.title}</div>
                  <div className="text-sm font-bold text-[#f5a623]">{formatRupiah(fee.amount)}</div>
                </div>
                <span className={`st ${fee.paid ? "H" : "S"} text-xs py-1 px-3`}>
                  {fee.paid ? "Lunas ✅" : "Belum bayar"}
                </span>
              </div>
            ))}
            <div className="text-sm font-bold text-[#5d7f93] pt-2 border-t border-black/5 text-right">
              {totalUnpaid > 0 ? (
                <span>Total belum dibayar: <span className="text-[#ee6b6e]">{formatRupiah(totalUnpaid)}</span></span>
              ) : (
                <span className="text-[#27a98a]">Semua tagihan lunas 🎉</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-[#5d7f93] text-center py-1">
            Tidak ada tagihan iuran 👍
          </div>
        )}
      </div>

      {/* 7. Hari Libur */}
      <div className="c" style={{ borderLeft: "8px solid var(--r)" }}>
        <h2>🏖️ Libur</h2>
        {liburList.length > 0 ? (
          liburList.map((item) => (
            <div key={item.id} className="mb-3 pb-2 border-b border-black/5 last:border-none last:mb-0">
              <span className="text-xs font-bold text-[#5d7f93]">{formatDateIndo(item.date)}</span>
              <div className="text-[#17456b] font-medium mt-0.5">{item.text}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#5d7f93] text-center py-1">
            Belum ada info libur
          </div>
        )}
      </div>

      {/* 8. Informasi dari Guru & Sekolah */}
      <div className="c" style={{ borderLeft: "8px solid var(--pr)" }}>
        <h2>📣 Informasi dari guru &amp; sekolah</h2>
        {infoList.length > 0 ? (
          infoList.map((item) => (
            <div key={item.id} className="mb-3 pb-2 border-b border-black/5 last:border-none last:mb-0">
              <span className="text-xs font-bold text-[#5d7f93]">{formatDateIndo(item.date)}</span>
              <div className="text-[#17456b] font-medium mt-0.5">{item.text}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-[#5d7f93] text-center py-1">
            Belum ada informasi baru
          </div>
        )}
      </div>

      {/* 9. Rekap Kehadiran Bulan Ini */}
      <div className="c">
        <h2>📊 Rekap bulan ini</h2>
        <div className="g4 my-3">
          <div className="H">
            Hadir<br />
            <span className="text-xl">{monthlyRecap.H}</span>
          </div>
          <div className="S">
            Sakit<br />
            <span className="text-xl">{monthlyRecap.S}</span>
          </div>
          <div className="I">
            Izin<br />
            <span className="text-xl">{monthlyRecap.I}</span>
          </div>
          <div className="A">
            Alpa<br />
            <span className="text-xl">{monthlyRecap.A}</span>
          </div>
        </div>
        <div className="text-center text-xs sm:text-sm font-semibold text-[#5d7f93]">
          {monthlyRecap.total > 0
            ? `Kehadiran ${monthlyRecap.percent}% dari ${monthlyRecap.total} hari tercatat`
            : "Belum ada data absensi bulan ini"}
        </div>
      </div>

      {/* 10. Pengajuan Izin Online (Fitur Baru PRD 3.4) */}
      <div className="c">
        <h2>📝 Pengajuan Izin Online</h2>
        <p className="text-xs text-[#5d7f93] text-center mb-3">
          Orang tua dapat mengirimkan pemberitahuan jika anak berhalangan hadir.
        </p>

        <form onSubmit={handleSendLeave} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="text-xs font-bold text-[#17456b] block mb-1">Tanggal Izin:</label>
              <input
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="w-full text-sm"
                required
              />
            </div>
            <div className="w-full sm:w-40">
              <label className="text-xs font-bold text-[#17456b] block mb-1">Kategori:</label>
              <select
                value={leaveCategory}
                onChange={(e) => setLeaveCategory(e.target.value as "Sakit" | "Izin")}
                className="w-full text-sm font-semibold"
              >
                <option value="Sakit">Sakit 🤒</option>
                <option value="Izin">Izin 📝</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#17456b] block mb-1">Keterangan / Alasan:</label>
            <textarea
              value={leaveNote}
              onChange={(e) => setLeaveNote(e.target.value)}
              placeholder="Contoh: Demam sejak semalam, istirahat di rumah / Ada keperluan keluarga di luar kota"
              className="w-full text-sm min-h-[70px]"
              required
            />
          </div>

          {leaveMessage && (
            <div className="p-2.5 rounded-xl bg-[#ffd45a]/30 text-xs font-bold text-[#17456b] text-center">
              {leaveMessage}
            </div>
          )}

          <div className="text-center pt-1">
            <button
              type="submit"
              disabled={isSubmittingLeave}
              className="btn-wonder w-full sm:w-auto"
            >
              {isSubmittingLeave ? "Mengirim..." : "Kirim Pemberitahuan Izin 📨"}
            </button>
          </div>
        </form>

        {/* Riwayat Pengajuan Izin */}
        {leaveRequests.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dashed border-[#ffd45a]">
            <div className="text-xs font-bold text-[#17456b] mb-2">Riwayat Pengajuan:</div>
            <div className="space-y-2">
              {leaveRequests.slice(0, 3).map((lr) => (
                <div key={lr.id} className="text-xs bg-white/70 p-2.5 rounded-xl border border-black/5 flex justify-between items-center">
                  <div>
                    <span className="font-bold">{formatShortDateIndo(lr.date)}</span> • {lr.category}
                    <div className="text-[#5d7f93] italic mt-0.5">{lr.note}</div>
                  </div>
                  <span className={`st text-[10px] py-1 px-2.5 ${lr.status === "approved" ? "H" : lr.status === "rejected" ? "S" : "I"}`}>
                    {lr.status === "approved" ? "Disetujui Guru ✅" : lr.status === "rejected" ? "Ditolak" : "Menunggu Guru ⏳"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tombol Keluar */}
      <div className="flex justify-center my-6">
        <button
          onClick={onLogout}
          className="btn-wonder"
          style={{ background: "var(--mu)", color: "#fff", boxShadow: "none" }}
        >
          Keluar
        </button>
      </div>
    </div>
  );
}

