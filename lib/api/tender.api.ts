// lib/api/tender.api.ts

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const TENDER_BASE = `${API_BASE}/tenders`;

/* ---------- Auth header ---------- */
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

/* ---------- Response envelope ---------- */
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
  performanceSecurityAmount?: number;
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

/* ---------- Submission Detail (matches new backend shape) ---------- */
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
  /** Pill display text — e.g. "N/A", "In progress", "6 days remaining" */
  value?: string;
  /** Pill color */
  tone?: "neutral" | "progress" | "warn";
  /* Legacy fields — used by the manage page's stored checklist */
  checked?: boolean;
  isCustom?: boolean;
}

export interface SubmissionDetail {
  id: string;
  tenderer: string;
  title: string;
  deadlineDays: number;
  readiness: number;
  docTasks: {
    id: string;
    title: string;
    owner: string;
    fileName: string;
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
  status: CompanyDocStatus;
  action?: "View" | "Replace";
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
  kind: "submitted" | "won" | "lost" | "uploaded" | "discussed";
  tenderer: string;
  message: string;
  timeAgo: string;
}

export interface PerformanceResponse {
  data: MonthPerformance[];
  winRate: number;
}

/* ============================================================
 * OVERVIEW
 * ============================================================ */
export const overviewApi = {
  get: () =>
    fetch(`${TENDER_BASE}/overview`, { headers: authHeaders() })
      .then(handle<ApiResponse<TenderOverviewData>>)
      .then((r) => r.data),

  upcoming: () =>
    fetch(`${TENDER_BASE}/overview/upcoming`, { headers: authHeaders() })
      .then(handle<ApiResponse<UpcomingTender[]>>)
      .then((r) => r.data),

  performance: () =>
    fetch(`${TENDER_BASE}/overview/performance`, { headers: authHeaders() })
      .then(handle<ApiResponse<PerformanceResponse>>)
      .then((r) => r.data),

  recentActivity: (limit = 10) =>
    fetch(`${TENDER_BASE}/overview/recent-activity?limit=${limit}`, {
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<TenderActivity[]>>)
      .then((r) => r.data),
};

/* ============================================================
 * TENDERS
 * ============================================================ */
export const tenderApi = {
  list: (params?: {
    stage?: string;
    tenderType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    fetch(`${TENDER_BASE}${qs(params)}`, { headers: authHeaders() }).then(
      handle<ApiResponse<Tender[]>>,
    ),

  get: (id: string) =>
    fetch(`${TENDER_BASE}/${id}`, { headers: authHeaders() })
      .then(handle<ApiResponse<Tender & { docTasks: TenderDocTask[] }>>)
      .then((r) => r.data),

  create: (payload: Partial<Tender>) =>
    fetch(`${TENDER_BASE}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<Tender>>)
      .then((r) => r.data),

  update: (id: string, payload: Partial<Tender>) =>
    fetch(`${TENDER_BASE}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<Tender>>)
      .then((r) => r.data),

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
      .then((r) => r.data),

  updateChecklist: (id: string, items: unknown[]) =>
    fetch(`${TENDER_BASE}/${id}/checklist`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    })
      .then(handle<ApiResponse<unknown[]>>)
      .then((r) => r.data),

  remove: (id: string) =>
    fetch(`${TENDER_BASE}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle<ApiResponse<null>>),

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
    return json.data as TenderAttachment;
  },

  deleteAttachment: (id: string, attachmentId: string) =>
    fetch(`${TENDER_BASE}/${id}/attachments/${attachmentId}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then(() => true),

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
    return json.data as AdvertisementInfo;
  },

  deleteAdvertisement: (id: string) =>
    fetch(`${TENDER_BASE}/${id}/advertisement`, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<null>>)
      .then(() => true),
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
      .then((r) => r.data),

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
      .then((r) => r.data),

  remove: (tenderId: string, taskId: string) =>
    fetch(`${TENDER_BASE}/${tenderId}/doc-tasks/${taskId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle<ApiResponse<null>>),
};

/* ============================================================
 * SUBMISSIONS
 * ============================================================ */
export const submissionApi = {
  list: () =>
    fetch(`${TENDER_BASE}/submissions/list`, { headers: authHeaders() })
      .then(handle<ApiResponse<SubmissionRow[]>>)
      .then((r) => r.data),

  get: (id: string) =>
    fetch(`${TENDER_BASE}/submissions/${id}`, { headers: authHeaders() })
      .then(handle<ApiResponse<SubmissionDetail>>)
      .then((r) => r.data),
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
    fetch(`${TENDER_BASE}/security/list${qs(params)}`, {
      headers: authHeaders(),
    }).then(handle<ApiResponse<TenderSecurity[]>>),

  stats: () =>
    fetch(`${TENDER_BASE}/security/stats`, { headers: authHeaders() })
      .then(handle<ApiResponse<TenderSecurityStats>>)
      .then((r) => r.data),

  create: (payload: Partial<TenderSecurity>) =>
    fetch(`${TENDER_BASE}/security`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<TenderSecurity>>)
      .then((r) => r.data),

  update: (id: string, payload: Partial<TenderSecurity>) =>
    fetch(`${TENDER_BASE}/security/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<TenderSecurity>>)
      .then((r) => r.data),

  remove: (id: string) =>
    fetch(`${TENDER_BASE}/security/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle<ApiResponse<null>>),
};

/* ============================================================
 * COMPANY DOCS
 * ============================================================ */
export const companyDocApi = {
  list: (params?: {
    category?: string;
    sector?: string;
    duration?: string;
    volume?: string;
  }) =>
    fetch(`${TENDER_BASE}/docs/list${qs(params)}`, {
      headers: authHeaders(),
    })
      .then(handle<ApiResponse<CompanyDocument[]>>)
      .then((r) => r.data),

  counts: () =>
    fetch(`${TENDER_BASE}/docs/counts`, { headers: authHeaders() })
      .then(handle<ApiResponse<Record<CompanyDocCategory, number>>>)
      .then((r) => r.data),

  create: (payload: Partial<CompanyDocument>) =>
    fetch(`${TENDER_BASE}/docs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<CompanyDocument>>)
      .then((r) => r.data),

  update: (id: string, payload: Partial<CompanyDocument>) =>
    fetch(`${TENDER_BASE}/docs/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
      .then(handle<ApiResponse<CompanyDocument>>)
      .then((r) => r.data),

  remove: (id: string) =>
    fetch(`${TENDER_BASE}/docs/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handle<ApiResponse<null>>),

  importToTender: (payload: {
    targetTenderId: string;
    documentIds: string[];
  }) =>
    fetch(`${TENDER_BASE}/docs/import`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }).then(handle<ApiResponse<null>>),

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
    return json.data;
  },
};