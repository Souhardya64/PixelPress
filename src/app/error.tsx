"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { LogoMark } from "@/components/pixelpress/logo";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="bg-pixel-grid flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <div className="pp-pop w-full max-w-md border-2 border-obsidian bg-white p-8 text-center shadow-hard-lg">
        <div className="mx-auto inline-block border-2 border-obsidian bg-paper p-2">
          <LogoMark size={48} />
        </div>
        <p className="mt-6 flex items-center justify-center gap-2">
          <AlertTriangle className="h-6 w-6 text-alert" aria-hidden="true" />
          <span className="pp-heading text-xl">Something went wrong</span>
        </p>
        <p className="mt-2 text-sm text-obsidian/70">
          An unexpected error occurred while rendering this page. Your files are untouched — try
          again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="pp-label border-2 border-obsidian bg-pixel px-5 py-3 shadow-hard transition-transform hover:-translate-y-0.5"
          >
            Try again
          </button>
          <Link href="/" className="pp-label border-2 border-obsidian bg-white px-5 py-3 shadow-hard-sm transition-transform hover:-translate-y-0.5">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
