"use client";

import { useCallback, useEffect, useRef } from "react";

const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "development";
const reloadStorageKey = "smartdsp:auto-reload-version";
const versionCheckIntervalMs = 5 * 60 * 1000;

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }

  return target instanceof HTMLInputElement
    && !["button", "hidden", "reset", "submit"].includes(target.type);
};

export default function AppVersionRefresh() {
  const checkingRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const pendingVersionRef = useRef<string | null>(null);

  const reloadWithVersion = useCallback((serverVersion: string) => {
    sessionStorage.setItem(reloadStorageKey, serverVersion);
    window.location.reload();
  }, []);

  const applyVersionWhenSafe = useCallback((serverVersion: string) => {
    if (hasUnsavedChangesRef.current) {
      pendingVersionRef.current = serverVersion;
      return;
    }

    reloadWithVersion(serverVersion);
  }, [reloadWithVersion]);

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
        pendingVersionRef.current = null;
        return;
      }

      if (sessionStorage.getItem(reloadStorageKey) === serverVersion) {
        return;
      }

      applyVersionWhenSafe(serverVersion);
    } catch {
      // Keep the current page usable when the network or version endpoint is unavailable.
    } finally {
      checkingRef.current = false;
    }
  }, [applyVersionWhenSafe]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkVersion();
      }
    };

    const handlePageShow = () => {
      void checkVersion();
    };

    const handleEdit = (event: Event) => {
      if (event.isTrusted && isEditableTarget(event.target)) {
        hasUnsavedChangesRef.current = true;
      }
    };

    const handleNavigation = (event: MouseEvent) => {
      const pendingVersion = pendingVersionRef.current;
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a[href]") : null;

      if (!pendingVersion || !(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      const isDifferentPage = destination.origin === window.location.origin
        && destination.pathname !== window.location.pathname;

      if (!isDifferentPage) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      sessionStorage.setItem(reloadStorageKey, pendingVersion);
      window.location.assign(destination.href);
    };

    void checkVersion();
    window.addEventListener("focus", checkVersion);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("input", handleEdit, true);
    document.addEventListener("change", handleEdit, true);
    document.addEventListener("click", handleNavigation, true);
    const intervalId = window.setInterval(checkVersion, versionCheckIntervalMs);

    return () => {
      window.removeEventListener("focus", checkVersion);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("input", handleEdit, true);
      document.removeEventListener("change", handleEdit, true);
      document.removeEventListener("click", handleNavigation, true);
      window.clearInterval(intervalId);
    };
  }, [checkVersion]);

  return null;
}
