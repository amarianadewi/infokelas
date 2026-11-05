import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  Unsubscribe
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
  APP_SALT
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

// =========================================================================
// REALTIME SUBSCRIPTIONS & DIRECT MUTATIONS (FIREBASE FIRESTORE REALTIME)
// =========================================================================

// 1. STUDENTS
export function subscribeStudents(callback: (students: Student[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, "students"),
    (snap) => {
      if (!snap.empty) {
        const list: Student[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as Student), id: d.id }));
        setLocal(STORAGE_KEYS.STUDENTS, list);
        callback(list);
      } else {
        callback(getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS));
      }
    },
    (err) => {
      console.warn("Firestore subscribeStudents error:", err);
      callback(getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS));
    }
  );
}

export async function getStudents(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, "students"));
    if (!snap.empty) {
      const list: Student[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as Student), id: d.id }));
      setLocal(STORAGE_KEYS.STUDENTS, list);
      return list;
    }
  } catch (err) {
    console.warn("Firestore getStudents error:", err);
  }
  return getLocal<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
}

export async function saveStudent(student: Student): Promise<void> {
  const students = await getStudents();
  const idx = students.findIndex((s) => s.id === student.id || s.name.toLowerCase() === student.name.toLowerCase());
  if (idx >= 0) students[idx] = student;
  else students.push(student);
  setLocal(STORAGE_KEYS.STUDENTS, students);

  // Direct write to Firebase Firestore
  await setDoc(doc(db, "students", student.id), student);
}

export async function deleteStudent(studentId: string): Promise<void> {
  const students = (await getStudents()).filter((s) => s.id !== studentId);
  setLocal(STORAGE_KEYS.STUDENTS, students);

  // Direct delete from Firebase Firestore
  await deleteDoc(doc(db, "students", studentId));
}

// 2. ATTENDANCE (PRESENSI)
export function subscribeAttendance(date: string, callback: (records: AttendanceRecord) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "attendance", date),
    (snap) => {
      if (snap.exists()) {
        const rec = (snap.data().records || {}) as AttendanceRecord;
        const all = getLocal<{ [d: string]: AttendanceRecord }>(STORAGE_KEYS.ATTENDANCE, {
          "2026-11-05": INITIAL_ATTENDANCE_RECORD
        });
        all[date] = rec;
        setLocal(STORAGE_KEYS.ATTENDANCE, all);
        callback(rec);
      } else {
        const all = getLocal<{ [d: string]: AttendanceRecord }>(STORAGE_KEYS.ATTENDANCE, {
          "2026-11-05": INITIAL_ATTENDANCE_RECORD
        });
        callback(all[date] || {});
      }
    },
    (err) => {
      console.warn("Firestore subscribeAttendance error:", err);
      const all = getLocal<{ [d: string]: AttendanceRecord }>(STORAGE_KEYS.ATTENDANCE, {
        "2026-11-05": INITIAL_ATTENDANCE_RECORD
      });
      callback(all[date] || {});
    }
  );
}

export async function getAttendance(date: string): Promise<AttendanceRecord> {
  try {
    const snap = await getDoc(doc(db, "attendance", date));
    if (snap.exists()) {
      const rec = (snap.data().records || {}) as AttendanceRecord;
      return rec;
    }
  } catch (err) {
    console.warn("Firestore getAttendance error:", err);
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
      snap.forEach((docSnap) => {
        result[docSnap.id] = (docSnap.data().records || {}) as AttendanceRecord;
      });
      setLocal(STORAGE_KEYS.ATTENDANCE, result);
      return result;
    }
  } catch (err) {
    console.warn("Firestore getAllAttendance error:", err);
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

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "attendance", date), {
    date,
    records,
    updatedAt: new Date().toISOString()
  });
}

// 3. DISMISSAL SETTINGS (JAM PULANG)
export function subscribeDismissal(callback: (settings: DismissalSettings) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "dismissal_settings", "default"),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as DismissalSettings;
        setLocal(STORAGE_KEYS.DISMISSAL, data);
        callback(data);
      } else {
        callback(getLocal<DismissalSettings>(STORAGE_KEYS.DISMISSAL, INITIAL_DISMISSAL));
      }
    },
    (err) => {
      console.warn("Firestore subscribeDismissal error:", err);
      callback(getLocal<DismissalSettings>(STORAGE_KEYS.DISMISSAL, INITIAL_DISMISSAL));
    }
  );
}

export async function getDismissalSettings(): Promise<DismissalSettings> {
  try {
    const snap = await getDoc(doc(db, "dismissal_settings", "default"));
    if (snap.exists()) {
      const data = snap.data() as DismissalSettings;
      setLocal(STORAGE_KEYS.DISMISSAL, data);
      return data;
    }
  } catch (err) {
    console.warn("Firestore getDismissalSettings error:", err);
  }
  return getLocal<DismissalSettings>(STORAGE_KEYS.DISMISSAL, INITIAL_DISMISSAL);
}

