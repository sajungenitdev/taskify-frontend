// src/lib/api/crm.api.ts
import type {
    ApiResponse,
    Client,
    Contact,
    DealActivity,
    DealStageConfig,
    ForecastRow,
    Lead,
    PipelineSummary,
    Rfq,
} from "@/types/crm/crm.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const CRM_BASE = `${API_BASE}/crm`;

function authHeaders(): HeadersInit {
    if (typeof window === "undefined") {
        return { "Content-Type": "application/json" };
    }
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

// ============================================================
// STAGES
// ============================================================
export const stageApi = {
    list: () =>
        fetch(`${CRM_BASE}/stages`, { headers: authHeaders() })
            .then(handle<ApiResponse<DealStageConfig[]>>)
            .then((r) => r.data),
    upsert: (payload: Partial<DealStageConfig> & { stageKey: string }) =>
        fetch(`${CRM_BASE}/stages`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<DealStageConfig>>)
            .then((r) => r.data),
};

// ============================================================
// CONTACTS
// ============================================================
export const contactApi = {
    list: (params?: { search?: string; tag?: string; owner?: string; page?: number; limit?: number }) =>
        fetch(`${CRM_BASE}/contacts${qs(params)}`, { headers: authHeaders() }).then(
            handle<ApiResponse<Contact[]>>
        ),
    get: (id: string) =>
        fetch(`${CRM_BASE}/contacts/${id}`, { headers: authHeaders() })
            .then(handle<ApiResponse<Contact>>)
            .then((r) => r.data),
    create: (payload: Partial<Contact>) =>
        fetch(`${CRM_BASE}/contacts`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Contact>>)
            .then((r) => r.data),
    update: (id: string, payload: Partial<Contact>) =>
        fetch(`${CRM_BASE}/contacts/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Contact>>)
            .then((r) => r.data),
    remove: (id: string) =>
        fetch(`${CRM_BASE}/contacts/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handle<ApiResponse<null>>),
};

// ============================================================
// LEADS / DEALS
// ============================================================
export const leadApi = {
    list: (params?: {
        stage?: string;
        owner?: string;
        search?: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }) =>
        fetch(`${CRM_BASE}/leads${qs(params)}`, { headers: authHeaders() }).then(
            handle<ApiResponse<Lead[]>>
        ),
    pipeline: () =>
        fetch(`${CRM_BASE}/leads?groupByStage=true&limit=500`, {
            headers: authHeaders(),
        })
            .then(handle<ApiResponse<PipelineSummary>>)
            .then((r) => r.data),
    get: (id: string) =>
        fetch(`${CRM_BASE}/leads/${id}`, { headers: authHeaders() })
            .then(handle<ApiResponse<Lead & { activities: DealActivity[] }>>)
            .then((r) => r.data),
    create: (payload: Partial<Lead>) =>
        fetch(`${CRM_BASE}/leads`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Lead>>)
            .then((r) => r.data),
    update: (id: string, payload: Partial<Lead>) =>
        fetch(`${CRM_BASE}/leads/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Lead>>)
            .then((r) => r.data),
    changeStage: (id: string, stage: string, note?: string, lostReason?: string) =>
        fetch(`${CRM_BASE}/leads/${id}/stage`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ stage, note, lostReason }),
        })
            .then(handle<ApiResponse<Lead>>)
            .then((r) => r.data),
    rescore: (id: string) =>
        fetch(`${CRM_BASE}/leads/${id}/rescore`, {
            method: "POST",
            headers: authHeaders(),
        })
            .then(handle<ApiResponse<{ score: number; scoreBreakdown: { reason: string; points: number }[] }>>)
            .then((r) => r.data),
    convertToProject: (id: string, payload: Record<string, unknown>) =>
        fetch(`${CRM_BASE}/leads/${id}/convert-to-project`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<unknown>>)
            .then((r) => r.data),
    scheduleFollowUp: (
        id: string,
        payload: { title?: string; dueAt: string; notes?: string; priority?: string; assigneeId?: string }
    ) =>
        fetch(`${CRM_BASE}/leads/${id}/schedule-follow-up`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<unknown>>)
            .then((r) => r.data),
    remove: (id: string) =>
        fetch(`${CRM_BASE}/leads/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handle<ApiResponse<null>>),
};

// ============================================================
// ACTIVITIES
// ============================================================
export const activityApi = {
    forLead: (leadId: string, params?: { type?: string; page?: number; limit?: number }) =>
        fetch(`${CRM_BASE}/leads/${leadId}/activities${qs(params)}`, {
            headers: authHeaders(),
        }).then(handle<ApiResponse<DealActivity[]>>),
    create: (leadId: string, payload: Partial<DealActivity>) =>
        fetch(`${CRM_BASE}/leads/${leadId}/activities`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<DealActivity>>)
            .then((r) => r.data),
    update: (id: string, payload: Partial<DealActivity>) =>
        fetch(`${CRM_BASE}/activities/${id}`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<DealActivity>>)
            .then((r) => r.data),
    remove: (id: string) =>
        fetch(`${CRM_BASE}/activities/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handle<ApiResponse<null>>),
    myFeed: (params?: { type?: string; page?: number; limit?: number }) =>
        fetch(`${CRM_BASE}/activities/my-feed${qs(params)}`, {
            headers: authHeaders(),
        }).then(handle<ApiResponse<DealActivity[]>>),
};

// ============================================================
// CLIENTS
// ============================================================
export const clientApi = {
    list: (params?: { sector?: string; stage?: string; search?: string; page?: number; limit?: number }) =>
        fetch(`${CRM_BASE}/clients${qs(params)}`, { headers: authHeaders() }).then(
            handle<ApiResponse<Client[]>>
        ),
    get: (id: string) =>
        fetch(`${CRM_BASE}/clients/${id}`, { headers: authHeaders() })
            .then(
                handle<
                    ApiResponse<Client & { rfqs: Rfq[]; leads: Lead[] }>
                >
            )
            .then((r) => r.data),
    create: (payload: Partial<Client>) =>
        fetch(`${CRM_BASE}/clients`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Client>>)
            .then((r) => r.data),
    update: (id: string, payload: Partial<Client>) =>
        fetch(`${CRM_BASE}/clients/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Client>>)
            .then((r) => r.data),
    logVisit: (id: string, payload: { at?: string; purpose?: string; notes?: string; location?: string }) =>
        fetch(`${CRM_BASE}/clients/${id}/visits`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Client>>)
            .then((r) => r.data),
    remove: (id: string) =>
        fetch(`${CRM_BASE}/clients/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handle<ApiResponse<null>>),
};

// ============================================================
// RFQs
// ============================================================
export const rfqApi = {
    listAll: (params?: { status?: string; page?: number; limit?: number }) =>
        fetch(`${CRM_BASE}/rfqs${qs(params)}`, { headers: authHeaders() }).then(
            handle<ApiResponse<Rfq[]>>
        ),
    forClient: (clientId: string) =>
        fetch(`${CRM_BASE}/clients/${clientId}/rfqs`, { headers: authHeaders() })
            .then(handle<ApiResponse<Rfq[]>>)
            .then((r) => r.data),
    create: (clientId: string, payload: Partial<Rfq>) =>
        fetch(`${CRM_BASE}/clients/${clientId}/rfqs`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Rfq>>)
            .then((r) => r.data),
    update: (id: string, payload: Partial<Rfq>) =>
        fetch(`${CRM_BASE}/rfqs/${id}`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
            .then(handle<ApiResponse<Rfq>>)
            .then((r) => r.data),
    remove: (id: string) =>
        fetch(`${CRM_BASE}/rfqs/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        }).then(handle<ApiResponse<null>>),
};

