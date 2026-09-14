// src/lib/utils/format.ts
import type { Currency } from "@/types/crm/crm.types";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  BDT: "৳",
  SAR: "SAR ",
  USD: "$",
  AED: "AED ",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

export function formatMoney(
  amount: number | undefined | null,
  currency: Currency = "BDT"
): string {
  if (amount == null) return "—";
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  const num = new Intl.NumberFormat("en-US").format(amount);
  return `${sym}${num}`;
}

export function formatCompact(amount: number, currency: Currency = "USD") {
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  if (Math.abs(amount) >= 1_000_000)
    return `${sym}${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${sym}${(amount / 1_000).toFixed(0)}k`;
  return `${sym}${amount}`;
}

export function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(d?: string | null) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getOwnerName(owner: unknown): string {
  if (!owner) return "—";
  if (typeof owner === "string") return owner;
  return (owner as { fullName?: string }).fullName ?? "—";
}

export function getOwnerId(owner: unknown): string {
  if (!owner) return "";
  if (typeof owner === "string") return owner;
  return (owner as { _id?: string })._id ?? "";
}