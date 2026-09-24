// lib/api/tender.api.ts

/* ============================================================
 * AUTH HELPERS
 * ============================================================ */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token")
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function authHeadersNoJson(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(r: Response): Promise<T> {
  const json = await r.json();
  if (!json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json.data as T;
}

/* ============================================================
 * SHARED TYPES
 * ============================================================ */

export type TenderStage =
  | "potential"
  | "active"
  | "submitted"
  | "lost"
  | "won";

export interface TenderAttachment {
  _id?: string;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string;
}

export interface TenderEligibilityRequirement {
  id: string;
  requirement: string;
  ourRecord: string;
  match: "Meets" | "Gap" | "Partial" | "";
}

export interface TenderChecklistItem {
  id: string;
  label: string;
  checked?: boolean;
  isCustom?: boolean;
  value?: string;
  tone?: "neutral" | "progress" | "warn";
}

export interface TenderOtherParticipant {
  bidder: string;
  value: number;
  isUs?: boolean;
}

export interface TenderStageHistoryEntry {
  from?: string;
  to?: string;
  at?: string;
  by?: string;
  note?: string;
}

export interface Tender {
  _id: string;

  /* Basic */
  tenderer: string;
  title: string;
  description?: string;
  draft?: boolean;
  stage: TenderStage;
  tenderType: "eGP" | "RFQ" | "Hardcopy Ref.";

  /* Metadata */
  tenderLink?: string;
  recordedBy?: string;
  responsiblePerson?: string;
  mode?: string;

  /* Dates */
  lastDateOfPurchase?: string | null;
  lastDateOfSubmission?: string | null;
  submittedAt?: string | null;
  lostAt?: string | null;

  /* Value */
  tentativeBudget?: number;
  bidValue?: number;
  currency?: string;

  /* Security */
  tenderSecurityAmount?: number;
  tenderSecurityValidity?: string | null;
  performanceSecurityAmount?: number;
  performanceSecurityValidity?: string | null;
  securityMode?: string;

  /* Submission */
  submitted?: boolean;
  readiness?: number;
  docStatus?: string;

  /* Advertisement */
  advertisementFile?: string;
  advertisementUrl?: string;
  advertisementUploadedBy?: string;
  advertisementUploadedAt?: string | null;

  /* Notes / Eligibility */
  note?: string;
  eligibility?: string;
  eligibilityRequirements?: TenderEligibilityRequirement[];

  /* Attachments */
  attachments?: TenderAttachment[];

  /* Competitors */
  otherParticipants?: TenderOtherParticipant[];

  /* Checklist */
  checklist?: TenderChecklistItem[];

  /* Loss */
  lossReason?: string;
  lowestCompliantBidder?: string;
  lowestCompliantValue?: number;

  /* Ownership */
  owner?: any;
  departmentId?: string;

  /* Audit */
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;

  /* Stage history */
  stageHistory?: TenderStageHistoryEntry[];
}

/* ============================================================
 * SUBMISSION TYPES
 * ============================================================ */

export interface SubmissionRow {
  id: string;
  tenderer: string;
  mode: string;
  submitted: "Submitted" | "Not yet";
  status: string;
  readiness: number;
}

export interface SubmissionDocTask {
  _id: string;
  title: string;
  owner: string;
  status: string;
  fileName?: string;
  fileUrl?: string;
}

export interface SubmissionDetail {
  id: string;
  tenderer: string;
  title: string;
  deadlineDays: number;
  readiness: number;
  docTasks: SubmissionDocTask[];
  checklist: TenderChecklistItem[];
  info: {
    advertisementFile?: string;
    advertisementUrl?: string;
    advertisementUploadedBy?: string;
    tenderLink?: string;
    recordedBy: string;
    tenderType: "eGP" | "RFQ" | "Hardcopy Ref.";
    responsiblePerson: string;
    lastDateOfPurchase?: string;
    lastDateOfSubmission?: string;
    note?: string;
    attachments: TenderAttachment[];
    eligibility?: string;
  };
}

/* ============================================================
 * SECURITY TYPES
 * ============================================================ */

export interface TenderSecurity {
  _id: string;
  entity: string;
  clientDescription: string;
  type: "BG" | "PG" | "Other";
  amount: number;
  dueDate?: string;
  docsStatus: "Attached" | "Missing";
}

export interface SecurityStats {
  totalPending: number;
  entitiesAffected: number;
  receivableOutstanding: number;
  payableOutstanding: number;
}

/* ============================================================
 * COMPANY DOC TYPES
 * ============================================================ */

export interface CompanyDocument {
  _id: string;
  category: "certificates" | "legal" | "profiles" | "experience";
  title: string;
  description?: string;
  subtitle?: string;
  reference?: string;
  validity?: string;
  status: "Valid" | "Expired" | "Expiring Soon";
  action?: "View" | "Replace" | "Renew";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
  docType?: string;
  chips?: string[];
  validUntil?: string;
  issuedOn?: string;
  createdAt?: string;
}

/* ============================================================
 * TENDER API
 * ============================================================ */

export const tenderApi = {
  /* ---------- List ---------- */
  async list(params?: {
    stage?: string;
    tenderType?: string;
    search?: string;
    includeDrafts?: boolean;
    limit?: number;
  }): Promise<{ data: Tender[] }> {
    const qs = new URLSearchParams();
    if (params?.includeDrafts) qs.set("includeDrafts", "true");
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.stage) qs.set("stage", params.stage);
    if (params?.tenderType) qs.set("tenderType", params.tenderType);
    if (params?.search) qs.set("search", params.search);

    const r = await fetch(`${API_BASE}/tenders?${qs.toString()}`, {
      headers: authHeaders(),
    });
    const data = await handle<Tender[]>(r);
    return { data };
  },

  async get(id: string): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/${id}`, {
      headers: authHeaders(),
    });
    return handle<Tender>(r);
  },

  /* ---------- Create / Update / Delete ---------- */
  async create(body: Partial<Tender>): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<Tender>(r);
  },

  async update(id: string, body: Partial<Tender>): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<Tender>(r);
  },

  async remove(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },

  /* ---------- Stage ---------- */
  async changeStage(
    id: string,
    stage: TenderStage,
    note?: string,
    lossReason?: string,
  ): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/${id}/stage`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ stage, note, lossReason }),
    });
    return handle<Tender>(r);
  },

  /* ---------- Checklist ---------- */
  async updateChecklist(
    id: string,
    items: TenderChecklistItem[],
  ): Promise<TenderChecklistItem[]> {
    const r = await fetch(`${API_BASE}/tenders/${id}/checklist`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ items }),
    });
    return handle<TenderChecklistItem[]>(r);
  },

  /* ---------- Attachments ---------- */
  async uploadAttachment(id: string, file: File): Promise<TenderAttachment> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE}/tenders/${id}/attachments`, {
      method: "POST",
      headers: authHeadersNoJson(),
      body: fd,
    });
    return handle<TenderAttachment>(r);
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    const r = await fetch(
      `${API_BASE}/tenders/${id}/attachments/${attachmentId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    return handle<void>(r);
  },

  /* ---------- Advertisement ---------- */
  async uploadAdvertisement(
    id: string,
    file: File,
  ): Promise<{
    advertisementFile: string;
    advertisementUrl: string;
    advertisementUploadedBy: string;
    advertisementUploadedAt: string;
  }> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE}/tenders/${id}/advertisement`, {
      method: "POST",
      headers: authHeadersNoJson(),
      body: fd,
    });
    return handle(r);
  },

  async deleteAdvertisement(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/${id}/advertisement`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },
};

