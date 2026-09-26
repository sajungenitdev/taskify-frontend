"use client";

import { Bell, ShieldAlert, Receipt } from "lucide-react";
import type { ActionItem } from "@/hooks/tender/useTenderOverview";

interface Props {
  items: ActionItem[];
}

export function TenderActionBanner({ items }: Props) {
  const getIcon = (icon: ActionItem["icon"]) => {
    const cls = "h-4 w-4";
    switch (icon) {
      case "bell":
        return <Bell className={`${cls} text-orange-400`} />;
      case "shield":
        return <ShieldAlert className={`${cls} text-rose-400`} />;
      case "receipt":
        return <Receipt className={`${cls} text-amber-400`} />;
      default:
        return <Bell className={`${cls} text-orange-400`} />;
    }
  };

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="flex flex-col items-start justify-between gap-4 rounded-xl bg-[#0a1f2e] px-6 py-5 text-white sm:flex-row sm:items-center">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#b8860b]">
          Today · {today}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">
          {items.length} {items.length === 1 ? "thing" : "things"} need action today
        </h2>
      </div>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm"
          >
            {getIcon(item.icon)}
            <span className="text-xs font-medium text-white/90">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}