// components/tender/site-directory/SiteDirectory.tsx
"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import toast from "react-hot-toast";
import {
    Search,
    X,
    Loader2,
    Plus,
    Trash2,
    Pencil,
    Play,
    Save,
    Eye,
    CheckCircle2,
    AlertCircle,
    Power,
    Globe,
    ExternalLink,
    Wand2,
} from "lucide-react";
import { useTenderStats } from "@/hooks/tender/useTenders";

/* ============================================================
   TYPES
   ============================================================ */
type RenderMode = "auto" | "cheerio" | "puppeteer";

interface SiteSource {
    _id: string;
    name: string;
    url: string;
    domain?: string;
    listSelector: string;
    titleSelector: string;
    linkSelector: string;
    dateSelector: string;
    linkAttr: string;
    absoluteLinks?: boolean;
    active: boolean;
    renderMode: RenderMode;
    sector?: string;
    portalUrl?: string;
    popular?: boolean;
    popularShort?: string;
    popularColor?: string;
    popularSubtitle?: string;
    siteInfoSector?: string;
    siteInfoPortalType?: string;
    siteInfoContact?: string;
    lastCrawledAt?: string | null;
    lastCrawlStatus?: "idle" | "success" | "error" | "";
    lastCrawlError?: string;
    lastItemCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface DraftSite {
    _id?: string;
    name: string;
    url: string;
    listSelector: string;
    titleSelector: string;
    linkSelector: string;
    dateSelector: string;
    linkAttr: string;
    active: boolean;
    renderMode: RenderMode;
    sector: string;
    portalUrl: string;
    popular: boolean;
    popularShort: string;
    popularColor: string;
    popularSubtitle: string;
    siteInfoSector: string;
    siteInfoPortalType: string;
    siteInfoContact: string;
}

interface PreviewResult {
    ok: boolean;
    source: string;
    count: number;
    tenders: {
        title: string;
        tenderLink: string;
        publishedAtText: string;
        sourceSite: string;
    }[];
    error?: string;
    effectiveMode?: "cheerio" | "puppeteer";
    fellBack?: boolean;
    detectedSelectors?: {
        listSelector?: string;
        titleSelector?: string;
        linkSelector?: string;
        dateSelector?: string;
    } | null;
}

interface RelatedRow {
    tender: string;
    stage: string;
    value: string;
    status: string;
}

/* ============================================================
   CONSTANTS
   ============================================================ */
const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

const SECTORS: { id: string; label: string }[] = [
    { id: "banks", label: "Banks" },
    { id: "power", label: "Power & Energy" },
    { id: "oilgas", label: "Oil & Gas" },
    { id: "govt", label: "Government" },
];

/* Portal type choices for the dropdown */
const PORTAL_TYPES: string[] = [
    "eGP",
    "eTender",
    "eProcurement",
    "OTM",
    "Manual / Hardcopy",
    "Bank Portal",
    "Corporation Portal",
];

/* ============================================================
 * Sector → default Info-Modal values
 * Used to auto-fill the display fields when a sector is picked.
 * NOTE: Portal Type is intentionally NOT auto-filled — user chooses.
 * ============================================================ */
const SECTOR_PRESETS: Record<
    string,
    {
        displaySector: string;
        contact: string;
    }
> = {
    banks: {
        displaySector: "Central Bank · Financial",
        contact: "Procurement Cell",
    },
    power: {
        displaySector: "Power & Energy · Utility",
        contact: "Procurement Division",
    },
    oilgas: {
        displaySector: "Oil & Gas · Energy",
        contact: "Contracts & Procurement",
    },
    govt: {
        displaySector: "Government · Public Sector",
        contact: "Public Procurement Cell",
    },
};

/* Helper — preset for a sector (falls back to banks preset) */
function presetFor(sector: string) {
    return SECTOR_PRESETS[sector] ?? SECTOR_PRESETS.banks;
}

/* Helper — display label for a sector id */
function labelFor(sector: string) {
    return SECTORS.find((s) => s.id === sector)?.label ?? sector;
}

const EMPTY_DRAFT: DraftSite = {
    name: "",
    url: "",
    listSelector: "",
    titleSelector: "",
    linkSelector: "",
    dateSelector: "",
    linkAttr: "href",
    active: true,
    renderMode: "auto",
    sector: "banks",
    portalUrl: "",
    popular: false,
    popularShort: "",
    popularColor: "#1F3864",
    popularSubtitle: "",
    siteInfoSector: SECTOR_PRESETS.banks.displaySector,
    siteInfoPortalType: "",     // ✅ user picks
    siteInfoContact: SECTOR_PRESETS.banks.contact,
};

/* ============================================================
   CACHE
   ============================================================ */
let SITES_CACHE: { data: SiteSource[]; ts: number } | null = null;
let IN_FLIGHT: Promise<SiteSource[]> | null = null;
const STALE_MS = 30_000;

function authHeaders(): HeadersInit {
    if (typeof window === "undefined")
        return { "Content-Type": "application/json" };
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function fetchSites(force = false): Promise<SiteSource[]> {
    if (!force && SITES_CACHE && Date.now() - SITES_CACHE.ts < STALE_MS) {
        return SITES_CACHE.data;
    }
    if (!force && IN_FLIGHT) return IN_FLIGHT;

    IN_FLIGHT = (async () => {
        const r = await fetch(`${API_BASE}/tenders/sites`, {
            headers: authHeaders(),
        });
        const json = await r.json();
        if (!json.success) throw new Error(json.message || "Failed to load");
        const rows: SiteSource[] = json.data ?? [];
        SITES_CACHE = { data: rows, ts: Date.now() };
        IN_FLIGHT = null;
        return rows;
    })();

    return IN_FLIGHT;
}

function invalidateSitesCache() {
    SITES_CACHE = null;
    IN_FLIGHT = null;
}

/* ============================================================
   STAGE PILL
   ============================================================ */
function StagePill({ stage }: { stage: string }) {
    const s = stage.toLowerCase();
    const cls =
        s === "submitted"
            ? "bg-[#1e3a5f] text-white"
            : s === "active"
                ? "bg-[#f5ecd8] text-[#a97400]"
                : "bg-[#fff3d6] text-[#8a5a00]";
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.04em] ${cls}`}
        >
            {stage}
        </span>
    );
}

/* ============================================================
   RELATED PANEL
   ============================================================ */
function RelatedPanel({
    title,
    rows,
    emptyMessage,
}: {
    title: string;
    rows: RelatedRow[];
    emptyMessage?: string;
}) {
    return (
        <div
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: "#e2e8f0", marginTop: 16 }}
        >
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-900">
                {title}
            </div>

            {rows.length === 0 ? (
                <div className="text-[12.5px] text-slate-500">
                    {emptyMessage ??
                        "No Active or Potential tenders currently tracked."}
                </div>
            ) : (
                <div
                    className="overflow-hidden rounded-md border"
                    style={{ borderColor: "#e2e8f0" }}
                >
                    <table className="w-full border-collapse text-left text-[12.5px]">
                        <thead>
                            <tr style={{ background: "#fbfaf6" }}>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                    Tender
                                </th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                    Stage
                                </th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                    Value
                                </th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr
                                    key={i}
                                    style={{ borderTop: "1px solid #f1f5f9" }}
                                >
                                    <td className="px-4 py-3 text-slate-800">
                                        {r.tender}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StagePill stage={r.stage} />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[12px] text-slate-700">
                                        {r.value}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {r.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   SITE MODAL (Add / Edit)
   ============================================================ */
function SiteModal({
    draft,
    setDraft,
    onClose,
    onSave,
    onPreview,
    preview,
    previewing,
    saving,
}: {
    draft: DraftSite;
    setDraft: (d: DraftSite) => void;
    onClose: () => void;
    onSave: () => void;
    onPreview: () => void;
    preview: PreviewResult | null;
    previewing: boolean;
    saving: boolean;
}) {
    const patch = (p: Partial<DraftSite>) => setDraft({ ...draft, ...p });

    /* ✅ Click-outside + Esc to close */
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onClose();
        };
        const onMouseDown = (e: MouseEvent) => {
            if (saving) return;
            const el = dialogRef.current;
            if (!el) return;
            if (!el.contains(e.target as Node)) onClose();
        };

        window.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onMouseDown);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onMouseDown);
        };
    }, [onClose, saving]);

    /* ✅ Changing the sector auto-fills display + contact only.
       Portal type is left untouched — user picks it. */
    const onSectorChange = (sector: string) => {
        const preset = presetFor(sector);
        setDraft({
            ...draft,
            sector,
            siteInfoSector: preset.displaySector,
            siteInfoContact: preset.contact,
        });
    };

    const inputCls =
        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50";
    const labelCls =
        "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

    /* Portal type dropdown logic */
    const portalValue = draft.siteInfoPortalType;
    const isPresetValue = PORTAL_TYPES.includes(portalValue);
    const isCustomValue =
        portalValue !== "" && !isPresetValue;
    const showCustomInput = isCustomValue;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[5vh] backdrop-blur-sm">
            <div
                ref={dialogRef}
                className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            {draft._id ? "Edit Site" : "Add Site"}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Just paste the site URL. The crawler detects the
                            structure, picks the right engine, and extracts
                            tenders automatically. Preview before saving.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
                    {/* Row 1: name */}
                    <div>
                        <label className={labelCls}>Site Name *</label>
                        <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => patch({ name: e.target.value })}
                            placeholder="e.g. BPDB"
                            disabled={saving}
                            className={inputCls}
                            autoFocus
                        />
                    </div>

                    {/* Row 2: sector + portal override */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>Sector</label>
                            <select
                                value={draft.sector}
                                onChange={(e) =>
                                    onSectorChange(e.target.value)
                                }
                                disabled={saving}
                                className={inputCls}
                            >
                                {SECTORS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>
                                Portal URL (override)
                            </label>
                            <input
                                type="url"
                                value={draft.portalUrl}
                                onChange={(e) =>
                                    patch({ portalUrl: e.target.value })
                                }
                                placeholder="defaults to listing URL"
                                disabled={saving}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Row 3: URL */}
                    <div>
                        <label className={labelCls}>Tender Listing URL *</label>
                        <input
                            type="url"
                            value={draft.url}
                            onChange={(e) => patch({ url: e.target.value })}
                            placeholder="https://example.gov.bd/tenders"
                            disabled={saving}
                            className={inputCls}
                        />
                    </div>

                    {/* ============ Fully automatic info card ============ */}
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                        <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold leading-tight text-emerald-800">
                                Fully automatic
                            </p>
                            <p className="mt-0.5 text-[10.5px] leading-relaxed text-emerald-700">
                                The crawler auto-detects the page structure,
                                picks the right engine (static or browser),
                                and extracts tenders. No CSS selectors needed.
                            </p>
                        </div>
                    </div>

                    {/* ============ Popular Tenderer ============ */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Popular Tenderer (sidebar)
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    patch({ popular: !draft.popular })
                                }
                                disabled={saving}
                                className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold transition ${draft.popular
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-500"
                                    }`}
                            >
                                {draft.popular ? "Yes" : "No"}
                            </button>
                        </div>

