"use client";

export type DocStatus = "Valid" | "Expiring Soon" | "Expired";

const STYLES: Record<DocStatus, string> = {
  Valid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Expiring Soon": "bg-orange-50 text-orange-700 border-orange-200",
  Expired: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StatusPill({ status }: { status: DocStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}