export const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const STATUS_LABELS: Record<string, string> = {
  H: "Hadir ✅",
  S: "Sakit 🤒",
  I: "Izin 📝",
  A: "Alpa ❌",
  N: "Belum diabsen"
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const dayName = DAY_NAMES[d.getDay()] || "";
    return `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function formatShortDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const dayName = DAY_NAMES[d.getDay()] || "";
    return `${dayName}, ${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return dateStr;
  }
}

export function formatRupiah(value: number): string {
  return "Rp " + (value || 0).toLocaleString("id-ID");
}

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

