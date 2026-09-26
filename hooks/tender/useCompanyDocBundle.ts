// hooks/tender/useCompanyDocBundle.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    companyDocApi,
    type CompanyDocument,
    type CompanyDocCategory,
} from "@/lib/api/tender.api";

const EMPTY_COUNTS: Record<CompanyDocCategory, number> = {
    legal: 0,
    profiles: 0,
    experience: 0,
    certificates: 0,
};

/* ============================================================
 * MODULE-LEVEL CACHE
 *
 * Keyed by JSON.stringify(params). Survives tab switches and
 * component remounts (across the whole app session) so we don't
 * re-fetch the same category every time the user clicks a tab.
 *
 * TTL: 60s. After that, the next visit triggers a background
 * refresh.
 * ============================================================ */
interface CachedBundle {
    list: CompanyDocument[];
    counts: Record<CompanyDocCategory, number>;
    ts: number;
}

const BUNDLE_CACHE = new Map<string, CachedBundle>();
const BUNDLE_IN_FLIGHT = new Map<
    string,
    Promise<{ list: CompanyDocument[]; counts: Record<CompanyDocCategory, number> }>
>();
const STALE_MS = 60_000;
const FETCH_TIMEOUT_MS = 15_000;

function cacheKey(params?: {
    category?: CompanyDocCategory;
    sector?: string;
    duration?: string;
    volume?: string;
}) {
    return JSON.stringify(params ?? {});
}

function isStale(entry: CachedBundle) {
    return Date.now() - entry.ts > STALE_MS;
}

/** Clear a specific key, or the whole cache. */
export function invalidateBundleCache(params?: {
    category?: CompanyDocCategory;
    sector?: string;
    duration?: string;
    volume?: string;
}) {
    if (params) {
        const k = cacheKey(params);
        BUNDLE_CACHE.delete(k);
        BUNDLE_IN_FLIGHT.delete(k);
    } else {
        BUNDLE_CACHE.clear();
        BUNDLE_IN_FLIGHT.clear();
    }
}

/** Pre-warm a category in the background (call on hover, idle, etc). */
export function prefetchBundle(params?: {
    category?: CompanyDocCategory;
    sector?: string;
    duration?: string;
    volume?: string;
}) {
    const key = cacheKey(params);
    const cached = BUNDLE_CACHE.get(key);
    if (cached && !isStale(cached)) {
        return Promise.resolve({
            list: cached.list,
            counts: cached.counts,
        });
    }
    return fetchBundleIntoCache(params);
}

/* ---- Internal: single fetch, dedupe in-flight, write to cache ---- */
async function fetchBundleIntoCache(params?: {
    category?: CompanyDocCategory;
    sector?: string;
    duration?: string;
    volume?: string;
}) {
    const key = cacheKey(params);
    const existing = BUNDLE_IN_FLIGHT.get(key);
    if (existing) return existing;

    const p = (async () => {
        try {
            /* ✅ Hard timeout — prevents infinite loading when the
               backend hangs or the network stalls. */
            const data: any = await Promise.race([
                companyDocApi.bundle(params),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () =>
                            reject(
                                new Error(
                                    "Request timed out — please try again.",
                                ),
                            ),
                        FETCH_TIMEOUT_MS,
                    ),
                ),
            ]);

            /* ---------- Normalize docs array ---------- */
            let docs: CompanyDocument[] = [];
            if (Array.isArray(data?.list)) docs = data.list;
            else if (Array.isArray(data?.docs)) docs = data.docs;
            else if (Array.isArray(data)) docs = data;
            else if (Array.isArray(data?.data?.list)) docs = data.data.list;
            else if (Array.isArray(data?.data?.docs)) docs = data.data.docs;

            /* ---------- Normalize counts ---------- */
            const rawCounts =
                data?.counts ?? data?.data?.counts ?? null;
            const counts: Record<CompanyDocCategory, number> = {
                ...EMPTY_COUNTS,
                ...(rawCounts && typeof rawCounts === "object"
                    ? rawCounts
                    : {}),
            };

            BUNDLE_CACHE.set(key, {
                list: docs,
                counts,
                ts: Date.now(),
            });

            return { list: docs, counts };
        } finally {
            BUNDLE_IN_FLIGHT.delete(key);
        }
    })();

    BUNDLE_IN_FLIGHT.set(key, p);
    return p;
}

/* ============================================================
 * HOOK
 * ============================================================ */
export function useCompanyDocBundle(params?: {
    category?: CompanyDocCategory;
    sector?: string;
    duration?: string;
    volume?: string;
}) {
    const key = cacheKey(params);

    /* Seed state from cache if we have one (instant paint on tab switch) */
    const [list, setList] = useState<CompanyDocument[]>(() => {
        const c = BUNDLE_CACHE.get(key);
        return c ? c.list : [];
    });
    const [counts, setCounts] =
        useState<Record<CompanyDocCategory, number>>(() => {
            const c = BUNDLE_CACHE.get(key);
            return c ? c.counts : EMPTY_COUNTS;
        });
    const [loading, setLoading] = useState(() => {
        const c = BUNDLE_CACHE.get(key);
        return !c;
    });
    const [error, setError] = useState<string | null>(null);

    const mounted = useRef(true);
    const lastKeyRef = useRef(key);

    const load = useCallback(
        async (opts: { silent?: boolean; force?: boolean } = {}) => {
            const { silent = false, force = false } = opts;

            const cached = BUNDLE_CACHE.get(key);

            /* Fresh cache hit + not forcing → use it, no network */
            if (cached && !force && !isStale(cached)) {
                setList(cached.list);
                setCounts(cached.counts);
                setLoading(false);
                setError(null);
                return;
            }

            /* Show cached (stale) data immediately + refresh in background */
            if (cached) {
                setList(cached.list);
                setCounts(cached.counts);
                setLoading(false);
            } else if (!silent) {
                setLoading(true);
            }

            setError(null);

            try {
                const { list: freshList, counts: freshCounts } =
                    await fetchBundleIntoCache(params);

                if (!mounted.current) return;
                if (lastKeyRef.current !== key) return;

                setList(freshList);
                setCounts(freshCounts);
            } catch (e) {
                const msg =
                    (e as Error).message || "Failed to load documents";
                if (mounted.current && !silent) {
                    setError(msg);
                    toast.error(msg);
                }
            } finally {
                if (mounted.current) setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [key],
    );

    useEffect(() => {
        mounted.current = true;
        lastKeyRef.current = key;

        const cached = BUNDLE_CACHE.get(key);
        if (cached) {
            setList(cached.list);
            setCounts(cached.counts);
            setLoading(false);
        } else {
            setLoading(true);
        }

        load({ silent: false, force: false });

        return () => {
            mounted.current = false;
        };
    }, [key, load]);

    return {
        rows: list,
        counts,
        loading,
        error,
        refetch: useCallback(
            async () => {
                invalidateBundleCache(params);
                await load({ silent: false, force: true });
            },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [key, load],
        ),
        refreshSilently: useCallback(
            () => load({ silent: true, force: true }),
            [load],
        ),
    };
}