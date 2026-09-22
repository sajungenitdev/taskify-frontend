// components/tender/documents/DocsListView.tsx
"use client";

import { Eye, RotateCw, Trash2, FileText, ExternalLink } from "lucide-react";
import type { CompanyDocUI } from "@/lib/api/mappers";

/* ---------- Convert "/uploads/..." → "http://localhost:5000/uploads/..." ---------- */
function fullFileUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

interface Props {
  docs: CompanyDocUI[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onAction: (doc: CompanyDocUI) => void;
  onDelete: (doc: CompanyDocUI) => void;
  /** Which tab is active — controls which columns render */
  category?: "legal" | "profiles" | "experience" | "certificates";
}

const STATUS_STYLES: Record<string, string> = {
  Valid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Expiring Soon": "bg-amber-50 text-amber-700 border-amber-200",
  Expired: "bg-rose-50 text-rose-700 border-rose-200",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* Chips order for experience: [sector, duration, volume] */
function parseExperienceChips(chips?: string[]) {
  const arr = Array.isArray(chips) ? chips : [];
  return {
    sector: arr[0] || "—",
    duration: arr[1] || "—",
    volume: arr[2] || "—",
  };
}

export function DocsListView({
  docs,
  selectedIds,
  onToggleSelect,
  onAction,
  onDelete,
  category = "legal",
}: Props) {
  const isExperience = category === "experience";

  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <FileText className="mx-auto mb-3 h-6 w-6 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">
          No {isExperience ? "work experience" : "documents"} here yet.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Click{" "}
          <strong>+ Add {isExperience ? "Work Experience" : "Document"}</strong>{" "}
          to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
              <th className="w-10 px-3 py-2.5" />

              {isExperience ? (
                <>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Client / Project
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Sector
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Duration
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Volume
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Added
                  </th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Title
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Type
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Reference
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Valid Until
                  </th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </>
              )}

              <th className="w-28 px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {docs.map((d) => {
              const selected = selectedIds.has(d.id);
              const status = d.status || "Valid";
              const badge =
                STATUS_STYLES[status] ??
                "bg-slate-50 text-slate-700 border-slate-200";
              const fileHref = fullFileUrl(d.fileUrl);
              const exp = isExperience
                ? parseExperienceChips(d.chips)
                : { sector: "", duration: "", volume: "" };

              return (
                <tr
                  key={d.id}
                  className={`border-b border-slate-50 transition hover:bg-amber-50/30 ${selected ? "bg-amber-50/60" : ""
                    }`}
                >
                  <td className="px-3 py-2.5 align-middle">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(d.id)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
                    />
                  </td>

                  {isExperience ? (
                    <>
                      {/* Client / Project */}
                      <td className="px-3 py-2.5 align-middle">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-slate-800">
                            {d.title}
                          </p>
                          {d.subtitle && (
                            <p className="truncate text-[10px] text-slate-500">
                              {d.subtitle}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Sector chip */}
                      <td className="px-3 py-2.5 align-middle">
                        {exp.sector !== "—" ? (
                          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            {exp.sector}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Duration chip */}
                      <td className="px-3 py-2.5 align-middle">
                        {exp.duration !== "—" ? (
                          <span className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                            {exp.duration}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Volume chip */}
                      <td className="px-3 py-2.5 align-middle">
                        {exp.volume !== "—" ? (
                          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {exp.volume}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Added date */}
                      <td className="px-3 py-2.5 align-middle text-[11px] text-slate-600">
                        {fmtDate(d.createdAt)}
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Generic doc columns */}
                      <td className="px-3 py-2.5 align-middle">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-slate-800">
                            {d.title}
                          </p>
                          {d.subtitle && (
                            <p className="truncate text-[10px] text-slate-500">
                              {d.subtitle}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 align-middle text-[11px] text-slate-600">
                        {d.docType || "—"}
                      </td>

                      <td className="px-3 py-2.5 align-middle text-[11px] text-slate-600">
                        {d.reference || "—"}
                      </td>

                      <td className="px-3 py-2.5 align-middle text-[11px] text-slate-600">
                        {fmtDate(d.validUntil)}
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge}`}
                        >
                          {status}
                        </span>
                      </td>
                    </>
                  )}

                  <td className="px-3 py-2.5 text-right align-middle">
                    <div className="inline-flex items-center gap-1">
                      {fileHref && (
                        <a
                          href={fileHref}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Open file"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => onAction(d)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title={d.action === "Renew" ? "Renew" : "View"}
                      >
                        {d.action === "Renew" ? (
                          <RotateCw className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(d)}
                        className="rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}