"use client";

export function SecurityFooter() {
  return (
    <footer className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center">
      <p className="text-[11px] text-slate-500">
        Exportable to Finance and Sales on a schedule — weekly by default.
      </p>

      <button
        type="button"
        onClick={() => {
          // TODO: trigger CSV export
        }}
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
      >
        Export to Excel
      </button>
    </footer>
  );
}