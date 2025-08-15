import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Dashboard } from "~backend/dashboard/types";

export default function DashboardFrame({
  dashboard,
  isActive,
  className = "",
}: {
  dashboard: Dashboard;
  isActive: boolean;
  className?: string;
}) {
  // false = Control (overlay aktif, shortcut aplikasi jalan)
  // true  = Interact (overlay mati, bisa klik di Power BI)
  const [interactMode, setInteractMode] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const src = useMemo(() => dashboard?.url || "about:blank", [dashboard?.url]);

  // Saat kembali ke Control mode, fokuskan overlay supaya keyboard ke app
  useEffect(() => {
    if (!interactMode) {
      requestAnimationFrame(() => overlayRef.current?.focus());
    }
  }, [interactMode, dashboard?.id]);

  // Shortcut global: F toggle, Esc keluar dari Interact
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyF") {
        e.preventDefault();
        setInteractMode((v) => !v);
        if (overlayRef.current && interactMode) {
          // akan masuk ke Control → fokuskan overlay
          requestAnimationFrame(() => overlayRef.current?.focus());
        }
      } else if (e.code === "Escape") {
        if (interactMode) {
          e.preventDefault();
          setInteractMode(false);
          requestAnimationFrame(() => overlayRef.current?.focus());
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactMode]);

  return (
    <div className={`relative w-full h-full ${className}`} aria-live="polite">
      {/* Iframe Power BI */}
      <iframe
        key={dashboard?.id ?? "iframe"}
        title={dashboard?.name ?? "Dashboard"}
        src={src}
        className={`absolute inset-0 w-full h-full border-0 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        allowFullScreen
      />

      {/* CONTROL MODE OVERLAY (tanpa badge/hint) */}
      {!interactMode && (
        <div
          ref={overlayRef}
          tabIndex={0}
          className="absolute inset-0 z-30 outline-none"
          // double-click untuk masuk Interact (opsional UX tanpa badge)
          onDoubleClick={() => setInteractMode(true)}
        >
          {/* lapisan transparan, sengaja kosong tanpa UI */}
          <div className="absolute inset-0 bg-transparent" />
        </div>
      )}
    </div>
  );
}
