// components/BackendWarmup.tsx
"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget ping to /health as soon as the app loads.
 * Wakes up a sleeping backend (Render free tier) before the user
 * navigates to a page that needs data.
 */
export default function BackendWarmup() {
  useEffect(() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
    const origin = apiBase.replace(/\/api\/v1\/?$/, "");

    /* Ignore errors — this is a best-effort warmup */
    fetch(`${origin}/health`, { method: "GET", mode: "cors" }).catch(() => {});

    /* Optional: ping every 5 minutes while the tab is open.
       Keeps the backend warm for long-lived sessions. */
    const interval = setInterval(() => {
      fetch(`${origin}/health`, { method: "GET", mode: "cors" }).catch(
        () => {},
      );
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}