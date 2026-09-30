"use client";

import { useEffect } from "react";
import { describeThrown, reportClientError } from "./monitoring";

/**
 * Mount once in the root layout. Catches what no React error boundary sees — a stray async rejection,
 * an error thrown outside render — and reports it through the hub's own route. Render crashes are
 * reported by the boundaries themselves (`reportClientError` with source "boundary").
 */
export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const d = describeThrown(e.error ?? e.message);
      reportClientError({ source: "window", route: window.location.pathname, ...d });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const d = describeThrown(e.reason);
      reportClientError({ source: "unhandledrejection", route: window.location.pathname, ...d });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
