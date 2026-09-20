// components/admin/tender-settings/NotificationRecipients.tsx
"use client";

import { useMemo, useState } from "react";
import { X, Plus, Search, Mail, UserCheck } from "lucide-react";

export interface SelectableUser {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  department?: string;
}

interface Props {
  /** All users that can be picked */
  users: SelectableUser[];
  /** Currently selected user IDs */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Optional: disable during save */
  disabled?: boolean;
}

export function NotificationRecipients({
  users,
  selectedIds,
  onChange,
  disabled,
}: Props) {
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = useMemo(
    () => users.filter((u) => selectedIds.includes(u._id)),
    [users, selectedIds],
  );

  const available = useMemo(
    () => users.filter((u) => !selectedIds.includes(u._id)),
    [users, selectedIds],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [available, search]);

  const add = (id: string) => {
    onChange([...selectedIds, id]);
    setSearch("");
    setPickerOpen(false);
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tender Notification Recipients
          </h3>
          <p className="mt-1 text-[12px] text-slate-500">
            These users receive an email when the daily tender crawl finds new
            tenders matching your criteria below.
          </p>
        </div>
      </header>

      {/* Selected recipients */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
        {selected.length === 0 ? (
          <p className="py-2 text-center text-[12px] text-slate-400">
            No recipients selected yet. Add someone below.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((u) => (
              <li
                key={u._id}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-[#f4ead6] py-1 pl-1 pr-2.5 text-[12px] font-medium text-[#8a6a2b]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8a6a2b] text-[10px] font-bold text-white">
                  {u.fullName.charAt(0).toUpperCase()}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">{u.fullName}</span>
                  <span className="text-[10px] text-[#8a6a2b]/80">
                    {u.email}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(u._id)}
                  disabled={disabled}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[#8a6a2b]/70 transition hover:bg-[#8a6a2b]/10 hover:text-[#8a6a2b] disabled:opacity-50"
                  aria-label={`Remove ${u.fullName}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add recipient */}
      {!pickerOpen ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={disabled || available.length === 0}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add recipient
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              disabled={disabled}
              className="h-7 w-full border-none bg-transparent text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPickerOpen(false);
              }}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-[220px] overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-slate-400">
                {available.length === 0
                  ? "All users are already recipients."
                  : "No users match your search."}
              </p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => add(u._id)}
                  disabled={disabled}
                  className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                    {u.fullName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-slate-800">
                      {u.fullName}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {u.email}
                      {u.role ? ` · ${u.role}` : ""}
                    </span>
                  </span>
                  <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Info hint */}
      {selected.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
          <p className="text-[11px] leading-relaxed text-sky-800">
            {selected.length} recipient{selected.length === 1 ? "" : "s"} will
            be notified by email whenever a new tender matches the criteria
            below.
          </p>
        </div>
      )}

      {selected.length === 0 && available.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2">
          <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            No recipients yet — no one will be emailed when a matching tender is
            auto-discovered.
          </p>
        </div>
      )}
    </section>
  );
}