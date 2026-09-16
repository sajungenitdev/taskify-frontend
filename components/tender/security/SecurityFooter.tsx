// components/tender/security/SecurityFooter.tsx
"use client";

import toast from "react-hot-toast";
import type { SecurityRow } from "./SecurityTable";

interface Props {
  rows?: SecurityRow[];
}

export function SecurityFooter({ rows = [] }: Props) {
  const handleExport = () => {
    if (rows.length === 0) {
      toast.error("Nothing to export");
      return;
    }

    /* Header row */
    const header = [
      "Entity",
      "Client / Description",
      "Type",
      "Amount",
      "Currency",
      "Due Date",
      "Docs Status",
    ];

    /* Data rows — strip the currency symbol so Excel treats it as a number */
    const body = rows
      .filter((r) => !r.isDraft) // don't export the draft row
      .map((r) => [
        r.entity,
        r.clientDescription,
        r.type,
        r.amount,
        "BDT",
        r.dueDate || "",
        r.docsStatus,
      ]);

    if (body.length === 0) {
      toast.error("Nothing to export");
      return;
    }

    /* Build CSV */
    const csv = [header, ...body]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\r\n");

    /* BOM so Excel reads UTF-8 correctly (৳, é, etc.) */
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date()
      .toISOString()
      .slice(0, 10);
    a.href = url;
    a.download = `tender-security-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${body.length} row${body.length > 1 ? "s" : ""}`);
  };

  return (
    <footer className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center">
      <p className="text-[11px] text-slate-500">
        Exportable to Finance and Sales on a schedule — weekly by default.
      </p>

      <button
        type="button"
        onClick={handleExport}
        disabled={rows.length === 0}
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export to Excel
      </button>
    </footer>
  );
}