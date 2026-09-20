// components/admin/tender-settings/TenderSettingsTab.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Play, Save } from "lucide-react";
import { NotificationRecipients, type SelectableUser } from "./NotificationRecipients";

/* ============================================================
 * Types
 * ============================================================ */
export interface TenderSettings {
  sectors: string[];
  customSectors: string[];
  productLines: string[];
  customProductLines: string[];
  valueMin: number | null;
  valueMax: number | null;
  securityMin: number | null;
  securityMax: number | null;
  performanceMin: number | null;
  performanceMax: number | null;
  tenderTypes: string[];
  customTenderTypes: string[];
  crawlTime: string; // "HH:mm"
  notificationRecipientIds: string[];
}

/* ============================================================
 * Defaults — match your existing UI
 * ============================================================ */
const SECTORS = ["Government", "Power & Energy", "Telecom", "Oil & Gas", "Financial", "Education", "Healthcare"];
const PRODUCT_LINES = [
  "Computer & Electronics", "IoT Sensors", "Networking Equipment",
  "Backup & Storage Solutions", "Laboratory Equipment", "Office Equipment",
  "Construction Materials", "Industrial Sensors", "Safety & Security Systems",
  "Software Licensing", "Power & Energy Equipment", "Medical Equipment",
  "Telecommunication Equipment", "Vehicles & Transport",
];
const TENDER_TYPES = ["eGP", "RFQ", "Direct"];

const DEFAULTS: TenderSettings = {
  sectors: ["Government", "Power & Energy", "Financial"],
  customSectors: [],
  productLines: ["Computer & Electronics", "IoT Sensors", "Industrial Sensors", "Software Licensing"],
  customProductLines: [],
  valueMin: 500000,
  valueMax: null,
  securityMin: 10000,
  securityMax: 5000000,
  performanceMin: null,
  performanceMax: 20000000,
  tenderTypes: ["eGP", "RFQ"],
  customTenderTypes: [],
  crawlTime: "06:00",
  notificationRecipientIds: [],
};

/* ============================================================
 * Props
 * ============================================================ */
interface Props {
  /** Current settings from API (or null → use defaults) */
  initial?: Partial<TenderSettings> | null;
  /** All users available to pick as recipients */
  users: SelectableUser[];
  /** Called when user clicks Save Criteria */
  onSave: (settings: TenderSettings) => Promise<void> | void;
  /** Called when user clicks Run Crawl Now */
  onRunCrawl?: () => Promise<void> | void;
  /** Last crawl info */
  lastCrawl?: {
    at: string;
    sitesChecked: number;
    newFound: number;
    matched: number;
  } | null;
}

/* ============================================================
 * Helpers
 * ============================================================ */
function formatBDT(n: number | null) {
  if (n == null) return "";
  return n.toLocaleString("en-IN");
}
function parseBDT(v: string): number | null {
  const cleaned = v.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  return Number(cleaned);
}

/* ============================================================
 * Small building blocks
 * ============================================================ */
