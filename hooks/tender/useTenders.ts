// // // hooks/tender/useTenders.ts
// // "use client";

// // import { useCallback, useEffect, useState } from "react";
// // import toast from "react-hot-toast";
// // import {
// //   tenderApi,
// //   securityApi,
// //   type Tender,
// //   type TenderStage,
// // } from "@/lib/api/tender.api";

// // export function useTenders(params?: {
// //   stage?: string;
// //   tenderType?: string;
// //   search?: string;
// //   includeDrafts?: boolean;
// //   limit?: number;
// // }) {
// //   const [data, setData] = useState<Tender[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);

// //   const refetch = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const res = await tenderApi.list(params);
// //       setData(res.data);
// //     } catch (e) {
// //       const msg = (e as Error).message || "Failed to load tenders";
// //       setError(msg);
// //       toast.error(msg);
// //     } finally {
// //       setLoading(false);
// //     }
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [JSON.stringify(params)]);

// //   useEffect(() => {
// //     refetch();
// //   }, [refetch]);

// //   return { data, loading, error, refetch };
// // }

// // /** Extended group shape — six buckets instead of four */
// // type TenderGroups = Record<TenderStage, Tender[]> & {
// //   drafts: Tender[];
// // };

// // export function useTendersGrouped() {
// //   const [groups, setGroups] = useState<TenderGroups>({
// //     potential: [],
// //     active: [],
// //     submitted: [],
// //     lost: [],
// //     won: [],
// //     drafts: [],
// //   });
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);

// //   const refetch = useCallback(async () => {
// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const [p, a, s, l, w, d] = await Promise.all([
// //         tenderApi.list({ stage: "potential", limit: 200 }),
// //         tenderApi.list({ stage: "active", limit: 200 }),
// //         tenderApi.list({ stage: "submitted", limit: 200 }),
// //         tenderApi.list({ stage: "lost", limit: 200 }),
// //         tenderApi.list({ stage: "won", limit: 200 }),
// //         tenderApi.list({ stage: "potential", includeDrafts: true, limit: 200 }),
// //       ]);

// //       // Filter drafts out of the potential list (server already excludes them,
// //       // but the last call explicitly includes them — split them client-side).
// //       const drafts = d.data.filter((t) => t.draft === true);
// //       const potential = p.data.filter((t) => t.draft !== true);

// //       setGroups({
// //         potential,
// //         active: a.data.filter((t) => t.draft !== true),
// //         submitted: s.data.filter((t) => t.draft !== true),
// //         lost: l.data.filter((t) => t.draft !== true),
// //         won: w.data.filter((t) => t.draft !== true),
// //         drafts,
// //       });
// //     } catch (e) {
// //       const msg = (e as Error).message || "Failed to load tenders";
// //       setError(msg);
// //       toast.error(msg);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     refetch();
// //   }, [refetch]);

// //   return { groups, loading, error, refetch };
// // }

// // export function useTenderStats() {
// //   const { groups, loading, refetch } = useTendersGrouped();

// //   const [securityPending, setSecurityPending] = useState<{
// //     amount: number;
// //     entities: number;
// //   }>({ amount: 0, entities: 0 });

// //   const refetchSecurity = useCallback(async () => {
// //     try {
// //       const s = await securityApi.stats();
// //       setSecurityPending({
// //         amount: s.totalPending ?? 0,
// //         entities: s.entitiesAffected ?? 0,
// //       });
// //     } catch {
// //       setSecurityPending({ amount: 0, entities: 0 });
// //     }
// //   }, []);

// //   useEffect(() => {
// //     refetchSecurity();
// //   }, [refetchSecurity]);

// //   const refetchAll = useCallback(async () => {
// //     await Promise.all([refetch(), refetchSecurity()]);
// //   }, [refetch, refetchSecurity]);

// //   const won = groups.won.length;
// //   const lost = groups.lost.length;
// //   const decided = won + lost;
// //   const winRate = decided === 0 ? 0 : Math.round((won / decided) * 100);

