"use client";

import Link from "next/link";
import {
  Layers,
  Send,
  ShieldCheck,
  FileText,
  ChevronRight,
} from "lucide-react";

interface Action {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  accent: string;
}

const ACTIONS: Action[] = [
  {
    href: "/tenders/manage",
    icon: Layers,
    title: "Manage Tenders",
    desc: "Track active participation & docs",
    accent: "from-indigo-500 to-purple-500",
  },
  {
    href: "/tenders/submissions",
    icon: Send,
    title: "Submissions",
    desc: "Bid summaries & competitor data",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    href: "/tenders/security",
    icon: ShieldCheck,
    title: "Tender Security",
    desc: "BG, PO & bank guarantees",
    accent: "from-amber-500 to-orange-500",
  },
  {
    href: "/tenders/documents",
    icon: FileText,
    title: "Documents",
    desc: "Company profile & templates",
    accent: "from-sky-500 to-cyan-500",
  },
];

export function TenderOverviewQuickActions() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-slate-900">Quick Access</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br ${a.accent} opacity-10 transition group-hover:opacity-20`}
              />
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${a.accent} text-white shadow-sm`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-900">
                {a.title}
                <ChevronRight className="h-3 w-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{a.desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}