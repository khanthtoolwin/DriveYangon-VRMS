export function formatMMK(amount: number): string {
  return `${amount.toLocaleString("en-US")} MMK`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning-bg text-warning border-transparent",
  approved: "bg-success-bg text-success border-transparent",
  rejected: "bg-destructive/10 text-destructive border-transparent",
  cancelled: "bg-muted text-muted-foreground border-transparent",
  completed: "bg-accent text-accent-foreground border-transparent",
};

export const VEHICLE_STATUS_STYLES: Record<string, string> = {
  available: "bg-success-bg text-success border-transparent",
  maintenance: "bg-warning-bg text-warning border-transparent",
  retired: "bg-muted text-muted-foreground border-transparent",
};

// Resolves a stored image path (e.g. "/vehicles/foo.png") into a URL that works
// both in local dev (served from "/") and in the deployed sandbox preview,
// which serves the app from a non-root sub-path. Vite's `import.meta.env.BASE_URL`
// reflects the actual base the app was served from, so we strip the leading
// slash from the stored path and join it onto that base instead of assuming root.
export function resolveImageUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL || "/";
  const relative = path.replace(/^\/+/, "");
  return `${base}${base.endsWith("/") ? "" : "/"}${relative}`;
}