// //   const stats = [
// //     {
// //       label: "Potential (Under Review)",
// //       value: String(groups.potential.length),
// //       hint: "Awaiting go/no-go decision",
// //     },
// //     {
// //       label: "Active Participation",
// //       value: String(groups.active.length),
// //       hint: "Docs in preparation",
// //     },
// //     {
// //       label: "Awaiting Result",
// //       value: String(groups.submitted.length),
// //       hint: "Submitted, pending decision",
// //     },
// //     {
// //       label: "Win Rate (FY26)",
// //       value: `${winRate}%`,
// //       hint: `${won} Won · ${lost} Lost`,
// //     },
// //     {
// //       label: "Tender Security Pending",
// //       value: `৳${securityPending.amount.toLocaleString("en-IN")}`,
// //       hint: `Across ${securityPending.entities} ${
// //         securityPending.entities === 1 ? "entity" : "entities"
// //       }`,
// //       highlighted: true,
// //     },
// //   ];

// //   return { groups, stats, loading, refetch: refetchAll };
// // }



// // hooks/tender/useTenders.ts
// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import toast from "react-hot-toast";
// import {
//   tenderApi,
//   securityApi,
//   type Tender,
//   type TenderStage,
// } from "@/lib/api/tender.api";

// /* ============================================================
//  * Simple param-driven list hook (unchanged API)
//  * ============================================================ */
// export function useTenders(params?: {
//   stage?: string;
//   tenderType?: string;
//   search?: string;
//   includeDrafts?: boolean;
//   limit?: number;
// }) {
//   const [data, setData] = useState<Tender[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const refetch = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await tenderApi.list(params);
//       setData(res.data);
//     } catch (e) {
//       const msg = (e as Error).message || "Failed to load tenders";
//       setError(msg);
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [JSON.stringify(params)]);

//   useEffect(() => {
//     refetch();
//   }, [refetch]);

//   return { data, loading, error, refetch };
// }

// /* ============================================================
//  * Grouped tenders — ONE request, split client-side
//  * ============================================================ */

// type TenderGroups = Record<TenderStage, Tender[]> & {
//   drafts: Tender[];
// };

// const EMPTY_GROUPS: TenderGroups = {
//   potential: [],
//   active: [],
//   submitted: [],
//   lost: [],
//   won: [],
//   drafts: [],
// };

// /* Module-level cache — every mount within 10s reuses the same data */
// let CACHE: { data: TenderGroups; ts: number } | null = null;
// let IN_FLIGHT: Promise<TenderGroups> | null = null;
// const STALE_MS = 10_000;

// async function loadAllTenders(): Promise<TenderGroups> {
//   if (CACHE && Date.now() - CACHE.ts < STALE_MS) return CACHE.data;
//   if (IN_FLIGHT) return IN_FLIGHT;

//   IN_FLIGHT = (async () => {
//     // ONE request, both drafts and non-drafts
//     const res = await tenderApi.list({ includeDrafts: true, limit: 200 });
//     const all = res.data;

//     const next: TenderGroups = {
//       potential: [],
//       active: [],
//       submitted: [],
//       lost: [],
//       won: [],
//       drafts: [],
//     };

//     for (const t of all) {
//       if (t.draft === true) {
//         next.drafts.push(t);
//         continue;
//       }
//       const stage = (t.stage as TenderStage) || "potential";
//       if (next[stage]) next[stage].push(t);
//     }

//     CACHE = { data: next, ts: Date.now() };
//     IN_FLIGHT = null;
//     return next;
//   })();

//   return IN_FLIGHT;
// }

// export function useTendersGrouped() {
//   const [groups, setGroups] = useState<TenderGroups>(
//     CACHE?.data ?? EMPTY_GROUPS,
//   );
//   const [loading, setLoading] = useState(!CACHE);
//   const [error, setError] = useState<string | null>(null);
//   const mounted = useRef(true);