                        {draft.popular && (
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <label className={labelCls}>
                                        Short code
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={3}
                                        value={draft.popularShort}
                                        onChange={(e) =>
                                            patch({
                                                popularShort:
                                                    e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="UN"
                                        disabled={saving}
                                        className={`${inputCls} font-mono uppercase`}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>
                                        Logo color
                                    </label>
                                    <input
                                        type="text"
                                        value={draft.popularColor}
                                        onChange={(e) =>
                                            patch({
                                                popularColor:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="#1F3864"
                                        disabled={saving}
                                        className={`${inputCls} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>
                                        Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        value={draft.popularSubtitle}
                                        onChange={(e) =>
                                            patch({
                                                popularSubtitle:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="2 tenders currently open"
                                        disabled={saving}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ============ Site Info modal content ============ */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Info Modal Content
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    const p = presetFor(draft.sector);
                                    patch({
                                        siteInfoSector: p.displaySector,
                                        siteInfoContact: p.contact,
                                    });
                                }}
                                disabled={saving}
                                className="inline-flex h-6 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Reset to {labelFor(draft.sector)}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {/* Sector (display) */}
                            <div>
                                <label className={labelCls}>
                                    Sector (display)
                                </label>
                                <input
                                    type="text"
                                    value={draft.siteInfoSector}
                                    onChange={(e) =>
                                        patch({
                                            siteInfoSector:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Central Bank · Financial"
                                    disabled={saving}
                                    className={inputCls}
                                />
                            </div>

                            {/* Tender Portal Type — dropdown + optional custom input */}
                            <div>
                                <label className={labelCls}>
                                    Tender Portal Type
                                </label>

                                <select
                                    value={
                                        showCustomInput
                                            ? "__custom__"
                                            : portalValue
                                    }
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "__custom__") {
                                            /* User chose "Other" — flip to
                                               custom mode with empty text */
                                            patch({
                                                siteInfoPortalType: "",
                                            });
                                            /* A small tick — remember they
                                               picked Other so we show the
                                               input. We'll seed it with a
                                               space so it's not equal to ""
                                               and is also not a preset. */
                                            setTimeout(() => {
                                                patch({
                                                    siteInfoPortalType:
                                                        " ",
                                                });
                                            }, 0);
                                        } else {
                                            patch({
                                                siteInfoPortalType: v,
                                            });
                                        }
                                    }}
                                    disabled={saving}
                                    className={inputCls}
                                >
                                    <option value="">
                                        — Select portal type —
                                    </option>
                                    {PORTAL_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                    <option value="__custom__">
                                        Other (type below)…
                                    </option>
                                </select>

                                {showCustomInput && (
                                    <input
                                        type="text"
                                        value={portalValue.trim()}
                                        onChange={(e) =>
                                            patch({
                                                siteInfoPortalType:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="Type a custom portal name…"
                                        disabled={saving}
                                        className={`${inputCls} mt-2`}
                                        autoFocus
                                    />
                                )}
                            </div>

                            {/* Site Contact */}
                            <div>
                                <label className={labelCls}>
                                    Site Contact
                                </label>
                                <input
                                    type="text"
                                    value={draft.siteInfoContact}
                                    onChange={(e) =>
                                        patch({
                                            siteInfoContact:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Procurement Cell"
                                    disabled={saving}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ============ Preview row ============ */}
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-[11px] text-slate-500">
                            Run the crawler against this URL before saving.
                        </p>
                        <button
                            type="button"
                            onClick={onPreview}
                            disabled={previewing || saving}
                            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            {previewing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Eye className="h-3.5 w-3.5" />
                            )}
                            {previewing ? "Testing…" : "Preview"}
                        </button>
                    </div>

                    {/* ============ Preview result ============ */}
                    {preview && (
                        <div className="space-y-2">
                            {preview.fellBack && (
                                <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-2">
                                    <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                                    <div className="min-w-0">
                                        <p className="text-[11.5px] font-bold leading-tight text-sky-800">
                                            Cheerio returned no items — used Puppeteer
                                        </p>
                                        <p className="mt-0.5 text-[11px] leading-relaxed text-sky-700">
                                            The page likely renders its
                                            content with JavaScript. Results
                                            below come from a real browser.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Preview — {preview.count} item
                                            {preview.count === 1 ? "" : "s"}{" "}
                                            found
                                        </p>
                                        {preview.effectiveMode && (
                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                Engine:{" "}
                                                <span className="font-semibold uppercase tracking-wider">
                                                    {preview.effectiveMode}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                    {preview.ok ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                    )}
                                </div>

                                {!preview.ok && preview.error && (
                                    <p className="rounded-md border border-rose-100 bg-rose-50/50 p-2 text-[11px] text-rose-700">
                                        {preview.error}
                                    </p>
                                )}
                                {preview.ok &&
                                    preview.tenders.length === 0 && (
                                        <p className="text-[11px] text-slate-500">
                                            No items matched. The page may need
                                            a different URL or manual override.
                                        </p>
                                    )}
                                {preview.ok &&
                                    preview.tenders.length > 0 && (
                                        <ul className="max-h-[200px] space-y-1.5 overflow-y-auto">
                                            {preview.tenders
                                                .slice(0, 10)
                                                .map((t, i) => (
                                                    <li
                                                        key={i}
                                                        className="rounded border border-slate-100 bg-slate-50/60 px-2.5 py-1.5 text-[11px]"
                                                    >
                                                        <p className="font-semibold text-slate-800">
                                                            {t.title ||
                                                                "(no title)"}
                                                        </p>
                                                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                                                            {t.tenderLink ||
                                                                "(no link)"}
                                                        </p>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}

                                {preview.detectedSelectors &&
                                    preview.detectedSelectors
                                        .listSelector && (
                                        <div className="mt-2 rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Auto-detected selectors
                                            </p>
                                            <ul className="space-y-0.5 font-mono text-[10px] text-slate-600">
                                                <li>
                                                    row:{" "}
                                                    {
                                                        preview
                                                            .detectedSelectors
                                                            .listSelector
                                                    }
                                                </li>
                                                {preview.detectedSelectors
                                                    .titleSelector && (
                                                        <li>
                                                            title:{" "}
                                                            {
                                                                preview
                                                                    .detectedSelectors
                                                                    .titleSelector
                                                            }
                                                        </li>
                                                    )}
                                                {preview.detectedSelectors
                                                    .linkSelector && (
                                                        <li>
                                                            link:{" "}
                                                            {
                                                                preview
                                                                    .detectedSelectors
                                                                    .linkSelector
                                                            }
                                                        </li>
                                                    )}
                                                {preview.detectedSelectors
                                                    .dateSelector && (
                                                        <li>
                                                            date:{" "}
                                                            {
                                                                preview
                                                                    .detectedSelectors
                                                                    .dateSelector
                                                            }
                                                        </li>
                                                    )}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        {saving
                            ? "Saving…"
                            : draft._id
                                ? "Update Site"
                                : "Save Site"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function SiteDirectory() {
    const [sites, setSites] = useState<SiteSource[]>(
        SITES_CACHE?.data ?? []
    );
    const [loading, setLoading] = useState(!SITES_CACHE);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [testing, setTesting] = useState<string | null>(null);

    const [category, setCategory] = useState<string>("banks");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [openDetailId, setOpenDetailId] = useState<string | null>(null);
    const [infoKey, setInfoKey] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [draft, setDraft] = useState<DraftSite>(EMPTY_DRAFT);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [modalSaving, setModalSaving] = useState(false);

    const { groups } = useTenderStats();

    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const loadSites = useCallback(async (force = false) => {
        if (!SITES_CACHE) setLoading(true);
        try {
            const rows = await fetchSites(force);
            if (mounted.current) setSites(rows);
        } catch (err) {
            console.error(err);
            if (mounted.current) toast.error("Failed to load sites");
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSites();
    }, [loadSites]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = sites.filter(
            (s) => (s.sector ?? "banks") === category
        );
        if (!q) return list;
        return list.filter((s) => s.name.toLowerCase().includes(q));
    }, [sites, category, search]);

    useEffect(() => {
        const stillValid =
            openDetailId && filtered.some((s) => s._id === openDetailId);

        if (!stillValid) {
            setOpenDetailId(filtered[0]?._id ?? null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, category]);

    const popularAll = useMemo(
        () =>
            sites.filter((s) => s.popular === true && s.active !== false),
        [sites]
    );
    const popular = useMemo(
        () => popularAll.slice(page * 3, page * 3 + 3),
        [popularAll, page]
    );
    const hasPrev = page > 0;
    const hasNext = (page + 1) * 3 < popularAll.length;

    const info = useMemo(() => {
        if (!infoKey) return null;
        const s = sites.find((x) => x._id === infoKey);
        if (!s) return null;
        return {
            title: s.name,
            rows: [
                {
                    label: "Sector",
                    value: s.siteInfoSector || s.sector || "—",
                },
                {
                    label: "Tender Portal Type",
                    value: s.siteInfoPortalType || "—",
                },
                {
                    label: "Site Contact",
                    value: s.siteInfoContact || "—",
                },
            ],
        };
    }, [infoKey, sites]);

    const relatedRows = useMemo<RelatedRow[]>(() => {
        if (!openDetailId) return [];
        const site = sites.find((s) => s._id === openDetailId);
        if (!site) return [];
        const all = [
            ...(groups.potential ?? []),
            ...(groups.active ?? []),
            ...(groups.submitted ?? []),
        ];
        return all
            .filter((t) => t.tenderer === site.name)
            .map((t) => ({
                tender: t.title,
                stage:
                    t.stage === "potential"
                        ? "Potential"
                        : t.stage === "active"
                            ? "Active"
                            : "Submitted",
                value: t.tentativeBudget
                    ? `৳${t.tentativeBudget.toLocaleString("en-IN")}`
                    : "—",
                status:
                    t.stage === "submitted"
                        ? "Awaiting result"
                        : t.stage === "active"
                            ? `Docs: ${t.docStatus ?? "—"}`
                            : "Under review",
            }));
    }, [openDetailId, sites, groups]);

    const openSite = useMemo(
        () =>
            openDetailId
                ? sites.find((s) => s._id === openDetailId)
                : null,
        [openDetailId, sites]
    );

    const openNew = () => {
        setDraft({ ...EMPTY_DRAFT, sector: category });
        setPreview(null);
        setModalOpen(true);
    };

    const openEdit = (site: SiteSource) => {
        const preset = presetFor(site.sector || "banks");
        setDraft({
            _id: site._id,
            name: site.name,
            url: site.url,
            listSelector: "",
            titleSelector: "",
            linkSelector: "",
            dateSelector: "",
            linkAttr: site.linkAttr || "href",
            active: site.active,
            renderMode: "auto",
            sector: site.sector || "banks",
            portalUrl: site.portalUrl || "",
            popular: !!site.popular,
            popularShort: site.popularShort || "",
            popularColor: site.popularColor || "#1F3864",
            popularSubtitle: site.popularSubtitle || "",
            siteInfoSector: site.siteInfoSector || preset.displaySector,
            siteInfoPortalType: site.siteInfoPortalType || "",
            siteInfoContact: site.siteInfoContact || preset.contact,
        });
        setPreview(null);
        setModalOpen(true);
    };

    const handlePreview = async () => {
        if (!draft.url.trim()) {
            toast.error("URL is required");
            return;
        }
        setPreviewing(true);
        setPreview(null);
        const loadingId = toast.loading(
            "Trying Cheerio, then Puppeteer if needed…"
        );
        try {
            const r = await fetch(`${API_BASE}/tenders/sites/preview`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    url: draft.url,
                    renderMode: "auto",
                }),
            });
            const json = await r.json();
            if (!json.success)
                throw new Error(json.data?.error || "Preview failed");
            setPreview(json.data);

            if (json.data.fellBack) {
                toast.success(
                    `Cheerio found 0 — Puppeteer returned ${json.data.count}`,
                    { id: loadingId, duration: 5000 }
                );
            } else {
                toast.success(
                    `Found ${json.data.count} items${json.data.effectiveMode ? ` via ${json.data.effectiveMode}` : ""}`,
                    { id: loadingId }
                );
            }
        } catch (e) {
            toast.error((e as Error).message || "Preview failed", {
                id: loadingId,
            });
        } finally {
            setPreviewing(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!draft.name.trim() || !draft.url.trim()) {
            toast.error("Name and URL are required");
            return;
        }
        setModalSaving(true);
        const isEdit = !!draft._id;
        const loadingId = toast.loading(
            isEdit ? "Updating site…" : "Creating site…"
        );
        try {
            const payload = {
                ...draft,
                listSelector: "",
                titleSelector: "",
                linkSelector: "",
                dateSelector: "",
                active: isEdit ? draft.active : true,
                renderMode: "auto" as const,
            };

            const url = isEdit
                ? `${API_BASE}/tenders/sites/${draft._id}`
                : `${API_BASE}/tenders/sites`;
            const method = isEdit ? "PUT" : "POST";
            const r = await fetch(url, {
                method,
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            const json = await r.json();
            if (!json.success)
                throw new Error(json.message || "Save failed");

            toast.success(isEdit ? "Site updated" : "Site added", {
                id: loadingId,
            });
            invalidateSitesCache();

            if (isEdit && json.data) {
                setSites((prev) =>
                    prev.map((s) =>
                        s._id === draft._id ? { ...s, ...json.data } : s
                    )
                );
            } else if (!isEdit && json.data) {
                setSites((prev) => [json.data as SiteSource, ...prev]);
            }
            setModalOpen(false);
            loadSites(true);
        } catch (e) {
            toast.error((e as Error).message || "Save failed", {
                id: loadingId,
            });
        } finally {
            setModalSaving(false);
        }
    };

    const handleDelete = async (site: SiteSource) => {
        if (
            !window.confirm(
                `Delete "${site.name}"? This won't delete any tenders already crawled.`
            )
        )
            return;

        const snapshot = sites;
        setSites((prev) => prev.filter((s) => s._id !== site._id));
        setDeletingId(site._id);
        try {
            const r = await fetch(
                `${API_BASE}/tenders/sites/${site._id}`,
                {
                    method: "DELETE",
                    headers: authHeaders(),
                }
            );
            const json = await r.json();
            if (!json.success)
                throw new Error(json.message || "Delete failed");
            invalidateSitesCache();
            toast.success("Site deleted");
        } catch (e) {
            setSites(snapshot);
            toast.error((e as Error).message || "Delete failed");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (site: SiteSource) => {
        const snapshot = sites;
        setSites((prev) =>
            prev.map((s) =>
                s._id === site._id ? { ...s, active: !s.active } : s
            )
        );
        setSavingId(site._id);
        try {
            const r = await fetch(
                `${API_BASE}/tenders/sites/${site._id}`,
                {
                    method: "PUT",
                    headers: authHeaders(),
                    body: JSON.stringify({ active: !site.active }),
                }
            );
            const json = await r.json();
            if (!json.success)
                throw new Error(json.message || "Update failed");
            invalidateSitesCache();
        } catch (e) {
            setSites(snapshot);
            toast.error((e as Error).message || "Update failed");
        } finally {
            setSavingId(null);
        }
    };

    const handleTest = async (site: SiteSource) => {
        setTesting(site._id);
        const loadingId = toast.loading(`Testing ${site.name}…`);
        try {
            const r = await fetch(`${API_BASE}/tenders/sites/preview`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    url: site.url,
                    renderMode: "auto",
                }),
            });
            const json = await r.json();
            if (!json.success)
                throw new Error(json.data?.error || "Test failed");

            if (json.data.fellBack) {
                toast.success(
                    `Cheerio found 0 — Puppeteer returned ${json.data.count} on ${site.name}`,
                    { id: loadingId, duration: 5000 }
                );
            } else {
                toast.success(
                    `Found ${json.data.count} items on ${site.name}`,
                    { id: loadingId }
                );
            }
        } catch (e) {
            toast.error((e as Error).message || "Test failed", {
                id: loadingId,
            });
        } finally {
            setTesting(null);
        }
    };

    const toggleRow = (id: string) => {
        setOpenDetailId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#a97400]">
                        Tender Management
                    </p>
                    <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
                        Site Directory
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={openNew}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Site
                </button>
            </div>

            {/* Search + portals */}
            <div
                className="flex flex-wrap items-center gap-6 rounded-xl border bg-white px-4 py-3"
                style={{ borderColor: "#e2e8f0" }}
            >
                <div className="relative w-1/3 min-w-[220px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by company name…"
                        className="h-[38px] w-full rounded-lg border bg-white pl-8 pr-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        style={{ borderColor: "#e2e8f0" }}
                    />
                </div>
                <div className="whitespace-nowrap text-[12px] text-slate-500">
                    <span className="font-bold text-[#1e3a5f]">
                        Other Tender Portals:
                    </span>{" "}
                    <a
                        href="#"
                        className="ml-1 font-medium text-[#1e3a5f] underline"
                    >
                        eGP
                    </a>
                    <span className="mx-1 text-slate-300">|</span>
                    <a
                        href="#"
                        className="font-medium text-[#1e3a5f] underline"
                    >
                        Tenderbazar
                    </a>
                    <span className="mx-1 text-slate-300">|</span>
                    <a
                        href="#"
                        className="font-medium text-[#1e3a5f] underline"
                    >
                        All Tenders
                    </a>
                    <span className="text-slate-500">
                        {" "}
                        · configurable in Admin Settings
                    </span>
                </div>
            </div>

            {/* Sector tabs */}
            <div
                className="flex items-center gap-6 border-b"
                style={{ borderColor: "#e2e8f0" }}
            >
                {SECTORS.map((c) => {
                    const active = c.id === category;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                                setCategory(c.id);
                                setSearch("");
                            }}
                            className={`relative -mb-px pb-2 text-[12px] font-semibold transition ${active
                                ? "text-[#a97400]"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            {c.label}
                            {active && (
                                <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#a97400]" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                {/* LEFT: entries list */}
                <div
                    className="overflow-hidden rounded-xl border bg-white"
                    style={{ borderColor: "#e2e8f0" }}
                >
                    {loading && sites.length === 0 && (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-[12px]">
                                Loading sites…
                            </span>
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div className="px-4 py-10 text-center">
                            <Globe className="mx-auto h-8 w-8 text-slate-300" />
                            <p className="mt-2 text-[13px] font-semibold text-slate-600">
                                {search
                                    ? `No companies match "${search}".`
                                    : "No sites in this sector yet."}
                            </p>
                            <button
                                type="button"
                                onClick={openNew}
                                className="mt-3 inline-flex h-8 items-center gap-1 rounded-md bg-[#a97400] px-3 text-[11px] font-semibold text-white hover:bg-[#8f6100]"
                            >
                                <Plus className="h-3 w-3" /> Add Site
                            </button>
                        </div>
                    )}

                    {!loading &&
                        filtered.map((e, idx) => {
                            const isOpen = openDetailId === e._id;
                            const isFirst = idx === 0;
                            const isSaving = savingId === e._id;
                            const isDeleting = deletingId === e._id;
                            const isTesting = testing === e._id;

                            return (
                                <div
                                    key={e._id}
                                    style={{
                                        borderTop:
                                            idx === 0
                                                ? "none"
                                                : "1px solid #f1f5f9",
                                    }}
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => toggleRow(e._id)}
                                        onKeyDown={(ev) => {
                                            if (
                                                ev.key === "Enter" ||
                                                ev.key === " "
                                            ) {
                                                ev.preventDefault();
                                                toggleRow(e._id);
                                            }
                                        }}
                                        className={`group flex cursor-pointer items-center justify-between px-4 py-[11px] transition ${isFirst
                                            ? "bg-[#f5ecd8]"
                                            : isOpen
                                                ? "bg-[#faf7f0]"
                                                : "hover:bg-slate-50/60"
                                            }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="truncate text-[12.5px] font-bold text-slate-900">
                                                {e.name}
                                            </span>

                                            {!e.active && (
                                                <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                                                    Inactive
                                                </span>
                                            )}
                                            {e.renderMode === "auto" && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-[2px] text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
                                                    Auto
                                                </span>
                                            )}
                                            {e.renderMode === "puppeteer" && (
                                                <span className="rounded-full bg-purple-100 px-2 py-[2px] text-[9.5px] font-bold uppercase tracking-wider text-purple-700">
                                                    Puppeteer
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className="flex items-center gap-3"
                                            onClick={(ev) =>
                                                ev.stopPropagation()
                                            }
                                        >
                                            <span
                                                className={`rounded-full px-2.5 py-[3px] text-[10.5px] font-bold ${(e.lastItemCount ?? 0) > 0
                                                    ? "bg-[#f5ecd8] text-[#a97400]"
                                                    : "bg-[#e6ebf3] text-[#1e3a5f]"
                                                    }`}
                                            >
                                                {e.lastItemCount ?? 0}{" "}
                                                {(e.lastItemCount ?? 0) === 1
                                                    ? "Tender"
                                                    : "Tenders"}
                                            </span>

                                            <a
                                                href={e.portalUrl || e.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[12px] font-semibold text-[#1e3a5f] hover:underline"
                                            >
                                                Open Portal →
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setInfoKey(e._id)
                                                }
                                                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1e3a5f] hover:underline"
                                            >
                                                <span className="text-[13px] leading-none">
                                                    ⓘ
                                                </span>{" "}
                                                Info
                                            </button>

                                            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleTest(e)
                                                    }
                                                    disabled={isTesting}
                                                    title="Test crawler"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                                >
                                                    {isTesting ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Play className="h-3 w-3" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(e)}
                                                    title="Edit site"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleActive(e)
                                                    }
                                                    disabled={isSaving}
                                                    title={
                                                        e.active
                                                            ? "Deactivate (currently active)"
                                                            : "Activate (currently inactive)"
                                                    }
                                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white transition ${e.active
                                                        ? "border-red-400 text-red-600 hover:bg-red-50"
                                                        : "border-green-400 text-green-600 hover:bg-green-50"
                                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Power className="h-3 w-3" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(e)
                                                    }
                                                    disabled={isDeleting}
                                                    title="Delete site"
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* RIGHT: Popular Tenderers */}
                <aside
                    className="rounded-xl border bg-white p-4"
                    style={{ borderColor: "#e2e8f0" }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-[13.5px] font-bold text-[#a97400]">
                            Popular Tenderers
                        </h3>
                        <div className="flex items-center gap-2 text-[11.5px] font-medium text-slate-500">
                            <button
                                type="button"
                                onClick={() =>
                                    setPage((p) => Math.max(0, p - 1))
                                }
                                disabled={!hasPrev}
                                className="hover:text-slate-800 disabled:opacity-40"
                            >
                                « Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!hasNext}
                                className="hover:text-slate-800 disabled:opacity-40"
                            >
                                Next »
                            </button>
                        </div>
                    </div>

                    {popular.length === 0 && (
                        <div className="px-2 py-6 text-center text-[11.5px] text-slate-400">
                            No popular tenderers yet — edit a site and mark it
                            as Popular.
                        </div>
                    )}

                    {popular.map((p, i) => (
                        <div
                            key={p._id}
                            className="flex items-start gap-3 py-3"
                            style={{
                                borderTop:
                                    i === 0 ? "none" : "1px solid #f1f5f9",
                            }}
                        >
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold text-white"
                                style={{
                                    background: p.popularColor || "#1F3864",
                                }}
                            >
                                {(
                                    p.popularShort || p.name.slice(0, 2)
                                ).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12.5px] font-bold text-slate-900">
                                    {p.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    {p.popularSubtitle || "—"}
                                </p>
                                <a
                                    href={p.portalUrl || p.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a5f] hover:underline"
                                >
                                    Visit Portal{" "}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    ))}
                </aside>
            </div>

            {/* Related Tenders */}
            {openSite && (
                <RelatedPanel
                    title={`Related Tenders — ${openSite.name}`}
                    rows={relatedRows}
                />
            )}

            {/* Add / Edit Modal */}
            {modalOpen && (
                <SiteModal
                    draft={draft}
                    setDraft={setDraft}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveDraft}
                    onPreview={handlePreview}
                    preview={preview}
                    previewing={previewing}
                    saving={modalSaving}
                />
            )}

            {/* Info Modal */}
            {info && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setInfoKey(null)}
                    />
                    <div
                        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl"
                        style={{ borderColor: "#e2e8f0" }}
                    >
                        <div
                            className="flex items-start justify-between gap-3 border-b px-5 py-3"
                            style={{ borderColor: "#f1f5f9" }}
                        >
                            <h3 className="text-sm font-bold text-slate-900">
                                {info.title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setInfoKey(null)}
                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Close"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            {info.rows.map((r, i) => (
                                <div
                                    key={r.label}
                                    className="flex items-start justify-between gap-4 py-2.5 text-[12.5px]"
                                    style={{
                                        borderTop:
                                            i === 0
                                                ? "none"
                                                : "1px solid #f1f5f9",
                                    }}
                                >
                                    <span className="text-slate-500">
                                        {r.label}
                                    </span>
                                    <span className="text-right font-medium text-slate-800">
                                        {r.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div
                            className="flex items-center justify-end gap-2 border-t px-5 py-3"
                            style={{
                                borderColor: "#f1f5f9",
                                background: "rgba(248,250,252,0.6)",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setInfoKey(null)}
                                className="inline-flex h-8 items-center rounded-lg border bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                                style={{ borderColor: "#e2e8f0" }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}