export async function saveDismissalSettings(settings: DismissalSettings): Promise<void> {
  setLocal(STORAGE_KEYS.DISMISSAL, settings);

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "dismissal_settings", "default"), settings);
}

// 4. CLASS ACTIVITIES (KEGIATAN & FOTO)
export function subscribeActivities(callback: (acts: ClassActivity[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, "activities"),
    (snap) => {
      if (!snap.empty) {
        const list: ClassActivity[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as ClassActivity), id: d.id }));
        list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setLocal(STORAGE_KEYS.ACTIVITIES, list);
        callback(list);
      } else {
        callback(getLocal<ClassActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES));
      }
    },
    (err) => {
      console.warn("Firestore subscribeActivities error:", err);
      callback(getLocal<ClassActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES));
    }
  );
}

export async function getActivities(): Promise<ClassActivity[]> {
  try {
    const snap = await getDocs(collection(db, "activities"));
    if (!snap.empty) {
      const list: ClassActivity[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as ClassActivity), id: d.id }));
      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setLocal(STORAGE_KEYS.ACTIVITIES, list);
      return list;
    }
  } catch (err) {
    console.warn("Firestore getActivities error:", err);
  }
  return getLocal<ClassActivity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
}

export async function addActivity(activity: ClassActivity): Promise<void> {
  const list = [activity, ...(await getActivities())].slice(0, 30);
  setLocal(STORAGE_KEYS.ACTIVITIES, list);

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "activities", activity.id), activity);
}

export async function deleteActivity(id: string): Promise<void> {
  const list = (await getActivities()).filter((a) => a.id !== id);
  setLocal(STORAGE_KEYS.ACTIVITIES, list);

  // Direct real-time delete from Firebase Firestore
  await deleteDoc(doc(db, "activities", id));
}

// 5. ANNOUNCEMENTS (PR, JADWAL, LIBUR, INFO)
export function subscribeAnnouncements(callback: (anns: Announcement[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, "announcements"),
    (snap) => {
      if (!snap.empty) {
        const list: Announcement[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as Announcement), id: d.id }));
        list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setLocal(STORAGE_KEYS.ANNOUNCEMENTS, list);
        callback(list);
      } else {
        callback(getLocal<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS));
      }
    },
    (err) => {
      console.warn("Firestore subscribeAnnouncements error:", err);
      callback(getLocal<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS));
    }
  );
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await getDocs(collection(db, "announcements"));
    if (!snap.empty) {
      const list: Announcement[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as Announcement), id: d.id }));
      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setLocal(STORAGE_KEYS.ANNOUNCEMENTS, list);
      return list;
    }
  } catch (err) {
    console.warn("Firestore getAnnouncements error:", err);
  }
  return getLocal<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
}

export async function addAnnouncement(announcement: Announcement): Promise<void> {
  const list = [announcement, ...(await getAnnouncements())].slice(0, 50);
  setLocal(STORAGE_KEYS.ANNOUNCEMENTS, list);

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "announcements", announcement.id), announcement);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const list = (await getAnnouncements()).filter((a) => a.id !== id);
  setLocal(STORAGE_KEYS.ANNOUNCEMENTS, list);

  // Direct real-time delete from Firebase Firestore
  await deleteDoc(doc(db, "announcements", id));
}

// 6. FEES & PAYMENTS (IURAN & STATUS PEMBAYARAN)
export function subscribeFees(callback: (fees: FeeItem[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, "fees"),
    (snap) => {
      if (!snap.empty) {
        const list: FeeItem[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as FeeItem), id: d.id }));
        setLocal(STORAGE_KEYS.FEES, list);
        callback(list);
      } else {
        callback(getLocal<FeeItem[]>(STORAGE_KEYS.FEES, INITIAL_FEES));
      }
    },
    (err) => {
      console.warn("Firestore subscribeFees error:", err);
      callback(getLocal<FeeItem[]>(STORAGE_KEYS.FEES, INITIAL_FEES));
    }
  );
}

export async function getFees(): Promise<FeeItem[]> {
  try {
    const snap = await getDocs(collection(db, "fees"));
    if (!snap.empty) {
      const list: FeeItem[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as FeeItem), id: d.id }));
      setLocal(STORAGE_KEYS.FEES, list);
      return list;
    }
  } catch (err) {
    console.warn("Firestore getFees error:", err);
  }
  return getLocal<FeeItem[]>(STORAGE_KEYS.FEES, INITIAL_FEES);
}

