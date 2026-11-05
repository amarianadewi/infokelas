export type AttendanceStatus = "H" | "S" | "I" | "A";

export interface Student {
  id: string;
  name: string;
  nisn: string;
  pin: string;
  pinHash?: string;
  gender?: "L" | "P";
  parentName?: string;
  parentPhone?: string;
}

export interface AttendanceRecord {
  [studentName: string]: AttendanceStatus;
}

export interface SpecialDismissal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: "awal" | "lambat";
  reason: string;
}

export interface DismissalSettings {
  regular: { [dayOfWeek: number]: string }; // 1=Senin..6=Sabtu
  extracurricular: { [dayOfWeek: number]: string };
  specials: SpecialDismissal[];
}

export interface ClassActivity {
  id: string;
  date: string;
  title?: string;
  text: string;
  imageUrl?: string;
  createdAt?: string;
}

export type AnnouncementType = "PR" | "Jadwal" | "Libur" | "Info";

export interface Announcement {
  id: string;
  date: string;
  type: AnnouncementType;
  title: string;
  text: string;
  createdAt?: string;
}

export interface FeeItem {
  id: string;
  title: string;
  amount: number;
  target: string; // "*" or studentName
  createdAt?: string;
}

export interface StudentFeeStatus {
  id: string;
  feeId: string;
  title: string;
  amount: number;
  paid: boolean;
}

export interface LeaveRequest {
  id: string;
  studentName: string;
  date: string;
  category: "Sakit" | "Izin";
  note: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export interface ClassSettings {
  salt: string;
  adminHash: string;
  schoolName: string;
  className: string;
  academicYear: string;
}
