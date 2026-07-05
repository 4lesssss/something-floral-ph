export function formatPeso(amount) {
  return "₱" + Number(amount).toLocaleString("en-PH");
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

export function imageUrl(filename) {
  return `/${filename}`;
}

export const STATUS_LABELS = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};
