"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ParentView from "@/components/ParentView";
import TeacherView from "@/components/TeacherView";
import { Student } from "@/types";
import { getStudents, hashPin } from "@/lib/dataService";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [nisnInput, setNisnInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Tab Login: "pin" (Wali Murid) vs "guru" (Wali Kelas)
  const [loginMode, setLoginMode] = useState<"pin" | "guru">("pin");
  const [guruEmail, setGuruEmail] = useState("");
  const [guruPassword, setGuruPassword] = useState("");
  const [isLoggingInEmail, setIsLoggingInEmail] = useState(false);

  useEffect(() => {
    // 1. Listen to Firebase Auth state for Wali Kelas
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsTeacher(true);
        setCurrentUser(null);
      } else {
        setIsTeacher(false);
        // If not teacher, check saved parent PIN
        checkSavedParentSession();
      }
    });

    return () => unsubscribe();
  }, []);

  async function checkSavedParentSession() {
    try {
      const savedPin = localStorage.getItem("infokelas_parent_pin");
      if (savedPin) {
        await executeParentPinLogin(savedPin, false);
      }
    } catch (e) {
      console.warn("Failed checking session:", e);
    }
  }

  async function executeParentPinLogin(p: string, showErrors = true) {
    const trimmed = p.trim();
    if (!trimmed) {
      if (showErrors) setErrorMessage("Silakan masukkan PIN ya 🙏");
      return;
    }

    // Jika mencoba PIN admin lama, arahkan ke tab Wali Kelas
    if (trimmed === "470560") {
      if (showErrors) {
        setErrorMessage("Khusus wali kelas, silakan masuk melalui tab 'Wali Kelas'.");
        setLoginMode("guru");
      }
      return;
    }

    const hashed = await hashPin(trimmed);
    const students = await getStudents();

    // Match student by PIN or hashed PIN
    const student = students.find(
      (s) => s.pin === trimmed || s.pinHash === hashed || (nisnInput && s.nisn === nisnInput.trim() && s.pin === trimmed)
    );

    if (student) {
      setCurrentUser(student);
      setIsTeacher(false);
      setErrorMessage("");
      localStorage.setItem("infokelas_parent_pin", trimmed);
    } else {
      if (showErrors) setErrorMessage("PIN belum tepat, coba lagi ya 🙏");
    }
  }

  async function handleParentPinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    await executeParentPinLogin(pinInput, true);
    setIsLoading(false);
  }

  async function handleTeacherEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!guruEmail.trim() || !guruPassword) {
      setErrorMessage("Mohon lengkapi email dan password wali kelas.");
      return;
    }

    setIsLoggingInEmail(true);
    setErrorMessage("");

    try {
      await signInWithEmailAndPassword(auth, guruEmail.trim(), guruPassword);
      setIsTeacher(true);
      setCurrentUser(null);
      // Remove any parent pin
      localStorage.removeItem("infokelas_parent_pin");
    } catch (err: any) {
      console.warn("Firebase Auth login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setErrorMessage("Email atau password wali kelas salah. Silakan periksa kembali.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMessage("Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.");
      } else {
        setErrorMessage(err.message || "Gagal masuk. Periksa kembali email dan password.");
      }
    } finally {
      setIsLoggingInEmail(false);
    }
  }

  async function handleLogout() {
    if (isTeacher) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("SignOut error:", e);
      }
      setIsTeacher(false);
      setFirebaseUser(null);
    }

    setCurrentUser(null);
    setPinInput("");
    setNisnInput("");
    setGuruPassword("");
    setErrorMessage("");
    try {
      localStorage.removeItem("infokelas_parent_pin");
    } catch {}
  }

  return (
    <main className="flex-1 flex flex-col justify-between">
      {/* 1. Jika Wali Murid sudah Login */}
      {currentUser && (
        <ParentView student={currentUser} onLogout={handleLogout} />
      )}

      {/* 2. Jika Wali Kelas sudah Login via Firebase Auth */}
      {isTeacher && (
        <TeacherView onLogout={handleLogout} />
      )}

      {/* 3. Tampilan Login Utama */}
      {!currentUser && !isTeacher && (
        <div className="w">
          <Header
            title1="Info Harian"
            title2="Kelas 4 Ceria"
            subtitle="SDN Kaliwungu 05"
            showPills={true}
          />

          <div className="c">
            {/* Tab Navigasi Login */}
            <div className="flex bg-[#e8f8f4] p-1.5 rounded-2xl mb-4 border border-[#ffd45a]/50">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("pin");
                  setErrorMessage("");
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  loginMode === "pin"
                    ? "bg-[#ffd45a] text-[#5a3a00] shadow-sm"
                    : "text-[#5d7f93] hover:text-[#17456b]"
                }`}
              >
                👨‍👩‍👧 Wali Murid
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("guru");
                  setErrorMessage("");
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  loginMode === "guru"
                    ? "bg-[#27a98a] text-white shadow-sm"
                    : "text-[#5d7f93] hover:text-[#17456b]"
                }`}
              >
                👩‍🏫 Wali Kelas
              </button>
            </div>

            {/* Form Mode 1: Wali Murid */}
            {loginMode === "pin" ? (
              <div>
                <h2>Masukkan PIN</h2>
                <p className="text-xs text-[#5d7f93] text-center mb-3">
                  Masukkan PIN dari wali kelas untuk melihat informasi harian anak.
                </p>

                <form onSubmit={handleParentPinSubmit} className="space-y-3">
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
                    <button type="submit" disabled={isLoading} className="btn-wonder text-base">
                      {isLoading ? "..." : "Masuk"}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="text-xs font-bold text-[#ee6b6e] text-center mt-2">
                      {errorMessage}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              /* Form Mode 2: Wali Kelas */
              <div>
                <h2>Masuk Wali Kelas</h2>
                <p className="text-xs text-[#5d7f93] text-center mb-3">
                  Silakan masukkan email dan password untuk mengelola data kelas.
                </p>

                <form onSubmit={handleTeacherEmailLogin} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#17456b] block mb-1">Email:</label>
                    <input
                      type="email"
                      placeholder="Email wali kelas"
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
                      placeholder="Password"
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

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoggingInEmail}
                      className="btn-wonder w-full py-3 text-sm font-bold bg-[#27a98a] text-white"
                      style={{ background: "linear-gradient(#27a98a, #1b8f7a)" }}
                    >
                      {isLoggingInEmail ? "Memeriksa..." : "🔐 Masuk sebagai Wali Kelas"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
