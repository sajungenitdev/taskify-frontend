// app/(dashboard)/tenders/tender-sites/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Play,
  Save,
  X,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  ExternalLink,
  Power,
  Zap,
  Cpu,
} from "lucide-react";

/* ============================================================
 * Types
 * ============================================================ */
type RenderMode = "cheerio" | "puppeteer";

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
  absoluteLinks: boolean;
  active: boolean;
  renderMode: RenderMode;
  lastCrawledAt: string | null;
  lastCrawlStatus: "idle" | "success" | "error" | "";
  lastCrawlError: string;
  lastItemCount: number;
  createdAt: string;
  updatedAt: string;
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
}

/* ============================================================
 * Constants
 * ============================================================ */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

const EMPTY_DRAFT: DraftSite = {
  name: "",
  url: "",
  listSelector: "",
  titleSelector: "td.title a",
  linkSelector: "td.title a",
  dateSelector: "td.date",
  linkAttr: "href",
  active: true,
  renderMode: "cheerio",
};

/* ============================================================
 * Module-level cache — survives page unmount within the same session
 * ============================================================ */
let SITES_CACHE: { data: SiteSource[]; ts: number } | null = null;
let IN_FLIGHT: Promise<SiteSource[]> | null = null;
const STALE_MS = 30_000;

/* ============================================================
 * Helpers
 * ============================================================ */
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

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
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
    const rows = json.data ?? [];
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
 * Main page
 * ============================================================ */
