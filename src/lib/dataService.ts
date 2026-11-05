import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";
import {
  Student,
  AttendanceRecord,
  DismissalSettings,
  ClassActivity,
  Announcement,
  FeeItem,
  LeaveRequest,
  StudentFeeStatus
} from "@/types";
import {
  INITIAL_STUDENTS,
  INITIAL_DISMISSAL,
  INITIAL_ATTENDANCE_RECORD,
  INITIAL_ACTIVITIES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_FEES,
  APP_SALT,
  ADMIN_HASH
} from "./initialData";

const STORAGE_KEYS = {
  STUDENTS: "infokelas_students_v2",
  ATTENDANCE: "infokelas_attendance_v2",
  DISMISSAL: "infokelas_dismissal_v2",
  ACTIVITIES: "infokelas_activities_v2",
  ANNOUNCEMENTS: "infokelas_announcements_v2",
  FEES: "infokelas_fees_v2",
  PAYMENTS: "infokelas_payments_v2",
  LEAVE: "infokelas_leave_requests_v2"
};

// SHA-256 with salt kw05
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(APP_SALT + pin.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function verifyAdminPin(pinOrHash: string): boolean {
  return pinOrHash === "470560" || pinOrHash === ADMIN_HASH;
}

// LocalStorage helpers
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed:", e);
  }
}

let isFirestoreAvailable = true;
let lastFirestoreError = "";

export function getFirestoreSyncState() {
  return { isAvailable: isFirestoreAvailable, lastError: lastFirestoreError };
}

// 1. STUDENTS
export async function getStudents(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, "students"));
    if (!snap.empty) {
      const list: Student[] = [];
      snap.forEach(d => list.push({ ...(d.data() as Student), id: d.id }));
      setLocal(STORAGE_KEYS.STUDENTS, list);
      isFirestoreAvailable = true;
      return list;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  // Fallback to local
  return getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
}

