"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { PdfPagesPanel, type PdfPageEntry } from "@/components/pixelpress/pdf-pages-panel";
import { PPInput } from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { loadPdfDoc } from "@/lib/pdf-client";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("extract-pages")!;

export function ExtractPagesTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [entries, setEntries] = useState<PdfPageEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rangeText, setRangeText] = useState("");
  const { start, starting } = useStartJob(tool.id);

  useEffect(() => {
    let alive = true;
    (async () => {
      const entry = files[0];
      if (!entry) {
        setEntries([]);
        setSelected(new Set());
        return;
      }
      try {
        const { numPages } = await loadPdfDoc(entry.id, entry.file);
        if (!alive) return;
        setEntries(Array.from({ length: numPages }, (_, i) => ({ key: `p${i}`, index: i, rotation: 0 })));
        setSelected(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not read this PDF.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [files]);

  const selectedIndexNumbers = useMemo(() => {
    return [...selected]
      .map((key) => (entries.find((e) => e.key === key)?.index ?? -1) + 1)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
  }, [selected, entries]);

  const applyRangeText = (text: string) => {
    setRangeText(text);
    const trimmed = text.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/[,;\s]+/).filter(Boolean);
    const next = new Set<string>();
    let invalid = false;
    for (const part of parts) {
      const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      const total = entries.length;
      if (!m) {
        invalid = true;
        continue;
      }
      const start = parseInt(m[1], 10);
      const end = m[2] ? parseInt(m[2], 10) : start;
      if (isNaN(start) || isNaN(end) || start < 1 || end < 1 || start > total || end > total || start > end) {
        invalid = true;
        continue;
      }
      for (let p = start; p <= end; p++) next.add(`p${p - 1}`);
    }
    if (!invalid || next.size > 0) setSelected(next);
  };

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={(next) => {
        setFiles(next.slice(0, 1));
        if (!next.length) {
          setEntries([]);
          setSelected(new Set());
          setRangeText("");
        }
      }}
      canRun={selected.size > 0 && !starting}
      runLabel={starting ? "Starting…" : `Extract ${selected.size || ""} page${selected.size === 1 ? "" : "s"}`}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          { ranges: selectedIndexNumbers.join(",") }
        )
      }
      busyHint={
        selected.size > 0
          ? `Extracting pages ${selectedIndexNumbers[0]}–${selectedIndexNumbers[selectedIndexNumbers.length - 1]} into a new PDF.`
          : "Click pages or type a range like 1-3, 7."
      }
      fileThumb="pdf"
      options={
        <div className="border-2 border-obsidian bg-white p-4 shadow-hard">
          <label className="block">
            <span className="pp-label mb-1.5 block text-obsidian/80">Page ranges</span>
            <PPInput
              value={rangeText}
              onChange={(e) => applyRangeText(e.target.value)}
              placeholder="e.g. 1-3, 5, 8-10"
              inputMode="numeric"
            />
            <span className="mt-1 block text-xs text-obsidian/55">
              {selected.size > 0
                ? `${selected.size} page${selected.size === 1 ? "" : "s"} selected`
                : "Or click page thumbnails to select them."}
            </span>
          </label>
        </div>
      }
      customPanel={
        files.length > 0 && entries.length > 0 ? (
          <PdfPagesPanel
            file={files[0].file}
            entries={entries}
            flags={{ select: true }}
            selected={selected}
            onSelectionChange={(next) => {
              setSelected(next);
              setRangeText(
                [...next]
                  .map((k) => (entries.find((e) => e.key === k)?.index ?? -1) + 1)
                  .sort((a, b) => a - b)
                  .join(",")
              );
            }}
          />
        ) : null
      }
    />
  );
}