export default function TenderSitesPage() {
  const [sites, setSites] = useState<SiteSource[]>(
    SITES_CACHE?.data ?? [],
  );
  const [loading, setLoading] = useState(!SITES_CACHE);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftSite>(EMPTY_DRAFT);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  /* Prevent setting state on unmounted component */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* ---------- Load sites (cache-aware) ---------- */
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

  /* ---------- Open modal ---------- */
  const openNew = () => {
    setDraft(EMPTY_DRAFT);
    setPreview(null);
    setModalOpen(true);
  };

  const openEdit = (site: SiteSource) => {
    setDraft({
      _id: site._id,
      name: site.name,
      url: site.url,
      listSelector: site.listSelector,
      titleSelector: site.titleSelector || "td.title a",
      linkSelector: site.linkSelector || "td.title a",
      dateSelector: site.dateSelector || "td.date",
      linkAttr: site.linkAttr || "href",
      active: site.active,
      renderMode: site.renderMode || "cheerio",
    });
    setPreview(null);
    setModalOpen(true);
  };

  /* ---------- Preview ---------- */
  const handlePreview = async () => {
    if (!draft.url.trim() || !draft.listSelector.trim()) {
      toast.error("URL and List Selector are required");
      return;
    }
    setPreviewing(true);
    setPreview(null);

    const loadingId = toast.loading(
      draft.renderMode === "puppeteer"
        ? "Launching browser + parsing (this may take 10-20s)..."
        : "Fetching page...",
    );

    try {
      const r = await fetch(`${API_BASE}/tenders/sites/preview`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          url: draft.url,
          listSelector: draft.listSelector,
          titleSelector: draft.titleSelector,
          linkSelector: draft.linkSelector,
          dateSelector: draft.dateSelector,
          linkAttr: draft.linkAttr,
          renderMode: draft.renderMode,
        }),
      });
      const json = await r.json();
      if (!json.success) {
        throw new Error(json.data?.error || "Preview failed");
      }
      setPreview(json.data);
      toast.success(`Found ${json.data.count} items`, { id: loadingId });
    } catch (e) {
      toast.error((e as Error).message || "Preview failed", {
        id: loadingId,
      });
    } finally {
      setPreviewing(false);
    }
  };

  /* ---------- Save (optimistic for edits, refetch for creates) ---------- */
  const handleSaveDraft = async () => {
    if (!draft.name.trim() || !draft.url.trim() || !draft.listSelector.trim()) {
      toast.error("Name, URL, and List Selector are required");
      return;
    }

    setModalSaving(true);
    const isEdit = !!draft._id;
    const loadingId = toast.loading(
      isEdit ? "Updating site..." : "Creating site...",
    );

    try {
      const url = isEdit
        ? `${API_BASE}/tenders/sites/${draft._id}`
        : `${API_BASE}/tenders/sites`;
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(draft),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.message || "Save failed");

      toast.success(isEdit ? "Site updated" : "Site added", {
        id: loadingId,
      });

      /* Clear cache so the next read is fresh, and patch local state
         immediately rather than refetching the whole list. */
      invalidateSitesCache();

      if (isEdit && json.data) {
        setSites((prev) =>
          prev.map((s) =>
            s._id === draft._id ? { ...s, ...json.data } : s,
          ),
        );
      } else if (!isEdit && json.data) {
        setSites((prev) => [json.data as SiteSource, ...prev]);
      }

      setModalOpen(false);

      /* Kick off a background refresh — never blocks the UI */
      loadSites(true);
    } catch (e) {
      toast.error((e as Error).message || "Save failed", { id: loadingId });
    } finally {
      setModalSaving(false);
    }
  };

  /* ---------- Delete (optimistic) ---------- */
  const handleDelete = async (site: SiteSource) => {
    if (
      !window.confirm(
        `Delete "${site.name}"? This won't delete any tenders already crawled.`,
      )
    ) {
      return;
    }

    /* Remove from UI instantly, keep a copy for rollback */
    const snapshot = sites;
    setSites((prev) => prev.filter((s) => s._id !== site._id));
    setDeletingId(site._id);

    try {
      const r = await fetch(`${API_BASE}/tenders/sites/${site._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.message || "Delete failed");

      invalidateSitesCache();
      toast.success("Site deleted");
    } catch (e) {
      /* Rollback */
      setSites(snapshot);
      toast.error((e as Error).message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Toggle active (optimistic) ---------- */
  const toggleActive = async (site: SiteSource) => {
    const snapshot = sites;
    setSites((prev) =>
      prev.map((s) =>
        s._id === site._id ? { ...s, active: !s.active } : s,
      ),
    );
    setSavingId(site._id);

    try {
      const r = await fetch(`${API_BASE}/tenders/sites/${site._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ active: !site.active }),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.message || "Update failed");
      invalidateSitesCache();
    } catch (e) {
      setSites(snapshot);
      toast.error((e as Error).message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  /* ---------- Test one site now ---------- */
  const handleTest = async (site: SiteSource) => {
    setTesting(site._id);
    const loadingId = toast.loading(
      `Testing ${site.name}${site.renderMode === "puppeteer" ? " (may take 15s)" : ""
      }...`,
    );
    try {
      const r = await fetch(`${API_BASE}/tenders/sites/preview`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          url: site.url,
          listSelector: site.listSelector,
          titleSelector: site.titleSelector,
          linkSelector: site.linkSelector,
          dateSelector: site.dateSelector,
          linkAttr: site.linkAttr,
          renderMode: site.renderMode || "cheerio",
        }),
      });
      const json = await r.json();
      if (!json.success) throw new Error(json.data?.error || "Test failed");
      toast.success(`Found ${json.data.count} items on ${site.name}`, {
        id: loadingId,
      });
    } catch (e) {
      toast.error((e as Error).message || "Test failed", { id: loadingId });
    } finally {
      setTesting(null);
    }
  };

  /* ============================================================
   * Render
   * ============================================================ */
  return (
    <main className="min-h-screen bg-[#faf7f0] pb-24 text-slate-900">
      <div className="mx-auto max-w-[1400px] space-y-5 p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a97400]">
              Tender Management
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Tender Site Directory
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Manage the external sites the automated crawler visits each
              morning. Each site needs its own HTML selectors and render mode.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Site
          </button>
        </header>

        {/* Info banner */}
        <section className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
            How to add a site
          </h3>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-[12px] leading-relaxed text-sky-800">
            <li>Open the target site in Chrome and find the tender listing page.</li>
            <li>Right-click a tender row → <b>Inspect</b> to see the HTML structure.</li>
            <li>Note the CSS selectors: the row, the title link, and the date.</li>
            <li>
              Pick a <b>render mode</b>: <b>Cheerio</b> for static pages,{" "}
              <b>Puppeteer</b> for pages that load rows via JavaScript.
            </li>
            <li>Fill the form, click <b>Preview</b> to verify, then <b>Save</b>.</li>
          </ol>
        </section>

        {/* Sites list */}
        {loading && sites.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[140px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Globe className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-[14px] font-semibold text-slate-700">
              No sites yet
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Add your first site to start crawling.
            </p>
            <button
              type="button"
              onClick={openNew}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#8f6100]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Site
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <SiteCard
                key={site._id}
                site={site}
                onEdit={() => openEdit(site)}
                onDelete={() => handleDelete(site)}
                onToggleActive={() => toggleActive(site)}
                onTest={() => handleTest(site)}
                saving={savingId === site._id}
                deleting={deletingId === site._id}
                testing={testing === site._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Add / Edit Modal ---------- */}
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
    </main>
  );
}

/* ============================================================
 * Site Card — memoized so listing stays snappy at scale
 * ============================================================ */
import { memo } from "react";

const SiteCard = memo(function SiteCard({
  site,
  onEdit,
  onDelete,
  onToggleActive,
  onTest,
  saving,
  deleting,
  testing,
}: {
  site: SiteSource;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onTest: () => void;
  saving: boolean;
  deleting: boolean;
  testing: boolean;
}) {
  const status = site.lastCrawlStatus;

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition ${site.active ? "border-slate-200/80" : "border-slate-200 bg-slate-50/40"
        }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-[#a97400]" />
            <h3 className="truncate text-[14px] font-bold text-slate-900">
              {site.name}
            </h3>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${site.renderMode === "puppeteer"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
                }`}
            >
              {site.renderMode === "puppeteer" ? (
                <Cpu className="h-3 w-3" />
              ) : (
                <Zap className="h-3 w-3" />
              )}
              {site.renderMode === "puppeteer" ? "Puppeteer" : "Cheerio"}
            </span>

            {!site.active && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Inactive
              </span>
            )}
            {status === "success" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                {site.lastItemCount} items
              </span>
            )}
            {status === "error" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                <AlertCircle className="h-3 w-3" />
                Error
              </span>
            )}
          </div>

          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[12px] text-slate-500 hover:text-slate-800 hover:underline"
          >
            <span className="truncate font-mono">{site.url}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>

          <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">
            <SelectorField label="List" value={site.listSelector} />
            <SelectorField label="Title" value={site.titleSelector} />
            <SelectorField label="Link" value={site.linkSelector} />
            <SelectorField label="Date" value={site.dateSelector} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last crawled: {formatDateTime(site.lastCrawledAt)}
            </span>
          </div>

          {status === "error" && site.lastCrawlError && (
            <p className="mt-2 rounded-md border border-rose-100 bg-rose-50/50 px-2.5 py-1.5 text-[11px] text-rose-700">
              {site.lastCrawlError}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleActive}
            disabled={saving}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold transition disabled:opacity-50 ${site.active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
          >
            <Power className="h-3 w-3" />
            {site.active ? "Active" : "Inactive"}
          </button>

          <button
            type="button"
            onClick={onTest}
            disabled={testing}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Test
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Delete
          </button>
        </div>
      </div>
    </article>
  );
});

function SelectorField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <code className="block truncate font-mono text-[11px] text-slate-700">
        {value || "—"}
      </code>
    </div>
  );
}

/* ============================================================
 * Add / Edit Modal (unchanged)
 * ============================================================ */
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

  const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50";
  const labelCls =
    "mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[5vh] backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {draft._id ? "Edit Site" : "Add Site"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Fill in the site URL, render mode, and CSS selectors. Preview
              before saving to verify the crawler can read it.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div>
              <label className={labelCls}>Status</label>
              <button
                type="button"
                onClick={() => patch({ active: !draft.active })}
                disabled={saving}
                className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border text-[12px] font-semibold transition ${draft.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
                  }`}
              >
                <Power className="h-3.5 w-3.5" />
                {draft.active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

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

          <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
            <label className={labelCls}>Render Mode</label>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => patch({ renderMode: "cheerio" })}
                disabled={saving}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${draft.renderMode === "cheerio"
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
              >
                <Zap
                  className={`mt-0.5 h-4 w-4 shrink-0 ${draft.renderMode === "cheerio"
                      ? "text-blue-600"
                      : "text-slate-400"
                    }`}
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800">Cheerio</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                    Fast. Fetches HTML only. Use for static sites.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => patch({ renderMode: "puppeteer" })}
                disabled={saving}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${draft.renderMode === "puppeteer"
                    ? "border-purple-300 bg-purple-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
              >
                <Cpu
                  className={`mt-0.5 h-4 w-4 shrink-0 ${draft.renderMode === "puppeteer"
                      ? "text-purple-600"
                      : "text-slate-400"
                    }`}
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800">Puppeteer</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                    Slow but powerful. Runs a real browser. Use for JS-rendered sites.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              CSS Selectors
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Row Selector *</label>
                <input
                  type="text"
                  value={draft.listSelector}
                  onChange={(e) => patch({ listSelector: e.target.value })}
                  placeholder="e.g. #dataTable tbody tr"
                  disabled={saving}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Title Selector</label>
                <input
                  type="text"
                  value={draft.titleSelector}
                  onChange={(e) => patch({ titleSelector: e.target.value })}
                  placeholder="td:nth-child(3)"
                  disabled={saving}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Link Selector</label>
                <input
                  type="text"
                  value={draft.linkSelector}
                  onChange={(e) => patch({ linkSelector: e.target.value })}
                  placeholder="td:nth-child(2) a"
                  disabled={saving}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className={labelCls}>Date Selector</label>
                <input
                  type="text"
                  value={draft.dateSelector}
                  onChange={(e) => patch({ dateSelector: e.target.value })}
                  placeholder="td:nth-child(6)"
                  disabled={saving}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <div className="mt-3">
              <label className={labelCls}>Link Attribute</label>
              <input
                type="text"
                value={draft.linkAttr}
                onChange={(e) => patch({ linkAttr: e.target.value })}
                placeholder="href"
                disabled={saving}
                className={`${inputCls} font-mono sm:w-40`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-[11px] text-slate-500">
              Test the selectors before saving — the crawler won't touch
              anything until you hit Save.
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
              {previewing
                ? "Testing…"
                : draft.renderMode === "puppeteer"
                  ? "Preview (slow)"
                  : "Preview"}
            </button>
          </div>

          {preview && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Preview — {preview.count} item{preview.count === 1 ? "" : "s"} found
                </p>
                {preview.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
              </div>
              {!preview.ok && preview.error && (
                <p className="rounded-md border border-rose-100 bg-rose-50/50 p-2 text-[11px] text-rose-700">
                  {preview.error}
                </p>
              )}
              {preview.ok && preview.tenders.length === 0 && (
                <p className="text-[11px] text-slate-500">
                  No items matched. Check your selectors or switch render mode.
                </p>
              )}
              {preview.ok && preview.tenders.length > 0 && (
                <ul className="max-h-[220px] space-y-1.5 overflow-y-auto">
                  {preview.tenders.slice(0, 15).map((t, i) => (
                    <li
                      key={i}
                      className="rounded border border-slate-100 bg-slate-50/60 px-2.5 py-1.5 text-[11px]"
                    >
                      <p className="font-semibold text-slate-800">
                        {t.title || "(no title)"}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                        {t.tenderLink || "(no link)"}
                      </p>
                      {t.publishedAtText && (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {t.publishedAtText}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
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
            {saving ? "Saving…" : draft._id ? "Update Site" : "Save Site"}
          </button>
        </div>
      </div>
    </div>
  );
}