function CheckGrid({
  options,
  value,
  onChange,
  onAddCustom,
  disabled,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  onAddCustom?: () => void;
  disabled?: boolean;
}) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
  };
  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`inline-flex cursor-pointer items-center gap-2 text-[13px] ${disabled ? "opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={() => toggle(opt)}
              disabled={disabled}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#a97400] focus:ring-[#a97400]"
            />
            <span className="text-slate-700">{opt}</span>
          </label>
        ))}
      </div>
      {onAddCustom && (
        <button
          type="button"
          onClick={onAddCustom}
          disabled={disabled}
          className="mt-3 text-[12px] font-semibold text-[#a97400] hover:underline disabled:opacity-50"
        >
          + Add Custom
        </button>
      )}
    </>
  );
}

function RangeBox({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  disabled,
}: {
  label: string;
  minValue: number | null;
  maxValue: number | null;
  onMinChange: (v: number | null) => void;
  onMaxChange: (v: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Min (৳)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatBDT(minValue)}
            placeholder="No limit"
            disabled={disabled}
            onChange={(e) => onMinChange(parseBDT(e.target.value))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-mono text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Max (৳)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatBDT(maxValue)}
            placeholder="No limit"
            disabled={disabled}
            onChange={(e) => onMaxChange(parseBDT(e.target.value))}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-mono text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Main component
 * ============================================================ */
export function TenderSettingsTab({
  initial,
  users,
  onSave,
  onRunCrawl,
  lastCrawl,
}: Props) {
  const [settings, setSettings] = useState<TenderSettings>({
    ...DEFAULTS,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [crawling, setCrawling] = useState(false);

  /* Sync from props */
  useEffect(() => {
    setSettings({ ...DEFAULTS, ...initial });
  }, [initial]);

  const patch = <K extends keyof TenderSettings>(
    key: K,
    value: TenderSettings[K],
  ) => setSettings((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(settings);
      toast.success("Tender settings saved");
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCrawl = async () => {
    if (!onRunCrawl || crawling) return;
    setCrawling(true);
    try {
      await onRunCrawl();
      toast.success("Crawl started");
    } catch (e) {
      toast.error((e as Error).message || "Crawl failed");
    } finally {
      setCrawling(false);
    }
  };

  const allSectors = [...SECTORS, ...settings.customSectors];
  const allProductLines = [...PRODUCT_LINES, ...settings.customProductLines];
  const allTenderTypes = [...TENDER_TYPES, ...settings.customTenderTypes];

  const addCustomSector = () => {
    const v = window.prompt("New sector name:");
    if (!v?.trim()) return;
    const name = v.trim();
    if (allSectors.includes(name)) return;
    patch("customSectors", [...settings.customSectors, name]);
    patch("sectors", [...settings.sectors, name]);
  };
  const addCustomProduct = () => {
    const v = window.prompt("New product line:");
    if (!v?.trim()) return;
    const name = v.trim();
    if (allProductLines.includes(name)) return;
    patch("customProductLines", [...settings.customProductLines, name]);
    patch("productLines", [...settings.productLines, name]);
  };
  const addCustomTenderType = () => {
    const v = window.prompt("New tender type:");
    if (!v?.trim()) return;
    const name = v.trim();
    if (allTenderTypes.includes(name)) return;
    patch("customTenderTypes", [...settings.customTenderTypes, name]);
    patch("tenderTypes", [...settings.tenderTypes, name]);
  };

  return (
    <div className="space-y-5">
      {/* Intro */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Automated Daily Tender Search
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
          Every morning, the system checks all sites listed in Tender Management
          › Site Directory for newly published tenders, and automatically adds
          anything matching the criteria below to your Potential list — flagged{" "}
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f4ead6] px-2 py-0.5 text-[11px] font-semibold text-[#8a6a2b]">
            🚩 Auto-discovered
          </span>{" "}
          so you know it wasn't entered manually.
        </p>
      </section>

      {/* Sectors + Product Lines */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Sectors to Match
          </h3>
          <CheckGrid
            options={allSectors}
            value={settings.sectors}
            onChange={(v) => patch("sectors", v)}
            onAddCustom={addCustomSector}
            disabled={saving}
          />
        </section>

        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Product Lines to Match
          </h3>
          <CheckGrid
            options={allProductLines}
            value={settings.productLines}
            onChange={(v) => patch("productLines", v)}
            onAddCustom={addCustomProduct}
            disabled={saving}
          />
        </section>
      </div>

      {/* Ranges */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <RangeBox
          label="Tender Value Range"
          minValue={settings.valueMin}
          maxValue={settings.valueMax}
          onMinChange={(v) => patch("valueMin", v)}
          onMaxChange={(v) => patch("valueMax", v)}
          disabled={saving}
        />
        <RangeBox
          label="Tender Security Range"
          minValue={settings.securityMin}
          maxValue={settings.securityMax}
          onMinChange={(v) => patch("securityMin", v)}
          onMaxChange={(v) => patch("securityMax", v)}
          disabled={saving}
        />
        <RangeBox
          label="Performance Security Range"
          minValue={settings.performanceMin}
          maxValue={settings.performanceMax}
          onMinChange={(v) => patch("performanceMin", v)}
          onMaxChange={(v) => patch("performanceMax", v)}
          disabled={saving}
        />
      </div>

      <button
        type="button"
        onClick={() => window.alert("Custom range criteria — coming soon")}
        disabled={saving}
        className="text-[12px] font-semibold text-[#a97400] hover:underline disabled:opacity-50"
      >
        + Add Custom Range Criteria
      </button>

      {/* ⭐ NEW: Notification Recipients */}
      <NotificationRecipients
        users={users}
        selectedIds={settings.notificationRecipientIds}
        onChange={(ids) => patch("notificationRecipientIds", ids)}
        disabled={saving}
      />

      {/* Tender Type */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Tender Type
        </h3>
        <CheckGrid
          options={allTenderTypes}
          value={settings.tenderTypes}
          onChange={(v) => patch("tenderTypes", v)}
          onAddCustom={addCustomTenderType}
          disabled={saving}
        />
      </section>

      {/* Crawl Schedule */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Crawl Schedule
            </h3>
            <p className="mt-1 text-[12px] text-slate-500">
              Site list is managed in Tender Management › Site Directory — every
              site listed there is checked automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-slate-500">Run daily at</span>
            <input
              type="time"
              value={settings.crawlTime}
              onChange={(e) => patch("crawlTime", e.target.value)}
              disabled={saving}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-mono text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save Criteria"}
            </button>
          </div>
        </div>
      </section>

      {/* Last Automated Crawl */}
      <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Last Automated Crawl
            </h3>
            <p className="mt-1 text-[12px] text-slate-500">
              {lastCrawl
                ? `${lastCrawl.at} · ${lastCrawl.sitesChecked} sites checked · ${lastCrawl.newFound} new tenders found · ${lastCrawl.matched} matched your criteria`
                : "No crawl has been run yet."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCrawl}
            disabled={crawling}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {crawling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {crawling ? "Running…" : "Run Crawl Now"}
          </button>
        </div>
      </section>
    </div>
  );
}