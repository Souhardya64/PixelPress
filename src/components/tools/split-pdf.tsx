"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { PdfPagesPanel, type PdfPageEntry } from "@/components/pixelpress/pdf-pages-panel";
import { Field, OptionSection, PPInput, SegmentedControl } from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { loadPdfDoc } from "@/lib/pdf-client";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("split-pdf")!;

export function SplitPdfTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [entries, setEntries] = useState<PdfPageEntry[]>([]);
  const [mode, setMode] = useState<"ranges" | "interval" | "single">("ranges");
  const [ranges, setRanges] = useState("1-3, 4-6");
  const [interval, setIntervalValue] = useState(2);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const { start, starting } = useStartJob(tool.id);

  useEffect(() => {
    let alive = true;
    (async () => {
      const entry = files[0];
      if (!entry) {
        setEntries([]);
        return;
      }
      try {
        const { numPages } = await loadPdfDoc(entry.id, entry.file);
        if (!alive) return;
        setEntries(Array.from({ length: numPages }, (_, i) => ({ key: `p${i}`, index: i, rotation: 0 })));
        if (!alive) return;
        setRanges(`1-${Math.min(3, numPages)}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not read this PDF.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [files]);

  useEffect(() => {
    if (mode !== "ranges" || !ranges.trim() || entries.length === 0) {
      setRangeError(null);
      return;
    }
    const parts = ranges.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    let valid = parts.length > 0;
    let covered = 0;
    for (const part of parts) {
      const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!m) {
        valid = false;
        break;
      }
      const start = parseInt(m[1], 10);
      const end = m[2] ? parseInt(m[2], 10) : start;
      if (start < 1 || end < 1 || start > entries.length || end > entries.length || start > end) {
        valid = false;
        break;
      }
      covered += end - start + 1;
    }
    setRangeError(valid ? null : `Pages must be between 1 and ${entries.length}, ranges must ascend (e.g. 1-3).`);
    if (valid && covered < entries.length) {
      setRangeError(null);
    }
  }, [ranges, mode, entries.length]);

  const outputCount = (() => {
    if (entries.length === 0) return 0;
    if (mode === "single") return entries.length;
    if (mode === "interval") return Math.ceil(entries.length / Math.max(1, interval));
    const parts = ranges.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    return parts.length;
  })();

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={(next) => {
        setFiles(next.slice(0, 1));
        if (!next.length) setEntries([]);
      }}
      canRun={entries.length > 0 && !rangeError && !starting && (mode !== "ranges" || outputCount > 0)}
      runLabel={starting ? "Starting…" : tool.action}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          { mode, ranges, interval }
        )
      }
      busyHint={
        outputCount > 0
          ? `This will produce ${outputCount} PDF file${outputCount === 1 ? "" : "s"}. Download them individually or as one ZIP.`
          : undefined
      }
      fileThumb="pdf"
      options={
        <OptionSection title="Split mode">
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: "ranges", label: "Custom ranges" },
              { value: "interval", label: "Fixed interval" },
              { value: "single", label: "Every page" },
            ]}
          />
          {mode === "ranges" && (
            <Field label="Ranges — one output PDF per range" hint="Comma separated, e.g. 1-3, 4-6, 7-12. Overlaps are allowed.">
              <PPInput value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 4-6" inputMode="numeric" />
            </Field>
          )}
          {mode === "interval" && (
            <Field label="Split every N pages" hint={`Produces ${Math.ceil(entries.length / Math.max(1, interval))} PDFs of up to ${interval} pages.`}>
              <PPInput
                type="number"
                min={1}
                max={Math.max(1, entries.length)}
                value={interval}
                onChange={(e) => setIntervalValue(Math.max(1, Math.min(entries.length || 1, Number(e.target.value) || 1)))}
              />
            </Field>
          )}
          {mode === "single" && (
            <p className="text-xs text-obsidian/70">
              Each page becomes its own PDF — {entries.length} file{entries.length === 1 ? "" : "s"} in total.
            </p>
          )}
          {rangeError && (
            <p role="alert" className="border-2 border-obsidian bg-alert/10 px-3 py-2 text-sm font-medium">
              {rangeError}
            </p>
          )}
        </OptionSection>
      }
      customPanel={
        files.length > 0 && entries.length > 0 ? (
          <PdfPagesPanel file={files[0].file} entries={entries} tileSize={120} />
        ) : null
      }
    />
  );
}
