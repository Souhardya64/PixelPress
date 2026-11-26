"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, RotateCw, Trash2 } from "lucide-react";
import { renderPageDataUrl } from "@/lib/pdf-client";
import { cn } from "@/lib/utils";

export interface PdfPageEntry {
  key: string;
  index: number;
  rotation: number;
}

export interface PdfPagesPanelFlags {
  reorder?: boolean;
  rotate?: boolean;
  remove?: boolean;
  select?: boolean;
}

export function PdfPagesPanel({
  file,
  entries,
  onEntriesChange,
  flags,
  selected,
  onSelectionChange,
  tileSize = 150,
}: {
  file: File | null;
  entries: PdfPageEntry[];
  onEntriesChange?: (entries: PdfPageEntry[]) => void;
  flags?: PdfPagesPanelFlags;
  selected?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  tileSize?: number;
}) {
  const dragKey = useRef<string | null>(null);

  if (!file || entries.length === 0) return null;

  const setEntries = (next: PdfPageEntry[]) => onEntriesChange?.(next);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= entries.length || from === to) return;
    const next = [...entries];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setEntries(next);
  };

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="list" aria-label="PDF pages">
      {entries.map((entry, i) => (
        <PdfTile
          key={entry.key}
          file={file}
          entry={entry}
          order={i}
          total={entries.length}
          flags={flags ?? {}}
          selected={selected?.has(entry.key) ?? false}
          tileSize={tileSize}
          dragKey={dragKey}
          onMove={move}
          onRotate={(delta) => {
            const next = [...entries];
            next[i] = { ...entry, rotation: (((entry.rotation + delta) % 360) + 360) % 360 };
            setEntries(next);
          }}
          onRemove={() => setEntries(entries.filter((e) => e.key !== entry.key))}
          onToggleSelect={(checked) => {
            const next = new Set(selected ?? []);
            if (checked) next.add(entry.key);
            else next.delete(entry.key);
            onSelectionChange?.(next);
          }}
          onDropOn={(targetKey) => {
            const from = entries.findIndex((e) => e.key === dragKey.current);
            const to = entries.findIndex((e) => e.key === targetKey);
            if (from >= 0 && to >= 0) move(from, to);
            dragKey.current = null;
          }}
          onDragStartKey={(k) => {
            dragKey.current = k;
          }}
        />
      ))}
    </div>
  );
}

const PdfTile = memo(function PdfTile({
  file,
  entry,
  order,
  total,
  flags,
  selected,
  tileSize,
  onMove,
  onRotate,
  onRemove,
  onToggleSelect,
  onDropOn,
  onDragStartKey,
  dragKey,
}: {
  file: File;
  entry: PdfPageEntry;
  order: number;
  total: number;
  flags: PdfPagesPanelFlags;
  selected: boolean;
  tileSize: number;
  dragKey: React.RefObject<string | null>;
  onMove: (from: number, to: number) => void;
  onRotate: (delta: number) => void;
  onRemove: () => void;
  onToggleSelect: (checked: boolean) => void;
  onDropOn: (targetKey: string) => void;
  onDragStartKey: (key: string) => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (records) => {
        if (records.some((r) => r.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || dataUrl || failed) return;
    let alive = true;
    renderPageDataUrl(`${file.name}:${file.size}:${file.lastModified}`, file, entry.index + 1, Math.max(140, tileSize), entry.rotation)
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [visible, dataUrl, failed, file, entry.index, entry.rotation, tileSize]);

  return (
    <div
      ref={hostRef}
      role="listitem"
      draggable={flags.reorder}
      onDragStart={(e) => {
        onDragStartKey(entry.key);
        e.dataTransfer.effectAllowed = "move";
        try {
          e.dataTransfer.setData("text/plain", entry.key);
        } catch {}
      }}
      onDragOver={(e) => flags.reorder && e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOn(entry.key);
      }}
      className={cn(
        "group relative border-2 border-obsidian bg-white p-2 shadow-hard-sm transition-shadow",
        selected && "bg-pixel/25 shadow-hard",
        flags.reorder && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="relative flex items-center justify-center" style={{ minHeight: tileSize }}>
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`Page ${entry.index + 1}`} className="max-h-full max-w-full" draggable={false} />
        ) : failed ? (
          <p className="pp-label text-alert">Preview failed</p>
        ) : (
          <div className="flex items-center gap-2 text-obsidian/40">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="pp-label">Page {entry.index + 1}</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="pp-label text-obsidian/60">P{entry.index + 1}</span>
        <span className="flex items-center gap-1">
          {flags.select && (
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`Select page ${entry.index + 1}`}
              onClick={() => onToggleSelect(!selected)}
              className={cn(
                "flex h-7 w-7 items-center justify-center border-2 border-obsidian text-xs font-bold",
                selected ? "bg-obsidian text-pixel" : "bg-white hover:bg-pixel/40"
              )}
            >
              {selected ? "✓" : ""}
            </button>
          )}
          {flags.rotate && (
            <button
              type="button"
              aria-label={`Rotate page ${entry.index + 1} by 90 degrees`}
              onClick={() => onRotate(90)}
              className="flex h-7 w-7 items-center justify-center border-2 border-obsidian bg-white hover:bg-pixel/40"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          )}
          {flags.remove && (
            <button
              type="button"
              aria-label={`Delete page ${entry.index + 1}`}
              onClick={onRemove}
              className="flex h-7 w-7 items-center justify-center border-2 border-obsidian bg-white hover:bg-alert hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      </div>

      {flags.reorder && (
        <div className="absolute inset-x-1.5 top-1.5 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            aria-label={`Move page ${entry.index + 1} earlier`}
            disabled={order === 0}
            onClick={() => onMove(order, order - 1)}
            className="flex h-6 w-6 items-center justify-center border-2 border-obsidian bg-paper disabled:opacity-30"
          >
            <ArrowLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={`Move page ${entry.index + 1} later`}
            disabled={order === total - 1}
            onClick={() => onMove(order, order + 1)}
            className="flex h-6 w-6 items-center justify-center border-2 border-obsidian bg-paper disabled:opacity-30"
          >
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {flags.reorder && (
        <span className="pp-label absolute -top-2.5 left-2 border border-obsidian bg-pixel px-1 text-obsidian" aria-hidden="true">
          {order + 1}
        </span>
      )}
    </div>
  );
});
