"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { PdfPagesPanel, type PdfPageEntry } from "@/components/pixelpress/pdf-pages-panel";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { loadPdfDoc } from "@/lib/pdf-client";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("organise-pdf")!;

export function OrganisePdfTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [entries, setEntries] = useState<PdfPageEntry[]>([]);
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
      } catch (err) {
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
        if (!next.length) setEntries([]);
      }}
      canRun={entries.length > 0 && !starting}
      runLabel={starting ? "Starting…" : tool.action}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          { pages: entries.map((e) => ({ index: e.index, rotation: e.rotation })) }
        )
      }
      busyHint="Drag thumbnails to reorder, rotate or delete pages — the grid below is your live preview."
      fileThumb="pdf"
      options={
        <div className="border-2 border-obsidian bg-white p-4 shadow-hard">
          <p className="pp-label text-obsidian/70">
            {entries.length} page{entries.length === 1 ? "" : "s"} in the new document · drag tiles, use the arrows,
            rotate or delete freely
          </p>
        </div>
      }
      customPanel={
        files.length > 0 && entries.length > 0 ? (
          <PdfPagesPanel file={files[0].file} entries={entries} onEntriesChange={setEntries} flags={{ reorder: true, rotate: true, remove: true }} />
        ) : null
      }
    />
  );
}