// ============================================================
// ANALYTICS
// ============================================================
export const analyticsApi = {
    forecast: (params?: { from?: string; to?: string; owner?: string }) =>
        fetch(`${CRM_BASE}/forecast${qs(params)}`, { headers: authHeaders() })
            .then(
                handle<
                    ApiResponse<{ rows: ForecastRow[]; totals: { weighted: number; raw: number; count: number } }>
                >
            )
            .then((r) => r.data),
    leaderboard: (params?: { month?: number; year?: number }) =>
        fetch(`${CRM_BASE}/leaderboard${qs(params)}`, { headers: authHeaders() })
            .then(
                handle<
                    ApiResponse<{
                        month: number;
                        year: number;
                        rows: {
                            userId: string;
                            fullName: string;
                            email: string;
                            wonRevenue: number;
                            wonCount: number;
                            activities: number;
                        }[];
                    }>
                >
            )
            .then((r) => r.data),
    pipelineSummary: () =>
        fetch(`${CRM_BASE}/pipeline/summary`, { headers: authHeaders() })
            .then(
                handle<
                    ApiResponse<{
                        byStage: { _id: string; count: number; raw: number; weighted: number }[];
                        totals: { raw: number; weighted: number; count: number };
                    }>
                >
            )
            .then((r) => r.data),
    dashboardStats: () =>
        fetch(`${CRM_BASE}/dashboard/stats`, { headers: authHeaders() })
            .then(handle<ApiResponse<Record<string, unknown>>>)
            .then((r) => r.data),
};