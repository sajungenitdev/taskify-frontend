// components/tender/documents/DocCard.tsx
"use client";

import { FileText, Trophy, Trash2, RotateCw } from "lucide-react";
import { StatusPill } from "./StatusPill";
import type { CompanyDocUI } from "@/lib/api/mappers";

export type CompanyDoc = CompanyDocUI;

interface Props {
  doc: CompanyDocUI;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onAction?: (doc: CompanyDocUI) => void;
  onDelete?: (doc: CompanyDocUI) => void;
}

function fileSizeLabel(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocCard({
  doc,
  selected,
  onToggleSelect,
  onAction,
  onDelete,
}: Props) {
  const isExpiring = doc.status === "Expiring Soon";
  const isExpired = doc.status === "Expired";
  const isExperience = doc.category === "experience";

  /* ---------- Experience / Profile card variant ---------- */
  if (isExperience || (doc.chips && doc.chips.length > 0)) {
    return (
      <article
        className={`relative flex flex-col rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition ${
          selected
            ? "border-slate-900 ring-1 ring-slate-900/5"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc);
                }}
                className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect?.(doc.id)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="mt-3 min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {doc.title}
          </h3>
          {doc.subtitle && (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
              {doc.subtitle}
            </p>
          )}
        </div>

        {doc.chips && doc.chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {doc.chips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {doc.fileName && (
          <p className="mt-3 flex items-center gap-1.5 truncate border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">{doc.fileName}</span>
            {doc.fileSize ? (
              <span className="shrink-0">
                ({fileSizeLabel(doc.fileSize)})
              </span>
            ) : null}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(doc);
            }}
            className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline"
          >
            View Certificate →
          </button>
        </div>
      </article>
    );
  }

  /* ---------- Legal / certificate card variant ---------- */
  return (
    <article
      className={`relative flex flex-col rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition ${
        isExpired
          ? "border-rose-300 ring-1 ring-rose-100"
          : isExpiring
            ? "border-orange-300 ring-1 ring-orange-100"
            : selected
              ? "border-slate-900"
              : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc);
              }}
              className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(doc.id)}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
        </div>
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-slate-900">
          {doc.title}
        </h3>
        {doc.reference && (
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
            {doc.reference}
          </p>
        )}
        {doc.validity && (
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {doc.validity}
          </p>
        )}

        {doc.fileName && (
          <p className="mt-2 flex items-center gap-1.5 truncate text-[10px] text-slate-400">
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">{doc.fileName}</span>
            {doc.fileSize ? (
              <span className="shrink-0">
                ({fileSizeLabel(doc.fileSize)})
              </span>
            ) : null}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <StatusPill status={doc.status} />
        {doc.action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(doc);
            }}
            className={
              /* Renew + Expired → filled amber */
              doc.action === "Renew" && isExpired
                ? "inline-flex h-7 items-center gap-1 rounded-md bg-amber-600 px-3 text-[10px] font-semibold text-white shadow-sm hover:bg-amber-700"
                /* Renew + Expiring Soon → outlined amber */
                : doc.action === "Renew"
                  ? "inline-flex h-7 items-center gap-1 rounded-md border border-amber-300 bg-white px-3 text-[10px] font-semibold text-amber-700 hover:bg-amber-50"
                  /* Replace → filled dark-amber */
                  : doc.action === "Replace"
                    ? "inline-flex h-7 items-center gap-1 rounded-md bg-[#a97400] px-3 text-[10px] font-semibold text-white hover:bg-[#8f6100]"
                    /* View → plain text link */
                    : "text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline"
            }
          >
            {doc.action === "Renew" && <RotateCw className="h-3 w-3" />}
            {doc.action}
          </button>
        )}
      </div>
    </article>
  );
}