"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useTransition } from "react";
import { setVehicleDocRotationAction } from "@/app/(app)/fahrzeuge/actions";

export function FahrzeugscheinViewer({
  url,
  rotation,
  vehicleId,
}: {
  url: string;
  rotation: number;
  vehicleId: string;
}) {
  const [open, setOpen] = useState(false);
  const [rot, setRot] = useState(((rotation % 360) + 360) % 360);
  const [, save] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const rotate = (delta: number) => {
    const next = (((rot + delta) % 360) + 360) % 360;
    setRot(next);
    save(async () => {
      await setVehicleDocRotationAction(vehicleId, next);
    });
  };

  const isSide = rot % 180 !== 0;

  return (
    <div className="p-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Zum Vergrößern tippen"
        className="w-full h-[290px] flex items-center justify-center cursor-zoom-in rounded-lg border border-[#e5e5e7] bg-[#fafafc] overflow-hidden hover:border-[#0071e3]"
      >
        <img
          src={url}
          alt="Fahrzeugschein"
          style={{ transform: `rotate(${rot}deg)` }}
          className="max-w-[240px] max-h-[240px] object-contain"
        />
      </button>
      <div className="text-[12px] text-[#86868b] mt-2">Tippen zum Vergrößern und Drehen</div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col anim-fadein"
          onClick={() => setOpen(false)}
        >
          {/* Werkzeugleiste */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => rotate(-90)}
                title="Nach links drehen"
                className="h-10 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-[14px] font-semibold flex items-center gap-1.5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Links
              </button>
              <button
                type="button"
                onClick={() => rotate(90)}
                title="Nach rechts drehen"
                className="h-10 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-[14px] font-semibold flex items-center gap-1.5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                </svg>
                Rechts
              </button>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-[14px] font-semibold flex items-center"
              >
                Original öffnen
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Schließen"
                className="w-10 h-10 rounded-lg bg-white/15 hover:bg-white/25 text-[22px] leading-none flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>

          {/* Bild */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden px-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={url}
              alt="Fahrzeugschein groß"
              style={{
                transform: `rotate(${rot}deg)`,
                maxWidth: isSide ? "84vh" : "94vw",
                maxHeight: isSide ? "94vw" : "84vh",
              }}
              className="object-contain select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