//   const refetch = useCallback(async (force = false) => {
//     mounted.current = true;
//     if (force) CACHE = null;
//     setLoading(!CACHE);
//     setError(null);
//     try {
//       const data = await loadAllTenders();
//       if (!mounted.current) return;
//       setGroups(data);
//     } catch (e) {
//       const msg = (e as Error).message || "Failed to load tenders";
//       if (mounted.current) {
//         setError(msg);
//         toast.error(msg);
//       }
//     } finally {
//       if (mounted.current) setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     mounted.current = true;
//     refetch();
//     return () => {
//       mounted.current = false;
//     };
//   }, [refetch]);

//   return {
//     groups,
//     loading,
//     error,
//     /** Force a fresh fetch, bypassing the cache */
//     refetch: useCallback(() => refetch(true), [refetch]),
//   };
// }

// /* ============================================================
//  * Stats — depends on grouped + security count
//  * ============================================================ */
// export function useTenderStats() {
//   const { groups, loading, refetch } = useTendersGrouped();

//   const [securityPending, setSecurityPending] = useState<{
//     amount: number;
//     entities: number;
//   }>({ amount: 0, entities: 0 });

//   const refetchSecurity = useCallback(async () => {
//     try {
//       const s = await securityApi.stats();
//       setSecurityPending({
//         amount: s.totalPending ?? 0,
//         entities: s.entitiesAffected ?? 0,
//       });
//     } catch {
//       setSecurityPending({ amount: 0, entities: 0 });
//     }
//   }, []);

//   useEffect(() => {
//     refetchSecurity();
//   }, [refetchSecurity]);

//   const refetchAll = useCallback(async () => {
//     await Promise.all([refetch(), refetchSecurity()]);
//   }, [refetch, refetchSecurity]);

//   const won = groups.won.length;
//   const lost = groups.lost.length;
//   const decided = won + lost;
//   const winRate = decided === 0 ? 0 : Math.round((won / decided) * 100);

//   const stats = [
//     {
//       label: "Potential (Under Review)",
//       value: String(groups.potential.length),
//       hint: "Awaiting go/no-go decision",
//     },
//     {
//       label: "Active Participation",
//       value: String(groups.active.length),
//       hint: "Docs in preparation",
//     },
//     {
//       label: "Awaiting Result",
//       value: String(groups.submitted.length),
//       hint: "Submitted, pending decision",
//     },
//     {
//       label: "Win Rate (FY26)",
//       value: `${winRate}%`,
//       hint: `${won} Won · ${lost} Lost`,
//     },
//     {
//       label: "Tender Security Pending",
//       value: `৳${securityPending.amount.toLocaleString("en-IN")}`,
//       hint: `Across ${securityPending.entities} ${securityPending.entities === 1 ? "entity" : "entities"
//         }`,
//       highlighted: true,
//     },
//   ];

//   return { groups, stats, loading, refetch: refetchAll };
// }



// hooks/tender/useTenders.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  tenderApi,
  securityApi,
  type Tender,
  type TenderStage,
} from "@/lib/api/tender.api";

/* ============================================================
 * Simple param-driven list hook
 * ============================================================ */
