"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";

const CELLS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

export function LoadingScreen() {
  const [phase, setPhase] = useState<"show" | "hide" | "gone">("show");

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let goneTimer: ReturnType<typeof setTimeout>;

    const minDelay = new Promise((r) => setTimeout(r, 900));
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    const cap = new Promise<void>((r) => setTimeout(r, 2200));

    Promise.race([Promise.all([minDelay, loaded]), cap]).then(() => {
      setPhase("hide");
      hideTimer = setTimeout(() => {
        setPhase("gone");
        document.body.style.removeProperty("overflow");
      }, 380);
    });

    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(goneTimer);
      document.body.style.removeProperty("overflow");
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper transition-opacity duration-300 ${
        phase === "hide" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        <Logo height={64} priority />
        <div className="mt-8 grid grid-cols-8 gap-1.5" aria-hidden="true">
          {CELLS.map((i) => (
            <span
              key={i}
              className="pp-blink block h-2.5 w-2.5 border border-obsidian/20 bg-obsidian"
              style={{ animationDelay: `${(i % 8) * 90 + Math.floor(i / 8) * 40}ms`, animationDuration: "0.9s" }}
            />
          ))}
        </div>
        <div className="mt-6 h-3 w-56 overflow-hidden border-2 border-obsidian bg-white">
          <div className="pixel-fill h-full w-1/3 animate-[pp-loader-slide_1.1s_ease-in-out_infinite] bg-pixel" />
        </div>
        <p className="pp-label mt-4 text-center text-obsidian/60">Loading your local toolbox</p>
      </div>
    </div>
  );
}