export async function saveStudent(student: Student): Promise<void> {
  const students = await getStudents();
  const idx = students.findIndex(s => s.id === student.id || s.name.toLowerCase() === student.name.toLowerCase());
  if (idx >= 0) {
    students[idx] = student;
  } else {
    students.push(student);
  }
  setLocal(STORAGE_KEYS.STUDENTS, students);

  try {
    await setDoc(doc(db, "students", student.id), student);
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
}

export async function deleteStudent(studentId: string): Promise<void> {
  const students = (await getStudents()).filter(s => s.id !== studentId);
  setLocal(STORAGE_KEYS.STUDENTS, students);

  try {
    await deleteDoc(doc(db, "students", studentId));
  } catch (err: any) {
    lastFirestoreError = err?.message || String(err);
  }
}

// 2. ATTENDANCE
export async function getAttendance(date: string): Promise<AttendanceRecord> {
  try {
    const snap = await getDoc(doc(db, "attendance", date));
    if (snap.exists()) {
      const data = snap.data();
      const rec = (data.records || {}) as AttendanceRecord;
      const all = getLocal<{ [d: string]: AttendanceRecord }>(STORAGE_KEYS.ATTENDANCE, {
        "2026-11-05": INITIAL_ATTENDANCE_RECORD
      });
      all[date] = rec;
      setLocal(STORAGE_KEYS.ATTENDANCE, all);
      isFirestoreAvailable = true;
      return rec;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  const all = getLocal<{ [d: string]: AttendanceRecord }>(STORAGE_KEYS.ATTENDANCE, {
    "2026-11-05": INITIAL_ATTENDANCE_RECORD
  });
  return all[date] || {};
}

export async function getAllAttendance(): Promise<{ [d: string]: AttendanceRecord }> {
  try {
    const snap = await getDocs(collection(db, "attendance"));
    if (!snap.empty) {
      const result: { [d: string]: AttendanceRecord } = {};
      snap.forEach(docSnap => {
        result[docSnap.id] = (docSnap.data().records || {}) as AttendanceRecord;
      });
      setLocal(STORAGE_KEYS.ATTENDANCE, result);
      isFirestoreAvailable = true;
      return result;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  return getLocal<{ [d: string]: AttendanceRecord }>(STORAGE_KEYS.ATTENDANCE, {
    "2026-11-05": INITIAL_ATTENDANCE_RECORD
  });
}

export async function saveAttendance(date: string, records: AttendanceRecord): Promise<void> {
  const all = getLocal<{ [d: string]: AttendanceRecord }>(STORAGE_KEYS.ATTENDANCE, {
    "2026-11-05": INITIAL_ATTENDANCE_RECORD
  });
  all[date] = records;
  setLocal(STORAGE_KEYS.ATTENDANCE, all);

  try {
    await setDoc(doc(db, "attendance", date), {
      date,
      records,
      updatedAt: new Date().toISOString()
    });
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
}

// 3. DISMISSAL SETTINGS
export async function getDismissalSettings(): Promise<DismissalSettings> {
  try {
    const snap = await getDoc(doc(db, "dismissal_settings", "default"));
    if (snap.exists()) {
      const data = snap.data() as DismissalSettings;
      setLocal(STORAGE_KEYS.DISMISSAL, data);
      isFirestoreAvailable = true;
      return data;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  return getLocal<DismissalSettings>(STORAGE_KEYS.DISMISSAL, INITIAL_DISMISSAL);
}

export async function saveDismissalSettings(settings: DismissalSettings): Promise<void> {
  setLocal(STORAGE_KEYS.DISMISSAL, settings);

  try {
    await setDoc(doc(db, "dismissal_settings", "default"), settings);
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
}

// 4. CLASS ACTIVITIES
export async function getActivities(): Promise<ClassActivity[]> {
  try {
    const snap = await getDocs(collection(db, "activities"));
    if (!snap.empty) {
      const list: ClassActivity[] = [];
      snap.forEach(d => list.push({ ...(d.data() as ClassActivity), id: d.id }));
      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setLocal(STORAGE_KEYS.ACTIVITIES, list);
      isFirestoreAvailable = true;
      return list;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  return getLocal<ClassActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
}

export async function addActivity(activity: ClassActivity): Promise<void> {
  const list = [activity, ...(await getActivities())].slice(0, 30);
  setLocal(STORAGE_KEYS.ACTIVITIES, list);

  try {
    await setDoc(doc(db, "activities", activity.id), activity);
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
}

export async function deleteActivity(id: string): Promise<void> {
  const list = (await getActivities()).filter(a => a.id !== id);
  setLocal(STORAGE_KEYS.ACTIVITIES, list);

  try {
    await deleteDoc(doc(db, "activities", id));
  } catch (err: any) {
    lastFirestoreError = err?.message || String(err);
  }
}

// 5. ANNOUNCEMENTS (PR, Jadwal, Libur, Info)
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await getDocs(collection(db, "announcements"));
    if (!snap.empty) {
      const list: Announcement[] = [];
      snap.forEach(d => list.push({ ...(d.data() as Announcement), id: d.id }));
      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setLocal(STORAGE_KEYS.ANNOUNCEMENTS, list);
      isFirestoreAvailable = true;
      return list;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  return getLocal<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
}

export async function addAnnouncement(announcement: Announcement): Promise<void> {
  const list = [announcement, ...(await getAnnouncements())].slice(0, 50);
  setLocal(STORAGE_KEYS.ANNOUNCEMENTS, list);

  try {
    await setDoc(doc(db, "announcements", announcement.id), announcement);
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const list = (await getAnnouncements()).filter(a => a.id !== id);
  setLocal(STORAGE_KEYS.ANNOUNCEMENTS, list);

  try {
    await deleteDoc(doc(db, "announcements", id));
  } catch (err: any) {
    lastFirestoreError = err?.message || String(err);
  }
}

// 6. FEES & PAYMENTS
export async function getFees(): Promise<FeeItem[]> {
  try {
    const snap = await getDocs(collection(db, "fees"));
    if (!snap.empty) {
      const list: FeeItem[] = [];
      snap.forEach(d => list.push({ ...(d.data() as FeeItem), id: d.id }));
      setLocal(STORAGE_KEYS.FEES, list);
      isFirestoreAvailable = true;
      return list;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  return getLocal<FeeItem[]>(STORAGE_KEYS.FEES, INITIAL_FEES);
}

export async function addFee(fee: FeeItem): Promise<void> {
  const list = [fee, ...(await getFees())];
  setLocal(STORAGE_KEYS.FEES, list);

  try {
    await setDoc(doc(db, "fees", fee.id), fee);
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
}

export async function deleteFee(feeId: string): Promise<void> {
  const list = (await getFees()).filter(f => f.id !== feeId);
  setLocal(STORAGE_KEYS.FEES, list);

  try {
    await deleteDoc(doc(db, "fees", feeId));
  } catch (err: any) {
    lastFirestoreError = err?.message || String(err);
  }
}

// Payments map: { [studentName]: { [feeId]: boolean } }
export async function getPayments(): Promise<{ [studentName: string]: { [feeId: string]: boolean } }> {
  try {
    const snap = await getDoc(doc(db, "payments", "all"));
    if (snap.exists()) {
      const data = snap.data() as { [studentName: string]: { [feeId: string]: boolean } };
      setLocal(STORAGE_KEYS.PAYMENTS, data);
      isFirestoreAvailable = true;
      return data;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  return getLocal<{ [studentName: string]: { [feeId: string]: boolean } }>(STORAGE_KEYS.PAYMENTS, {});
}

export async function togglePayment(studentName: string, feeId: string): Promise<boolean> {
  const payments = await getPayments();
  payments[studentName] = payments[studentName] || {};
  const newStatus = !payments[studentName][feeId];
  payments[studentName][feeId] = newStatus;
  setLocal(STORAGE_KEYS.PAYMENTS, payments);

  try {
    await setDoc(doc(db, "payments", "all"), payments);
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
  return newStatus;
}

export async function getStudentFees(studentName: string): Promise<StudentFeeStatus[]> {
  const [fees, payments] = await Promise.all([getFees(), getPayments()]);
  const studentPayments = payments[studentName] || {};

  return fees
    .filter(f => f.target === "*" || f.target === studentName)
    .map(f => ({
      id: f.id,
      feeId: f.id,
      title: f.title,
      amount: f.amount,
      paid: !!studentPayments[f.id]
    }));
}

// 7. LEAVE REQUESTS (Izin Online)
export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const snap = await getDocs(collection(db, "leave_requests"));
    if (!snap.empty) {
      const list: LeaveRequest[] = [];
      snap.forEach(d => list.push({ ...(d.data() as LeaveRequest), id: d.id }));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setLocal(STORAGE_KEYS.LEAVE, list);
      isFirestoreAvailable = true;
      return list;
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }

  return getLocal<LeaveRequest[]>(STORAGE_KEYS.LEAVE, []);
}

export async function addLeaveRequest(req: LeaveRequest): Promise<void> {
  const list = [req, ...(await getLeaveRequests())];
  setLocal(STORAGE_KEYS.LEAVE, list);

  try {
    await setDoc(doc(db, "leave_requests", req.id), req);
    isFirestoreAvailable = true;
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
  }
}

export async function updateLeaveRequestStatus(
  id: string,
  status: "approved" | "rejected",
  applyToAttendance?: boolean
): Promise<void> {
  const list = await getLeaveRequests();
  const target = list.find(r => r.id === id);
  if (!target) return;

  target.status = status;
  setLocal(STORAGE_KEYS.LEAVE, list);

  try {
    await setDoc(doc(db, "leave_requests", id), target);
    isFirestoreAvailable = true;
  } catch (err: any) {
    lastFirestoreError = err?.message || String(err);
  }

  if (applyToAttendance && status === "approved") {
    const attendance = await getAttendance(target.date);
    attendance[target.studentName] = target.category === "Sakit" ? "S" : "I";
    await saveAttendance(target.date, attendance);
  }
}

// 8. ONE-CLICK SYNC ALL DATA TO FIREBASE
export async function syncAllToFirebase(): Promise<{ success: boolean; message: string }> {
  try {
    const students = await getStudents();
    for (const s of students) {
      await setDoc(doc(db, "students", s.id), s);
    }

    const dismissal = await getDismissalSettings();
    await setDoc(doc(db, "dismissal_settings", "default"), dismissal);

    const allAttendance = await getAllAttendance();
    for (const [date, records] of Object.entries(allAttendance)) {
      await setDoc(doc(db, "attendance", date), { date, records, updatedAt: new Date().toISOString() });
    }

    const activities = await getActivities();
    for (const a of activities) {
      await setDoc(doc(db, "activities", a.id), a);
    }

    const announcements = await getAnnouncements();
    for (const an of announcements) {
      await setDoc(doc(db, "announcements", an.id), an);
    }

    const fees = await getFees();
    for (const f of fees) {
      await setDoc(doc(db, "fees", f.id), f);
    }

    const payments = await getPayments();
    await setDoc(doc(db, "payments", "all"), payments);

    isFirestoreAvailable = true;
    return { success: true, message: "Seluruh data berhasil disinkronkan ke Firebase Cloud Firestore! 🎉" };
  } catch (err: any) {
    isFirestoreAvailable = false;
    lastFirestoreError = err?.message || String(err);
    return { success: false, message: `Gagal sinkron ke Firebase: ${err?.message || "Pastikan Firestore Database telah diaktifkan di Firebase Console."}` };
  }
}
