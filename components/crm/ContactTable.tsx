// components/crm/ContactTable.tsx
"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Eye, Mail, Phone, Trash2, Pencil, Building2, UserX } from "lucide-react";
import { TagBadge } from "./TagBadge";
import { getOwnerName, initials } from "@/utils/format";
import type { Contact } from "@/types/crm/crm.types";

interface Props {
  contacts: Contact[];
  loading?: boolean;
  onDelete?: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;   // ← NEW
}

export const ContactTable = memo(function ContactTable({
  contacts,
  loading = false,
  onDelete,
  onEdit,                                  // ← NEW
}: Props) {
  if (loading) {
    return <ContactTableSkeleton />;
  }

  if (!contacts.length) {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
          <UserX className="h-6 w-6" />
        </div>
        <h3 className="mt-3.5 text-sm font-bold text-slate-900">No Contacts Located</h3>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          No records match your active query. Adjust your filters or register a new contact.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left text-xs">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <th scope="col" className="px-5 py-3.5">
              Contact
            </th>
            <th scope="col" className="px-5 py-3.5">
              Company
            </th>
            <th scope="col" className="px-5 py-3.5">
              Account Owner
            </th>
            <th scope="col" className="px-5 py-3.5">
              Tag
            </th>
            <th scope="col" className="px-5 py-3.5">
              Acquisition Source
            </th>
            <th scope="col" className="px-5 py-3.5">
              Linked Opportunity
            </th>
            <th scope="col" className="w-[110px] px-5 py-3.5 text-right">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Rows */}
        <tbody className="divide-y divide-slate-100 bg-white">
          {contacts.map((contact) => {
            const linked =
              contact.leadId && typeof contact.leadId === "object" ? contact.leadId : null;

            return (
              <tr
                key={contact._id}
                className="group transition-colors duration-150 hover:bg-slate-50/70"
              >
                {/* Contact Identity Cell */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-white shadow-2xs">
                      {initials(contact.name)}
                    </div>
                    <div className="min-w-0 max-w-[220px]">
                      <Link
                        href={`/crm/contacts/${contact._id}`}
                        className="truncate text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline"
                      >
                        {contact.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        {contact.email && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[150px]">
                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{contact.email}</span>
                          </span>
                        )}
                        {contact.phone && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                            <span>{contact.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td className="px-5 py-3.5">
                  {contact.company ? (
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{contact.company}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Account Owner */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="font-semibold text-slate-800">
                    {getOwnerName(contact.owner)}
                  </span>
                </td>

                {/* Tag Status */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <TagBadge tag={contact.tag} />
                </td>

                {/* Acquisition Source */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                    {contact.source.replace(/_/g, " ")}
                  </span>
                </td>

                {/* Linked Opportunity / Lead */}
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {linked ? (
                    <Link
                      href={`/crm/deals/${linked._id}`}
                      className="inline-flex items-center gap-1 font-semibold capitalize text-slate-900 hover:text-indigo-600 hover:underline"
                    >
                      <span>{linked.stage.replace(/_/g, " ")}</span>
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Contextual Actions */}
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/crm/contacts/${contact._id}`}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden"
                      title="Inspect Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    {/* Edit — now opens the modal via onEdit */}
                    <button
                      type="button"
                      onClick={() => onEdit?.(contact)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden cursor-pointer"
                      title="Edit Contact"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete?.(contact)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-hidden cursor-pointer"
                      title="Archive Contact"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

function ContactTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-3.5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100" />
            <div className="space-y-1.5">
              <div className="h-3 w-32 rounded-md bg-slate-100" />
              <div className="h-2.5 w-44 rounded-md bg-slate-50" />
            </div>
          </div>
          <div className="h-3 w-24 rounded-md bg-slate-100" />
          <div className="h-5 w-16 rounded-md bg-slate-100" />
          <div className="h-3 w-20 rounded-md bg-slate-100" />
          <div className="flex gap-1">
            <div className="h-7 w-7 rounded-lg bg-slate-100" />
            <div className="h-7 w-7 rounded-lg bg-slate-100" />
            <div className="h-7 w-7 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}