// lib/api/siteDirectory.api.ts

export type CategoryId = string; // no longer a fixed union

export interface Category {
  id: string;
  label: string;
}

export interface SiteEntry {
  _id: string;
  name: string;
  tenderCount: number;
  portalUrl: string;
}

export interface PopularItem {
  _id: string;
  short: string;
  name: string;
  subtitle: string;
  color: string;
  portalUrl?: string;
  detailId?: string;
  linkLabel?: string;
}

export interface RelatedRow {
  tender: string;
  stage: "Submitted" | "Active" | "Potential" | string;
  value: string;
  status: string;
}

export type RelatedPanel =
  | { kind: "table"; title: string; rows: RelatedRow[] }
  | { kind: "empty"; title: string; message: string };

export interface SiteInfo {
  title: string;
  rows: { label: string; value: string }[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

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

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  const json = await r.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data as T;
}

export const siteDirectoryApi = {
  categories: () =>
    getJSON<Category[]>("/tenders/site-directory/sectors"),

  entries: (categoryId: string) =>
    getJSON<SiteEntry[]>(
      `/tenders/site-directory/entries?category=${encodeURIComponent(categoryId)}`,
    ),

  popular: (page: number) =>
    getJSON<{ items: PopularItem[]; hasPrev: boolean; hasNext: boolean }>(
      `/tenders/site-directory/popular?page=${page}`,
    ),

  related: (siteId: string) =>
    getJSON<RelatedPanel>(
      `/tenders/site-directory/related/${encodeURIComponent(siteId)}`,
    ),

  info: (siteId: string) =>
    getJSON<SiteInfo>(
      `/tenders/site-directory/info/${encodeURIComponent(siteId)}`,
    ),
};