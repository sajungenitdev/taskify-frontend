// lib/api/tender.api.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const TENDER_BASE = `${API_BASE}/tenders`;

/* ============================================================
 * AUTH HEADER
 * ============================================================ */
function authHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ============================================================
 * RESPONSE ENVELOPE
 * ============================================================ */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed with ${res.status}`);
  }
  return json;
}

function qs(params?: Record<string, unknown>) {
  if (!params) return "";
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ============================================================
 * GET CACHE + IN-FLIGHT DEDUP
 *
 * - Same URL called twice within 5s → second call gets the cached
 *   response (zero network).
 * - Same URL called twice in the same tick → second call awaits the
 *   first request's promise.
 * - Any mutation clears the whole cache.
 * ============================================================ */
const GET_TTL_MS = 5_000;
const GET_CACHE = new Map<string, { envelope: any; ts: number }>();
const IN_FLIGHT = new Map<string, Promise<any>>();

function clearGetCache() {
  GET_CACHE.clear();
  IN_FLIGHT.clear();
}

async function cachedGet<T>(url: string): Promise<T> {
  // 1. Fresh cache hit
  const hit = GET_CACHE.get(url);
  if (hit && Date.now() - hit.ts < GET_TTL_MS) {
    return hit.envelope as T;
  }

  // 2. Same request already in flight
  const inFlight = IN_FLIGHT.get(url);
  if (inFlight) return inFlight as Promise<T>;

  // 3. Fire the request
  const p = (async () => {
    const res = await fetch(url, { headers: authHeaders() });
    const envelope = await handle<any>(res);
    GET_CACHE.set(url, { envelope, ts: Date.now() });
    IN_FLIGHT.delete(url);
    return envelope;
  })();

  IN_FLIGHT.set(url, p);

  try {
    return (await p) as T;
  } catch (e) {
    IN_FLIGHT.delete(url);
    throw e;
  }
}

/* ============================================================
 * TYPES
 * ============================================================ */
export type TenderStage =
  | "potential"
  | "active"
  | "submitted"
  | "lost"
  | "won";
export type TenderType = "eGP" | "RFQ" | "Hardcopy Ref.";
export type SecurityType =
  | "Tender Security"
  | "Performance Security"
  | "Bank Guarantee";
export type DocsStatus = "Attached" | "Missing";
export type CompanyDocCategory =
  | "legal"
  | "profiles"
  | "experience"
  | "certificates";
export type CompanyDocStatus = "Valid" | "Expiring Soon" | "Expired";
export type Currency = "BDT" | "USD" | "SAR" | "AED" | "INR" | "EUR" | "GBP";

/* ---------- Attachments ---------- */
export interface TenderAttachment {
  _id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

/* ---------- Advertisement ---------- */
export interface AdvertisementInfo {
  advertisementFile: string;
  advertisementUrl: string;
  advertisementUploadedBy: string;
  advertisementUploadedAt: string;
}

/* ---------- Competitors ---------- */
export interface TenderCompetitor {
  bidder: string;
  value: number;
  isUs?: boolean;
}

/* ---------- Checklist ---------- */
export interface TenderChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  isCustom?: boolean;
}

/* ---------- Tender ---------- */
export interface Tender {
  _id: string;
  tenderer: string;
  title: string;
  draft?: boolean;
  stage: TenderStage;
  tenderType: TenderType;
  description?: string;
  tenderLink?: string;
  recordedBy?: string;
  responsiblePerson?: string;
  lastDateOfPurchase?: string;
  lastDateOfSubmission?: string;
  submittedAt?: string;
  tentativeBudget?: number;
  bidValue?: number;
  currency?: Currency;
  tenderSecurityAmount?: number;
  tenderSecurityValidity?: string;
  performanceSecurityAmount?: number;
  performanceSecurityValidity?: string;
  securityMode?: string;
  submitted?: boolean;
  mode?: string;
  readiness?: number;
  docStatus?: string;
  advertisementFile?: string;
  advertisementUrl?: string;
  advertisementUploadedBy?: string;
  advertisementUploadedAt?: string;
  note?: string;
  eligibility?: string;
  attachments?: TenderAttachment[];
  otherParticipants?: TenderCompetitor[];
  checklist?: TenderChecklistItem[];
  lossReason?: string;
  lowestCompliantBidder?: string;
  lowestCompliantValue?: number;
  lostAt?: string;
  owner?: { _id: string; fullName: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Doc Tasks ---------- */
export interface TenderDocTask {
  _id: string;
  tenderId: string;
  title: string;
  owner: string;
  fileName: string;
  fileUrl?: string;
  status: "Pending" | "In Progress" | "Done";
  order: number;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Submissions ---------- */
export interface SubmissionRow {
  id: string;
  tenderer: string;
  mode: string;
  submitted: "Submitted" | "Not yet";
  status: string;
  readiness: number;
}

export interface SubmissionAttachment {
  _id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface SubmissionChecklistItem {
  id: string;
  label: string;
  value?: string;
  tone?: "neutral" | "progress" | "warn";
  checked?: boolean;
  isCustom?: boolean;
}

export interface SubmissionBidSummary {
  ourBidValue: number;
  tenderSecurity: number;
  performanceSecurity: number;
  performanceSecurityPercent: number;
  currency: string;
}

export interface SubmissionParticipant {
  bidder: string;
  value: number;
  isUs?: boolean;
}

export interface SubmissionDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface SubmissionDetail {
  id: string;
  tenderer: string;
  title: string;
  deadlineDays: number;
  readiness: number;
  bidSummary?: SubmissionBidSummary;
  otherParticipants?: SubmissionParticipant[];
  documentsSubmitted?: SubmissionDocument[];
  docTasks: {
    id: string;
    title: string;
    owner: string;
    fileName: string;
    fileUrl?: string;
    status: "Pending" | "In Progress" | "Done";
  }[];
  checklist: SubmissionChecklistItem[];
  info: {
    advertisementFile?: string;
    advertisementUrl?: string;
    advertisementUploadedBy?: string;
    advertisementUploadedAt?: string;
    tenderLink?: string;
    recordedBy: string;
    tenderType: TenderType;
    responsiblePerson: string;
    lastDateOfPurchase?: string;
    lastDateOfSubmission?: string;
    note?: string;
    attachments: SubmissionAttachment[];
    eligibility?: string;
  };
}

/* ---------- Security ---------- */
export interface TenderSecurity {
  _id: string;
  entity: string;
  clientDescription: string;
  type: SecurityType;
  amount: number;
  currency: Currency;
  dueDate?: string;
  docsStatus: DocsStatus;
  documentUrl?: string;
  createdAt: string;
}

export interface TenderSecurityStats {
  totalPending: number;
  entitiesAffected: number;
  receivableOutstanding: number;
  payableOutstanding: number;
}

/* ---------- Company Docs ---------- */
export interface CompanyDocument {
  _id: string;
  category: CompanyDocCategory;
  title: string;
  reference?: string;
  validity?: string;
  validUntil?: string;
  issuedOn?: string;
  status: CompanyDocStatus;
  action?: "View" | "Replace" | "Renew";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
  docType?: string;
  subtitle?: string;
  chips?: string[];
  createdAt: string;
}

/* ---------- Overview ---------- */
export interface OverviewStat {
  label: string;
  value: string;
  hint?: string;
  highlighted?: boolean;
}

export interface OverviewPipelineStage {
  id: string;
  label: string;
  count: number;
  color: string;
  hint?: string;
}

export interface TenderOverviewData {
  stats: OverviewStat[];
  pipeline: OverviewPipelineStage[];
  stages?: Record<string, number>;
  upcoming?: UpcomingTender[];
  performance?: PerformanceResponse;
  recentActivity?: TenderActivity[];
}

export interface UpcomingTender {
  id: string;
  tenderer: string;
  title: string;
  daysLeft: number;
  value: string;
}

export interface MonthPerformance {
  month: string;
  won: number;
  lost: number;
}

export interface TenderActivity {
  id: string;
  kind:
  | "submitted"
  | "won"
  | "lost"
  | "uploaded"
  | "discussed"
  | "chat"
  | "stage_change";
  tenderer: string;
  message: string;
  timeAgo: string;
}

export interface PerformanceResponse {
  data: MonthPerformance[];
  winRate: number;
}

/* ============================================================
 * OVERVIEW — one combined endpoint
 * ============================================================ */
export const overviewApi = {
  get: () =>
    cachedGet<ApiResponse<TenderOverviewData>>(`${TENDER_BASE}/overview`),

  /* Backwards-compat thin wrappers (now hit the same combined endpoint) */
  upcoming: () =>
    cachedGet<ApiResponse<TenderOverviewData>>(`${TENDER_BASE}/overview`).then(
      (r) => r.data.upcoming ?? [],
    ),

  performance: () =>
    cachedGet<ApiResponse<TenderOverviewData>>(`${TENDER_BASE}/overview`).then(
      (r) => r.data.performance ?? { data: [], winRate: 0 },
    ),

  recentActivity: (_limit = 10) =>
    cachedGet<ApiResponse<TenderOverviewData>>(`${TENDER_BASE}/overview`).then(
      (r) => r.data.recentActivity ?? [],
    ),
};

/* ============================================================
 * TENDERS
 * ============================================================ */
export const tenderApi = {
  list: (params?: {
    stage?: string;
    tenderType?: string;
    search?: string;
    includeDrafts?: boolean;
    page?: number;
    limit?: number;
  }) => cachedGet<ApiResponse<Tender[]>>(`${TENDER_BASE}${qs(params)}`),

  get: (id: string) =>
    cachedGet<ApiResponse<Tender & { docTasks: TenderDocTask[] }>>(
      `${TENDER_BASE}/${id}`,
    ).then((r) => r.data),

  create: (payload: Partial<Tender>) =>
    fetch(`${TENDER_BASE}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<Tender>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  update: (id: string, payload: Partial<Tender>) =>
    fetch(`${TENDER_BASE}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<Tender>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  changeStage: (
    id: string,
    stage: TenderStage,
    note?: string,
    lossReason?: string,
  ) =>
    fetch(`${TENDER_BASE}/${id}/stage`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ stage, note, lossReason }),
    })
      .then(handle<ApiResponse<Tender>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  updateChecklist: (id: string, items: unknown[]) =>
    fetch(`${TENDER_BASE}/${id}/checklist`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    })
      .then(handle<ApiResponse<unknown[]>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  remove: (id: string) =>
    fetch(`${TENDER_BASE}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then((r) => {
        clearGetCache();
        return r;
      }),

  /* ---------- Attachments ---------- */
  uploadAttachment: async (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("token")
        : null;

    const res = await fetch(`${TENDER_BASE}/${id}/attachments`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Upload failed with ${res.status}`);
    }
    clearGetCache();
    return json.data as TenderAttachment;
  },

  deleteAttachment: (id: string, attachmentId: string) =>
    fetch(`${TENDER_BASE}/${id}/attachments/${attachmentId}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then(() => {
        clearGetCache();
        return true;
      }),

  /* ---------- Advertisement ---------- */
  uploadAdvertisement: async (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("token")
        : null;

    const res = await fetch(`${TENDER_BASE}/${id}/advertisement`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Upload failed with ${res.status}`);
    }
    clearGetCache();
    return json.data as AdvertisementInfo;
  },

  deleteAdvertisement: (id: string) =>
    fetch(`${TENDER_BASE}/${id}/advertisement`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then(() => {
        clearGetCache();
        return true;
      }),
};

/* ============================================================
 * DOC TASKS
 * ============================================================ */
export const docTaskApi = {
  add: (
    tenderId: string,
    payload: {
      title: string;
      owner?: string;
      status?: string;
      fileName?: string;
    },
  ) =>
    fetch(`${TENDER_BASE}/${tenderId}/doc-tasks`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<TenderDocTask>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  update: (
    tenderId: string,
    taskId: string,
    payload: Partial<TenderDocTask>,
  ) =>
    fetch(`${TENDER_BASE}/${tenderId}/doc-tasks/${taskId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<TenderDocTask>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  remove: (tenderId: string, taskId: string) =>
    fetch(`${TENDER_BASE}/${tenderId}/doc-tasks/${taskId}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then((r) => {
        clearGetCache();
        return r;
      }),
};

/* ============================================================
 * SUBMISSIONS
 * ============================================================ */
export const submissionApi = {
  list: () =>
    cachedGet<ApiResponse<SubmissionRow[]>>(
      `${TENDER_BASE}/submissions/list`,
    ).then((r) => r.data),

  get: (id: string) =>
    cachedGet<ApiResponse<SubmissionDetail>>(
      `${TENDER_BASE}/submissions/${id}`,
    ).then((r) => r.data),
};

/* ============================================================
 * SECURITY
 * ============================================================ */
export const securityApi = {
  list: (params?: {
    entity?: string;
    type?: string;
    docs?: string;
    page?: number;
    limit?: number;
  }) =>
    cachedGet<ApiResponse<TenderSecurity[]>>(
      `${TENDER_BASE}/security/list${qs(params)}`,
    ),

  stats: () =>
    cachedGet<ApiResponse<TenderSecurityStats>>(
      `${TENDER_BASE}/security/stats`,
    ).then((r) => r.data),

  create: (payload: Partial<TenderSecurity>) =>
    fetch(`${TENDER_BASE}/security`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<TenderSecurity>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  update: (id: string, payload: Partial<TenderSecurity>) =>
    fetch(`${TENDER_BASE}/security/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<TenderSecurity>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  remove: (id: string) =>
    fetch(`${TENDER_BASE}/security/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then((r) => {
        clearGetCache();
        return r;
      }),

  notify: (id: string, payload: { emails: string[]; note?: string }) =>
    fetch(`${TENDER_BASE}/security/${id}/notify`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(
        handle<
          ApiResponse<{
            messageId: string;
            recipients: string[];
            accepted: string[];
            rejected: string[];
          }>
        >,
      )
      .then((r) => r.data),
};

/* ============================================================
 * COMPANY DOCS
 * ============================================================ */
export const companyDocApi = {
  /* ---------- COMBINED: list + counts in one request ---------- */
  bundle: (params?: {
    category?: string;
    sector?: string;
    duration?: string;
    volume?: string;
  }) =>
    cachedGet<
      ApiResponse<{
        list: CompanyDocument[];
        counts: Record<CompanyDocCategory, number>;
      }>
    >(`${TENDER_BASE}/docs/bundle${qs(params)}`).then((r) => r.data),

  /* ---------- Legacy: list only ---------- */
  list: (params?: {
    category?: string;
    sector?: string;
    duration?: string;
    volume?: string;
  }) =>
    cachedGet<ApiResponse<CompanyDocument[]>>(
      `${TENDER_BASE}/docs/list${qs(params)}`,
    ).then((r) => r.data),

  /* ---------- Legacy: counts only ---------- */
  counts: () =>
    cachedGet<ApiResponse<Record<CompanyDocCategory, number>>>(
      `${TENDER_BASE}/docs/counts`,
    ).then((r) => r.data),

  create: (payload: Partial<CompanyDocument> & { validityDate?: string }) =>
    fetch(`${TENDER_BASE}/docs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<CompanyDocument>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  update: (id: string, payload: Partial<CompanyDocument>) =>
    fetch(`${TENDER_BASE}/docs/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<CompanyDocument>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),

  remove: (id: string) =>
    fetch(`${TENDER_BASE}/docs/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then((r) => {
        clearGetCache();
        return r;
      }),

  importToTender: (payload: {
    targetTenderId: string;
    documentIds: string[];
  }) =>
    fetch(`${TENDER_BASE}/docs/import`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<null>>)
      .then((r) => {
        clearGetCache();
        return r;
      }),

  uploadDocFile: async (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token")
        : null;
    const res = await fetch(`${TENDER_BASE}/docs/${id}/file`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Upload failed with ${res.status}`);
    }
    clearGetCache();
    return json.data;
  },

  renewDoc: (
    id: string,
    payload: { validityDate: string; issuedOn?: string },
  ) =>
    fetch(`${TENDER_BASE}/docs/${id}/renew`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<CompanyDocument>>)
      .then((r) => {
        clearGetCache();
        return r.data;
      }),
};

/* ============================================================
 * EXPORTS for manual cache control (optional)
 * ============================================================ */
export const tenderCache = {
  clear: clearGetCache,
};