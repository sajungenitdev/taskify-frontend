// hooks/tender/useSiteDirectory.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  siteDirectoryApi,
  type Category,
  type PopularItem,
  type RelatedPanel,
  type SiteEntry,
  type SiteInfo,
} from "@/lib/api/siteDirectory.api";

/* ---------- Cache ---------- */
let CATEGORIES_CACHE: Category[] | null = null;

const entriesCache = new Map<string, SiteEntry[]>();
const popularCache = new Map<number, PopularItem[]>();
const relatedCache = new Map<string, RelatedPanel>();
const infoCache = new Map<string, SiteInfo>();

export function invalidateSiteDirectoryCache() {
  CATEGORIES_CACHE = null;
  entriesCache.clear();
  popularCache.clear();
  relatedCache.clear();
  infoCache.clear();
}

/* ---------- Hook ---------- */
export function useSiteDirectory() {
  const [categories, setCategories] = useState<Category[]>(
    CATEGORIES_CACHE ?? [],
  );
  const [category, setCategory] = useState<string>("");
  const [entries, setEntries] = useState<SiteEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [page, setPage] = useState(0);
  const [popular, setPopular] = useState<PopularItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularNav, setPopularNav] = useState({
    hasPrev: false,
    hasNext: false,
  });

  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [related, setRelated] = useState<RelatedPanel | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const [info, setInfo] = useState<SiteInfo | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* ---------- Load categories once ---------- */
  useEffect(() => {
    (async () => {
      try {
        if (CATEGORIES_CACHE) {
          setCategories(CATEGORIES_CACHE);
          setCategory(CATEGORIES_CACHE[0]?.id ?? "");
          return;
        }
        const rows = await siteDirectoryApi.categories();
        CATEGORIES_CACHE = rows;
        if (!mounted.current) return;
        setCategories(rows);
        setCategory(rows[0]?.id ?? "");
      } catch (e) {
        toast.error((e as Error).message || "Failed to load sectors");
      }
    })();
  }, []);

  /* ---------- Load entries when category changes ---------- */
  useEffect(() => {
    if (!category) return;
    (async () => {
      const cached = entriesCache.get(category);
      if (cached) {
        setEntries(cached);
        setOpenDetailId(cached[0]?._id ?? null);
        return;
      }
      setLoadingEntries(true);
      try {
        const rows = await siteDirectoryApi.entries(category);
        entriesCache.set(category, rows);
        if (!mounted.current) return;
        setEntries(rows);
        setOpenDetailId(rows[0]?._id ?? null);
      } catch (e) {
        toast.error((e as Error).message || "Failed to load entries");
      } finally {
        if (mounted.current) setLoadingEntries(false);
      }
    })();
  }, [category]);

  /* ---------- Load popular when page changes ---------- */
  useEffect(() => {
    (async () => {
      const cached = popularCache.get(page);
      if (cached) {
        setPopular(cached);
        setPopularNav({
          hasPrev: page > 0,
          hasNext: cached.length > 0,
        });
        return;
      }
      setPopularLoading(true);
      try {
        const res = await siteDirectoryApi.popular(page);
        popularCache.set(page, res.items);
        if (!mounted.current) return;
        setPopular(res.items);
        setPopularNav({ hasPrev: res.hasPrev, hasNext: res.hasNext });
      } catch (e) {
        toast.error((e as Error).message || "Failed to load popular");
      } finally {
        if (mounted.current) setPopularLoading(false);
      }
    })();
  }, [page]);

  /* ---------- Load related panel when openDetailId changes ---------- */
  useEffect(() => {
    if (!openDetailId) {
      setRelated(null);
      return;
    }
    (async () => {
      const cached = relatedCache.get(openDetailId);
      if (cached) {
        setRelated(cached);
        return;
      }
      setRelatedLoading(true);
      try {
        const panel = await siteDirectoryApi.related(openDetailId);
        relatedCache.set(openDetailId, panel);
        if (!mounted.current) return;
        setRelated(panel);
      } catch (e) {
        toast.error((e as Error).message || "Failed to load related");
      } finally {
        if (mounted.current) setRelatedLoading(false);
      }
    })();
  }, [openDetailId]);

  /* ---------- Load info on demand ---------- */
  const loadInfo = useCallback(async (siteId: string) => {
    const cached = infoCache.get(siteId);
    if (cached) {
      setInfo(cached);
      return;
    }
    try {
      const data = await siteDirectoryApi.info(siteId);
      infoCache.set(siteId, data);
      if (mounted.current) setInfo(data);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load info");
    }
  }, []);

  const closeInfo = () => setInfo(null);

  const toggleRow = (id: string) => {
    setOpenDetailId((prev) => (prev === id ? null : id));
  };

  return {
    /* categories / sector */
    categories,
    category,
    setCategory,

    /* entries */
    entries,
    loadingEntries,

    /* popular */
    popular,
    popularLoading,
    popularNav,
    page,
    setPage,

    /* accordion */
    openDetailId,
    toggleRow,

    /* related panel */
    related,
    relatedLoading,

    /* info modal */
    info,
    loadInfo,
    closeInfo,
  };
}