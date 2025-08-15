import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Dashboard } from "~backend/dashboard/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MousePointer2, Keyboard, Minimize2, Maximize2 } from "lucide-react";

/**
 * DashboardFrame
 * - Control mode (default): overlay aktif → shortcut aplikasi tetap berfungsi walau klik di area dashboard.
 * - Interact mode: overlay dimatikan → bisa berinteraksi penuh dengan Power BI (klik/scroll/filter).
 *
 * Shortcut:
 * - "F" → toggle Interact/Control
 * - "Esc" → keluar dari Interact kembali ke Control
 */
export default function DashboardFrame({
  dashboard,
  isActive,
  className = "",
}: {
  dashboard: Dashboard;
  isActive: boolean;
  className?: string;
}) {
  const [interactMode, setInteractMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // pastikan nilai src aman (fallback ke about:blank)
  const src = useMemo(() => dashboard?.url || "about:blank", [dashboard?.url]);

  // jaga fokus di app saat Control mode (overlay aktif)
  useEffect(() => {
    if (!interactMode) {
      // fokuskan overlay agar event keyboard tetap ke parent
      overlayRef.current?.focus();
    }
  }, [interactMode, dashboard?.id]);

  // keyboard global: F untuk toggle, Esc untuk keluar dari Interact
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // NOTE: saat Interact mode dan iframe terfokus, event mungkin tidak sampai.
      // Karena itu kita sediakan UI tombol di sudut untuk keluar.
      if (e.code === "KeyF") {
        e.preventDefault();
        setInteractMode((v) => !v);
        if (overlayRef.current && !interactMode) {
          // setelah masuk Control (overlay on), arahkan fokus
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
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      aria-live="polite"
    >
      {/* Iframe Power BI */}
      <iframe
        key={dashboard?.id ?? "iframe"}
        title={dashboard?.name ?? "Dashboard"}
        src={src}
        className={`absolute inset-0 w-full h-full border-0 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        allowFullScreen
        // sandbox/allow bisa ditambah sesuai kebutuhan Power BI
      />

      {/* Toggle chip kanan-atas (selalu terlihat di atas iframe) */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
        <Badge
          variant={interactMode ? "secondary" : "default"}
          className="px-2 py-1 text-xs"
          title={interactMode ? "Interact mode (Power BI aktif)" : "Control mode (shortcut aktif)"}
        >
          {interactMode ? (
            <div className="flex items-center gap-1">
              <MousePointer2 className="w-3.5 h-3.5" />
              Interact
            </div>
          ) : (
            //<div className="flex items-center gap-1">
             // <Keyboard className="w-3.5 h-3.5" />
             // Control
            </div>
          )}
        </Badge>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setInteractMode((v) => !v);
            if (!interactMode) {
              // saat masuk Control mode, fokuskan overlay supaya keyboard tetap di app
              requestAnimationFrame(() => overlayRef.current?.focus());
            }
          }}
          title={interactMode ? "Kembali ke Control (Esc)" : "Masuk Interact (F)"}
          className="bg-white/90 backdrop-blur-sm border border-slate-200"
        >
          {interactMode ? (
            <>
              <Minimize2 className="w-4 h-4 mr-2" />
              Control
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 mr-2" />
              Interact
            </>
          )}
        </Button>
      </div>

      {/* Overlay Control mode:
          - Menutup iframe (pointer-events aktif), jadi klik tetap di app.
          - Fokus di overlay supaya keyboard event tetap ke window/app.
      */}
      {!interactMode && (
        <div
          ref={overlayRef}
          tabIndex={0}
          className="absolute inset-0 z-30 outline-none"
          // pointer events aktif agar click tidak menembus iframe
          // tapi kita kasih UX tip & double-click untuk "Interact"
          onDoubleClick={() => setInteractMode(true)}
        >
          {/* Lapisan transparan */}
          <div className="absolute inset-0 bg-transparent" />
          {/* Bantuan kecil kiri-atas */}
          <div className="absolute left-3 top-14 text-xs text-slate-700 bg-white/85 backdrop-blur-sm border border-slate-200 rounded-md px-2 py-1 shadow-sm">
            Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">F</kbd> to Interact
          </div>
        </div>
      )}

      {/* Safety: tombol kecil kiri-atas saat Interact mode (kalau keyboard Esc tak terkirim) */}
      {interactMode && (
        <button
          type="button"
          className="absolute left-3 top-14 z-40 text-xs text-slate-700 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md px-2 py-1 shadow-sm"
          onClick={() => {
            setInteractMode(false);
            requestAnimationFrame(() => overlayRef.current?.focus());
          }}
          title="Kembali ke Control (Esc)"
        >
          Exit Interact
        </button>
      )}
    </div>
  );
}
