// hooks/tender/useCompanyDocBundle.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    companyDocApi,
    type CompanyDocument,
    type CompanyDocCategory,
} from "@/lib/api/tender.api";

interface BundleData {
    list: CompanyDocument[];
    counts: Record<CompanyDocCategory, number>;
}

const EMPTY_COUNTS: Record<CompanyDocCategory, number> = {
    legal: 0,
    profiles: 0,
    experience: 0,
    certificates: 0,
};

/**
 * One call returns the list AND the tab counts.
 * Replaces the old pair of useCompanyDocs + useCompanyDocCounts.
 */
export function useCompanyDocBundle(params?: {
    category?: string;
    sector?: string;
    duration?: string;
    volume?: string;
}) {
    const [list, setList] = useState<CompanyDocument[]>([]);
    const [counts, setCounts] =
        useState<Record<CompanyDocCategory, number>>(EMPTY_COUNTS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mounted = useRef(true);

    const refetch = useCallback(
        async (silent = false) => {
            mounted.current = true;
            if (!silent) setLoading(true);
            setError(null);
            try {
                const data = await companyDocApi.bundle(params);
                if (!mounted.current) return;
                setList(data.list);
                setCounts(data.counts);
            } catch (e) {
                const msg = (e as Error).message || "Failed to load documents";
                if (mounted.current) {
                    setError(msg);
                    if (!silent) toast.error(msg);
                }
            } finally {
                if (mounted.current) setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(params)],
    );

    useEffect(() => {
        mounted.current = true;
        refetch();
        return () => {
            mounted.current = false;
        };
    }, [refetch]);

    return {
        rows: list,
        counts,
        loading,
        error,
        refetch: useCallback(() => refetch(true), [refetch]),
    };
}