/* ============================================================
 * SUBMISSION API — used by useSubmissions hook
 * ============================================================ */

export const submissionApi = {
  async list(): Promise<SubmissionRow[]> {
    const r = await fetch(`${API_BASE}/tenders/submissions/list`, {
      headers: authHeaders(),
    });
    return handle<SubmissionRow[]>(r);
  },

  async get(id: string): Promise<SubmissionDetail> {
    const r = await fetch(`${API_BASE}/tenders/submissions/${id}`, {
      headers: authHeaders(),
    });
    return handle<SubmissionDetail>(r);
  },
};

/* ============================================================
 * DOC TASK API — used by SubmissionDetail component
 * ============================================================ */

export const docTaskApi = {
  async add(
    tenderId: string,
    body: {
      title: string;
      owner: string;
      status: string;
      fileName?: string;
    },
  ): Promise<{ _id: string }> {
    const r = await fetch(`${API_BASE}/tenders/${tenderId}/doc-tasks`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<{ _id: string }>(r);
  },

  async update(
    tenderId: string,
    taskId: string,
    body: Partial<{
      title: string;
      owner: string;
      status: string;
      fileName: string;
      fileUrl: string;
      order: number;
    }>,
  ): Promise<any> {
    const r = await fetch(
      `${API_BASE}/tenders/${tenderId}/doc-tasks/${taskId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return handle<any>(r);
  },

  async remove(tenderId: string, taskId: string): Promise<void> {
    const r = await fetch(
      `${API_BASE}/tenders/${tenderId}/doc-tasks/${taskId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    return handle<void>(r);
  },
};

/* ============================================================
 * SECURITY API — used by useSecurity hook + useTenderStats
 * ============================================================ */

export const securityApi = {
  async list(params?: { search?: string }): Promise<TenderSecurity[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);

    const r = await fetch(`${API_BASE}/tenders/security/list?${qs}`, {
      headers: authHeaders(),
    });
    return handle<TenderSecurity[]>(r);
  },

  async stats(): Promise<SecurityStats> {
    const r = await fetch(`${API_BASE}/tenders/security/stats`, {
      headers: authHeaders(),
    });
    return handle<SecurityStats>(r);
  },

  async create(body: Partial<TenderSecurity>): Promise<TenderSecurity> {
    const r = await fetch(`${API_BASE}/tenders/security`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<TenderSecurity>(r);
  },

  async update(
    id: string,
    body: Partial<TenderSecurity>,
  ): Promise<TenderSecurity> {
    const r = await fetch(`${API_BASE}/tenders/security/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<TenderSecurity>(r);
  },

  async remove(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/security/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },

  async notify(
    id: string,
    body?: { message?: string; recipients?: string[] },
  ): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/security/${id}/notify`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body ?? {}),
    });
    return handle<void>(r);
  },
};

/* ============================================================
 * COMPANY DOCS API — used by useCompanyDocs hook
 * ============================================================ */

export const companyDocApi = {
  async list(params?: {
    category?: CompanyDocument["category"];
    search?: string;
  }): Promise<CompanyDocument[]> {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);

    const r = await fetch(`${API_BASE}/tenders/docs/list?${qs}`, {
      headers: authHeaders(),
    });
    return handle<CompanyDocument[]>(r);
  },

  async counts(): Promise<Record<string, number>> {
    const r = await fetch(`${API_BASE}/tenders/docs/counts`, {
      headers: authHeaders(),
    });
    return handle<Record<string, number>>(r);
  },

  async bundle(): Promise<{
    docs: CompanyDocument[];
    counts: Record<string, number>;
  }> {
    const r = await fetch(`${API_BASE}/tenders/docs/bundle`, {
      headers: authHeaders(),
    });
    return handle(r);
  },

  async create(body: Partial<CompanyDocument>): Promise<CompanyDocument> {
    const r = await fetch(`${API_BASE}/tenders/docs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<CompanyDocument>(r);
  },

  async update(
    id: string,
    body: Partial<CompanyDocument>,
  ): Promise<CompanyDocument> {
    const r = await fetch(`${API_BASE}/tenders/docs/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<CompanyDocument>(r);
  },

  async remove(id: string): Promise<void> {
    const r = await fetch(`${API_BASE}/tenders/docs/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handle<void>(r);
  },

  async uploadFile(id: string, file: File): Promise<CompanyDocument> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${API_BASE}/tenders/docs/${id}/file`, {
      method: "POST",
      headers: authHeadersNoJson(),
      body: fd,
    });
    return handle<CompanyDocument>(r);
  },

  async renew(
    id: string,
    body: {
      validUntil?: string;
      issuedOn?: string;
      reference?: string;
      note?: string;
    },
  ): Promise<CompanyDocument> {
    const r = await fetch(`${API_BASE}/tenders/docs/${id}/renew`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<CompanyDocument>(r);
  },

  async importToTender(
    tenderId: string,
    docIds: string[],
  ): Promise<Tender> {
    const r = await fetch(`${API_BASE}/tenders/docs/import`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tenderId, docIds }),
    });
    return handle<Tender>(r);
  },
};