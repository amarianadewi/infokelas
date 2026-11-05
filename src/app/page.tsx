"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ParentView from "@/components/ParentView";
import TeacherView from "@/components/TeacherView";
import { Student } from "@/types";
import { getStudents, hashPin, verifyAdminPin } from "@/lib/dataService";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [nisnInput, setNisnInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mode login: PIN (default lama) vs Guru Email (Firebase Auth)
  const [loginMode, setLoginMode] = useState<"pin" | "guru_email">("pin");
  const [guruEmail, setGuruEmail] = useState("");
  const [guruPassword, setGuruPassword] = useState("");
  const [isLoggingInEmail, setIsLoggingInEmail] = useState(false);

  useEffect(() => {
    // Check saved session
    checkSavedSession();
  }, []);

  async function checkSavedSession() {
    try {
      const savedPin = localStorage.getItem("infokelas_pin");
      if (savedPin) {
        await executePinLogin(savedPin);
      }
    } catch (e) {
      console.warn("Failed checking session:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function executePinLogin(p: string) {
    const trimmed = p.trim();
    if (!trimmed) {
      setErrorMessage("Silakan masukkan PIN ya 🙏");
      return;
    }

    // 1. Cek Admin PIN (470560)
    if (verifyAdminPin(trimmed)) {
      setIsTeacher(true);
      setCurrentUser(null);
      setErrorMessage("");
      localStorage.setItem("infokelas_pin", trimmed);
      return;
    }

    // 2. Cek Murid
    const hashed = await hashPin(trimmed);
    const students = await getStudents();

    // Match by PIN langsung atau Hash PIN atau NISN
    const student = students.find(
      (s) => s.pin === trimmed || s.pinHash === hashed || (nisnInput && s.nisn === nisnInput.trim() && s.pin === trimmed)
    );

    if (student) {
      setCurrentUser(student);
      setIsTeacher(false);
      setErrorMessage("");
      localStorage.setItem("infokelas_pin", trimmed);
    } else {
      setErrorMessage("PIN belum tepat, coba lagi ya 🙏");
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    await executePinLogin(pinInput);
    setIsLoading(false);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!guruEmail || !guruPassword) {
      setErrorMessage("Mohon lengkapi email dan password guru.");
      return;
    }

    setIsLoggingInEmail(true);
    setErrorMessage("");

    try {
      await signInWithEmailAndPassword(auth, guruEmail, guruPassword);
      setIsTeacher(true);
      setCurrentUser(null);
      localStorage.setItem("infokelas_pin", "470560");
    } catch (err: any) {
      console.warn("Firebase Auth error:", err);
      // Fallback friendly message
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setErrorMessage("Email atau password guru belum sesuai.");
      } else if (err.code === "auth/configuration-not-found" || err.message?.includes("configuration-not-found")) {
        setErrorMessage("Provider Email/Password belum diaktifkan di Firebase Console. Anda bisa menggunakan PIN Guru (470560) untuk masuk!");
      } else {
        setErrorMessage(err.message || "Gagal masuk via Firebase Auth.");
      }
    } finally {
      setIsLoggingInEmail(false);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setIsTeacher(false);
    setPinInput("");
    setNisnInput("");
    setErrorMessage("");
    try {
      localStorage.removeItem("infokelas_pin");
    } catch {}
  }

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col justify-between">
        <div className="w">
          <Header />
          <div className="c text-center py-10">
            <div className="text-sm font-bold text-[#5d7f93] animate-pulse">
              Memuat data kelas... 🎒
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col justify-between">
      {/* Jika Orang Tua sudah Login */}
      {currentUser && (
        <ParentView student={currentUser} onLogout={handleLogout} />
      )}

      {/* Jika Guru sudah Login */}
      {isTeacher && (
        <TeacherView onLogout={handleLogout} />
      )}

      {/* Tampilan Login Utama (Bila Belum Login) */}
      {!currentUser && !isTeacher && (
        <div className="w">
          <Header
            title1="Info Harian"
            title2="Kelas 4 Ceria"
            subtitle="SDN Kaliwungu 05"
            showPills={true}
          />

          {loginMode === "pin" ? (
            <div className="c">
              <h2>Masukkan PIN</h2>
              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="PIN dari wali kelas"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="flex-1 text-base font-bold tracking-widest text-center"
                    autoFocus
                  />
                  <button type="submit" className="btn-wonder text-base">
                    Masuk
                  </button>
                </div>

                {errorMessage && (
                  <div className="text-xs font-bold text-[#ee6b6e] text-center mt-2">
                    {errorMessage}
                  </div>
                )}
              </form>

              {/* Petunjuk Akses */}
              <div className="mt-5 pt-3 border-t border-dashed border-[#ffd45a]/60 text-xs text-[#5d7f93]">
                <div className="font-bold text-[#17456b] mb-1">💡 Bantuan Akses Masuk:</div>
                <div className="leading-relaxed">
                  • <b>Orang Tua Murid:</b> Gunakan 4 digit PIN yang dibagikan guru (contoh: Arka <code>5594</code>, Karel <code>6726</code>, Nicho <code>2460</code>, Bella <code>4090</code>, Ragil <code>5389</code>).
                  <br />
                  • <b>Wali Kelas / Guru:</b> Gunakan PIN Guru <code>470560</code> atau login via email Firebase Auth.
                </div>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("guru_email");
                      setErrorMessage("");
                    }}
                    className="text-xs font-bold text-[#1c5fa8] hover:underline"
                  >
                    🔐 Masuk sebagai Guru via Email &amp; Password Firebase
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="c">
              <h2>Login Guru (Firebase Auth)</h2>
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#17456b] block mb-1">Email Guru:</label>
                  <input
                    type="email"
                    placeholder="guru@sdnkaliwungu05.sch.id"
                    value={guruEmail}
                    onChange={(e) => setGuruEmail(e.target.value)}
                    className="w-full text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#17456b] block mb-1">Password:</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={guruPassword}
                    onChange={(e) => setGuruPassword(e.target.value)}
                    className="w-full text-sm"
                    required
                  />
                </div>

                {errorMessage && (
                  <div className="text-xs font-bold text-[#ee6b6e] text-center mt-1">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("pin");
                      setErrorMessage("");
                    }}
                    className="btn-wonder flex-1 bg-gray-200 text-gray-700"
                  >
                    ← Kembali ke PIN
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingInEmail}
                    className="btn-wonder flex-1"
                  >
                    {isLoggingInEmail ? "Masuk..." : "Masuk Guru"}
                  </button>
                </div>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      executePinLogin("470560");
                    }}
                    className="text-xs font-bold text-[#27a98a] hover:underline"
                  >
                    ⚡ Atau Masuk Langsung dengan PIN Guru (470560)
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <Footer />
    </main>
  );
}
