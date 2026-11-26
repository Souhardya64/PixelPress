"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { OptionSection } from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { getNumPagesCached, loadPdfDoc } from "@/lib/pdf-client";
import { getToolBySlug } from "@/lib/tools";
import { cn } from "@/lib/utils";

const tool = getToolBySlug("compress-pdf")!;

const LEVELS = [
  {
    id: "light",
    name: "Light",
    detail: "Lossless optimisation. Rewrites the PDF structure more efficiently — text stays sharp and selectable.",
    note: "Saves 0–30% on typical files.",
  },
  {
    id: "balanced",
    name: "Balanced",
    detail: "Rasterises pages to 144 DPI JPEG images. Great for sharing and email. Text is no longer selectable.",
    note: "Saves 40–80% on image-heavy PDFs.",
  },
  {
    id: "extreme",
    name: "Extreme",
    detail: "Rasterises pages to 96 DPI JPEG images. Smallest size, lower fidelity. Text is no longer selectable.",
    note: "Saves 60–90%, visibly softer pages.",
  },
] as const;

export function CompressPdfTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [pageCount, setPageCount] = useState<number | "loading" | "error" | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("balanced");
  const { start, starting } = useStartJob(tool.id);

  useEffect(() => {
    let alive = true;
    (async () => {
      const entry = files[0];
      if (!entry) {
        setPageCount(null);
        return;
      }
      const cached = getNumPagesCached(entry.id);
      if (cached !== undefined) {
        setPageCount(cached);
        return;
      }
      setPageCount("loading");
      try {
        const { numPages } = await loadPdfDoc(entry.id, entry.file);
        if (!alive) return;
        setPageCount(numPages);
      } catch (err) {
        if (!alive) return;
        setPageCount("error");
        toast.error(err instanceof Error ? err.message : "Could not read this PDF.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [files]);

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={(next) => {
        setFiles(next.slice(0, 1));
        setPageCount(next.length ? "loading" : null);
      }}
      canRun={files.length > 0 && pageCount !== "loading" && pageCount !== "error" && !starting}
      runLabel={starting ? "Starting…" : tool.action}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          { level }
        )
      }
      busyHint={
        pageCount === "loading"
          ? "Reading PDF information…"
          : pageCount === "error"
            ? "This file can't be read — remove it and try a different PDF."
            : typeof pageCount === "number"
              ? `This document has ${pageCount} pages. Pick a compression level below.`
              : undefined
      }
      fileThumb="pdf"
      inputError={
        pageCount === "error"
          ? "This PDF could not be read — it may be corrupted, encrypted or not a real PDF. Remove it and try another file."
          : null
      }
      options={
        <OptionSection title="Compression level">
          <div className="grid gap-3 sm:grid-cols-3">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={level === l.id}
                onClick={() => setLevel(l.id)}
                className={cn(
                  "border-2 border-obsidian p-3 text-left transition-all",
                  level === l.id ? "bg-pixel shadow-hard" : "bg-white shadow-hard-sm hover:bg-pixel/20"
                )}
              >
                <span className="pp-heading block text-base">{l.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-obsidian/70">{l.detail}</span>
                <span className="pp-label mt-2 block text-obsidian/50">{l.note}</span>
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-obsidian/60">
            If a PDF is already fully compressed, PixelPress tells you instead of pretending — the original file is
            returned unchanged with 0% reduction.
          </p>
        </OptionSection>
      }
    />
  );
}
