"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { Field, PPInput } from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { getNumPagesCached, loadPdfDoc } from "@/lib/pdf-client";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("merge-pdf")!;

export function MergePdfTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [pageCounts, setPageCounts] = useState<Record<string, number | "loading" | "error">>({});
  const [outputName, setOutputName] = useState("pixelpress-merged");
  const [error, setError] = useState<string | null>(null);
  const { start, starting } = useStartJob(tool.id);

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const entry of files) {
        const sig = `${entry.file.name}:${entry.file.size}`;
        if (pageCounts[sig] !== undefined) continue;
        const cached = getNumPagesCached(entry.id);
        if (cached !== undefined) {
          setPageCounts((p) => ({ ...p, [sig]: cached }));
          continue;
        }
        setPageCounts((p) => ({ ...p, [sig]: "loading" }));
        try {
          const { numPages } = await loadPdfDoc(entry.id, entry.file);
          if (!alive) return;
          setPageCounts((p) => ({ ...p, [sig]: numPages }));
        } catch (err) {
          if (!alive) return;
          setPageCounts((p) => ({ ...p, [sig]: "error" }));
          toast.error(err instanceof Error ? err.message : "Could not read a PDF.");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [files]);

  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    setFiles(next);
  };

  const allCountsKnown = files.length > 0 && files.every((f) => {
    const c = pageCounts[`${f.file.name}:${f.file.size}`];
    return typeof c === "number";
  });
  const totalPages = files.reduce((s, f) => s + ((pageCounts[`${f.file.name}:${f.file.size}`] as number) ?? 0), 0);

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={(next) => {
        setFiles(next);
        if (next.length === 0) setError(null);
      }}
      canRun={allCountsKnown && files.length >= 2 && !starting}
      runLabel={starting ? "Starting…" : tool.action}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          { outputName }
        )
      }
      busyHint={
        error
          ? error
          : allCountsKnown
            ? `Merging ${files.length} PDFs into one document with ${totalPages} pages.`
            : "Reading PDF information…"
      }
      options={
        <div className="border-2 border-obsidian bg-white p-4 shadow-hard">
          <Field label="Output file name" hint="The .pdf extension is added automatically.">
            <PPInput
              value={outputName}
              onChange={(e) => setOutputName(e.target.value.replace(/[\\/:*?"<>|]/g, "").slice(0, 60) || "pixelpress-merged")}
              maxLength={60}
            />
          </Field>
        </div>
      }
      customPanel={
        files.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {files.map((entry, i) => {
              const sig = `${entry.file.name}:${entry.file.size}`;
              const count = pageCounts[sig];
              return (
                <li key={entry.id} className="flex items-center gap-3 border-2 border-obsidian bg-white px-3 py-2 shadow-hard-sm">
                  <span className="pp-label w-7 shrink-0 text-center text-obsidian/50">{i + 1}</span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-obsidian bg-paper">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{entry.file.name}</span>
                    <span className="pp-label text-obsidian/50">
                      {count === "loading" ? (
                        <Loader2 className="inline h-3 w-3 animate-spin" />
                      ) : count === "error" ? (
                        <span className="text-alert">unreadable</span>
                      ) : (
                        `${count} pages`
                      )}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="flex h-7 w-7 items-center justify-center border-2 border-obsidian bg-white disabled:opacity-30 hover:bg-pixel/40">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Move down" disabled={i === files.length - 1} onClick={() => move(i, 1)} className="flex h-7 w-7 items-center justify-center border-2 border-obsidian bg-white disabled:opacity-30 hover:bg-pixel/40">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.file.name}`}
                    onClick={() => setFiles(files.filter((f) => f.id !== entry.id))}
                    className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-obsidian bg-white hover:bg-alert hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null
      }
    />
  );
}
