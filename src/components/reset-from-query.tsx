"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";

export function ResetFromQuery() {
  const pathname = usePathname();
  const resetAll = useAppStore((s) => s.resetAll);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") !== "1") return;

    resetAll();
    localStorage.removeItem("uni-match-sg-store");

    const next = new URLSearchParams(window.location.search);
    next.delete("reset");
    const query = next.toString();
    const cleanUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState({}, "", cleanUrl);
  }, [pathname, resetAll]);

  return null;
}