export async function addFee(fee: FeeItem): Promise<void> {
  const list = [fee, ...(await getFees())];
  setLocal(STORAGE_KEYS.FEES, list);

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "fees", fee.id), fee);
}

export async function deleteFee(feeId: string): Promise<void> {
  const list = (await getFees()).filter((f) => f.id !== feeId);
  setLocal(STORAGE_KEYS.FEES, list);

  // Direct real-time delete from Firebase Firestore
  await deleteDoc(doc(db, "fees", feeId));
}

export function subscribePayments(callback: (payments: { [studentName: string]: { [feeId: string]: boolean } }) => void): Unsubscribe {
  return onSnapshot(
    doc(db, "payments", "all"),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { [studentName: string]: { [feeId: string]: boolean } };
        setLocal(STORAGE_KEYS.PAYMENTS, data);
        callback(data);
      } else {
        callback(getLocal(STORAGE_KEYS.PAYMENTS, {}));
      }
    },
    (err) => {
      console.warn("Firestore subscribePayments error:", err);
      callback(getLocal(STORAGE_KEYS.PAYMENTS, {}));
    }
  );
}

export async function getPayments(): Promise<{ [studentName: string]: { [feeId: string]: boolean } }> {
  try {
    const snap = await getDoc(doc(db, "payments", "all"));
    if (snap.exists()) {
      const data = snap.data() as { [studentName: string]: { [feeId: string]: boolean } };
      setLocal(STORAGE_KEYS.PAYMENTS, data);
      return data;
    }
  } catch (err) {
    console.warn("Firestore getPayments error:", err);
  }
  return getLocal(STORAGE_KEYS.PAYMENTS, {});
}

export async function togglePayment(studentName: string, feeId: string): Promise<boolean> {
  const payments = await getPayments();
  payments[studentName] = payments[studentName] || {};
  const newStatus = !payments[studentName][feeId];
  payments[studentName][feeId] = newStatus;
  setLocal(STORAGE_KEYS.PAYMENTS, payments);

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "payments", "all"), payments);
  return newStatus;
}

export async function getStudentFees(studentName: string): Promise<StudentFeeStatus[]> {
  const [fees, payments] = await Promise.all([getFees(), getPayments()]);
  const studentPayments = payments[studentName] || {};

  return fees
    .filter((f) => f.target === "*" || f.target === studentName)
    .map((f) => ({
      id: f.id,
      feeId: f.id,
      title: f.title,
      amount: f.amount,
      paid: !!studentPayments[f.id]
    }));
}

// 7. LEAVE REQUESTS (IZIN ONLINE)
export function subscribeLeaveRequests(callback: (requests: LeaveRequest[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, "leave_requests"),
    (snap) => {
      if (!snap.empty) {
        const list: LeaveRequest[] = [];
        snap.forEach((d) => list.push({ ...(d.data() as LeaveRequest), id: d.id }));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setLocal(STORAGE_KEYS.LEAVE, list);
        callback(list);
      } else {
        callback(getLocal<LeaveRequest[]>(STORAGE_KEYS.LEAVE, []));
      }
    },
    (err) => {
      console.warn("Firestore subscribeLeaveRequests error:", err);
      callback(getLocal<LeaveRequest[]>(STORAGE_KEYS.LEAVE, []));
    }
  );
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const snap = await getDocs(collection(db, "leave_requests"));
    if (!snap.empty) {
      const list: LeaveRequest[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as LeaveRequest), id: d.id }));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setLocal(STORAGE_KEYS.LEAVE, list);
      return list;
    }
  } catch (err) {
    console.warn("Firestore getLeaveRequests error:", err);
  }
  return getLocal<LeaveRequest[]>(STORAGE_KEYS.LEAVE, []);
}

export async function addLeaveRequest(req: LeaveRequest): Promise<void> {
  const list = [req, ...(await getLeaveRequests())];
  setLocal(STORAGE_KEYS.LEAVE, list);

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "leave_requests", req.id), req);
}

export async function updateLeaveRequestStatus(
  id: string,
  status: "approved" | "rejected",
  applyToAttendance?: boolean
): Promise<void> {
  const list = await getLeaveRequests();
  const target = list.find((r) => r.id === id);
  if (!target) return;

  target.status = status;
  setLocal(STORAGE_KEYS.LEAVE, list);

  // Direct real-time write to Firebase Firestore
  await setDoc(doc(db, "leave_requests", id), target);

  if (applyToAttendance && status === "approved") {
    const attendance = await getAttendance(target.date);
    attendance[target.studentName] = target.category === "Sakit" ? "S" : "I";
    await saveAttendance(target.date, attendance);
  }
}
