"use client";

import { useCallback, useEffect, useRef } from "react";

const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "development";
const reloadStorageKey = "smartdsp:auto-reload-version";
const versionCheckIntervalMs = 5 * 60 * 1000;

export default function AppVersionRefresh() {
  const checkingRef = useRef(false);

  const checkVersion = useCallback(async () => {
    if (checkingRef.current || document.visibilityState === "hidden") {
      return;
    }

    checkingRef.current = true;

    try {
      const response = await fetch(`/api/version?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { version?: string };
      const serverVersion = payload.version;

      if (!serverVersion || serverVersion === currentVersion) {
        sessionStorage.removeItem(reloadStorageKey);
        return;
      }

      if (sessionStorage.getItem(reloadStorageKey) === serverVersion) {
        return;
      }

      sessionStorage.setItem(reloadStorageKey, serverVersion);
      window.location.reload();
    } catch {
      // Keep the current page usable when the network or version endpoint is unavailable.
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    };

    const handlePageShow = () => {
      void checkVersion();
    };

    void checkVersion();
    window.addEventListener("focus", checkVersion);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(checkVersion, versionCheckIntervalMs);

    return () => {
      window.removeEventListener("focus", checkVersion);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [checkVersion]);

  return null;
}