export function useTenders(params?: {
  stage?: string;
  tenderType?: string;
  search?: string;
  includeDrafts?: boolean;
  limit?: number;
}) {
  const [data, setData] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenderApi.list(params);
      setData(res.data);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load tenders";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/* ============================================================
 * Grouped tenders — ONE request, module-level cache
 * ============================================================ */

type TenderGroups = Record<TenderStage, Tender[]> & {
  drafts: Tender[];
};

const EMPTY_GROUPS: TenderGroups = {
  potential: [],
  active: [],
  submitted: [],
  lost: [],
  won: [],
  drafts: [],
};

let CACHE: { data: TenderGroups; ts: number } | null = null;
let IN_FLIGHT: Promise<TenderGroups> | null = null;
const STALE_MS = 30_000; // 30 seconds — tab switches stay instant

async function loadAllTenders(): Promise<TenderGroups> {
  if (CACHE && Date.now() - CACHE.ts < STALE_MS) return CACHE.data;
  if (IN_FLIGHT) return IN_FLIGHT;

  IN_FLIGHT = (async () => {
    /* ONE call — both drafts + non-drafts */
    const res = await tenderApi.list({ includeDrafts: true, limit: 200 });
    const all = res.data;

    const next: TenderGroups = {
      potential: [],
      active: [],
      submitted: [],
      lost: [],
      won: [],
      drafts: [],
    };

    for (const t of all) {
      if (t.draft === true) {
        next.drafts.push(t);
        continue;
      }
      const stage = (t.stage as TenderStage) || "potential";
      if (next[stage]) next[stage].push(t);
    }

    CACHE = { data: next, ts: Date.now() };
    IN_FLIGHT = null;
    return next;
  })();

  return IN_FLIGHT;
}

export function useTendersGrouped() {
  const [groups, setGroups] = useState<TenderGroups>(
    CACHE?.data ?? EMPTY_GROUPS,
  );
  const [loading, setLoading] = useState(!CACHE);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  /* Internal loader — does NOT flip loading if cache exists */
  const load = useCallback(async (force: boolean) => {
    /* Cache hit and not forcing — use cache, no fetch, no loading change */
    if (!force && CACHE) {
      setGroups(CACHE.data);
      setLoading(false);
      return;
    }

    if (force) CACHE = null;

    /* Only show loading if we genuinely have no data */
    if (!CACHE) setLoading(true);
    setError(null);

    try {
      const data = await loadAllTenders();
      if (!mounted.current) return;
      setGroups(data);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load tenders";
      if (mounted.current) {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    /* First mount: uses cache if present, no flicker on remount */
    load(false);
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return {
    groups,
    loading,
    error,
    /* Mutations call this — forces a fresh fetch */
    refetch: useCallback(() => load(true), [load]),
  };
}

/* ============================================================
 * Stats — grouped + security count
 * ============================================================ */
export function useTenderStats() {
  const { groups, loading, refetch } = useTendersGrouped();

  const [securityPending, setSecurityPending] = useState<{
    amount: number;
    entities: number;
  }>({ amount: 0, entities: 0 });

  const refetchSecurity = useCallback(async () => {
    try {
      const s = await securityApi.stats();
      setSecurityPending({
        amount: s.totalPending ?? 0,
        entities: s.entitiesAffected ?? 0,
      });
    } catch {
      setSecurityPending({ amount: 0, entities: 0 });
    }
  }, []);

  useEffect(() => {
    refetchSecurity();
  }, [refetchSecurity]);

  const refetchAll = useCallback(async () => {
    await Promise.all([refetch(), refetchSecurity()]);
  }, [refetch, refetchSecurity]);

  const won = groups.won.length;
  const lost = groups.lost.length;
  const decided = won + lost;
  const winRate = decided === 0 ? 0 : Math.round((won / decided) * 100);

  const stats = [
    {
      label: "Potential (Under Review)",
      value: String(groups.potential.length),
      hint: "Awaiting go/no-go decision",
    },
    {
      label: "Active Participation",
      value: String(groups.active.length),
      hint: "Docs in preparation",
    },
    {
      label: "Awaiting Result",
      value: String(groups.submitted.length),
      hint: "Submitted, pending decision",
    },
    {
      label: "Win Rate (FY26)",
      value: `${winRate}%`,
      hint: `${won} Won · ${lost} Lost`,
    },
    {
      label: "Tender Security Pending",
      value: `৳${securityPending.amount.toLocaleString("en-IN")}`,
      hint: `Across ${securityPending.entities} ${
        securityPending.entities === 1 ? "entity" : "entities"
      }`,
      highlighted: true,
    },
  ];

  return { groups, stats, loading, refetch: refetchAll };
}