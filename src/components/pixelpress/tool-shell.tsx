"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Trash2, X } from "lucide-react";
import type { ToolMeta } from "@/lib/tools";
import { formatBytes, fileExt } from "@/lib/format";
import { PPButton } from "./pp-button";
import { Dropzone } from "./dropzone";
import { getToolIcon } from "./tool-icons";
import { cn } from "@/lib/utils";

export interface PPFileEntry {
  id: string;
  file: File;
}

export function ToolShell({
  tool,
  files,
  onFilesChange,
  options,
  customPanel,
  canRun,
  runLabel,
  onStart,
  busyHint,
  fileThumb,
}: {
  tool: ToolMeta;
  files: PPFileEntry[];
  onFilesChange: (files: PPFileEntry[]) => void;
  options: ReactNode;
  customPanel?: ReactNode;
  canRun: boolean;
  runLabel?: string;
  onStart: () => void;
  busyHint?: string;
  fileThumb?: "image" | "pdf";
}) {
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const existing = new Set(files.map((f) => `${f.file.name}:${f.file.size}:${f.file.lastModified}`));
      const accepted: PPFileEntry[] = [];
      const rejected: string[] = [];
      const validExts = tool.accept
        .split(",")
        .filter((p) => p.startsWith("."))
        .map((p) => p.slice(1).toLowerCase());
      const validMimes = tool.accept.split(",").filter((p) => p.includes("/"));

      for (const file of incoming) {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (existing.has(key)) continue;
        existing.add(key);
        const ext = fileExt(file.name);
        const mimeOk = file.type ? validMimes.includes(file.type) : false;
        const extOk = validExts.includes(ext);
        if (!mimeOk && !extOk) {
          rejected.push(file.name);
          continue;
        }
        accepted.push({ id: `${key}:${Math.random().toString(36).slice(2, 8)}`, file });
      }
      if (rejected.length) {
        setError(`Skipped ${rejected.length} unsupported file${rejected.length > 1 ? "s" : ""}: ${rejected[0]}${rejected.length > 1 ? "…" : ""}`);
      }
      const cap = tool.maxFiles ?? 100;
      const merged = tool.multiple ? [...files, ...accepted].slice(0, cap) : accepted.slice(0, 1);
      onFilesChange(merged);
    },
    [files, onFilesChange, tool]
  );

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.file.size, 0), [files]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="pp-label mb-4 flex items-center gap-2 text-obsidian/50">
        <Link href={tool.category === "pdf" ? "/pdf-tools" : "/image-tools"} className="hover:text-obsidian">
          {tool.category === "pdf" ? "PDF Tools" : "Image Tools"}
        </Link>
        <span>/</span>
        <span className="text-obsidian">{tool.name}</span>
      </nav>

      <ToolHeader tool={tool} />

      <ol className="pp-label mt-6 flex flex-wrap gap-2 text-obsidian/60" aria-label="Steps">
        <li className="border-2 border-obsidian bg-pixel px-3 py-1.5 text-obsidian">1 · Add files</li>
        <li className="border-2 border-obsidian bg-white px-3 py-1.5">2 · Configure</li>
        <li className="border-2 border-obsidian bg-white px-3 py-1.5">3 · Download</li>
      </ol>

      <div className="mt-6">
        <Dropzone
          accept={tool.accept}
          acceptLabel={tool.acceptLabel}
          multiple={tool.multiple}
          onFiles={addFiles}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 border-2 border-obsidian bg-alert/10 px-3 py-2 text-sm font-medium text-obsidian">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-5 flex items-center justify-between border-2 border-obsidian bg-obsidian px-4 py-2 text-paper">
          <p className="pp-label">
            {files.length} file{files.length > 1 ? "s" : ""} · {formatBytes(totalSize)}
          </p>
          <button
            type="button"
            onClick={() => onFilesChange([])}
            className="pp-label flex items-center gap-1.5 text-paper/80 hover:text-pixel"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all
          </button>
        </div>
      )}

      {customPanel
        ? customPanel
        : files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((entry, i) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 border-2 border-obsidian bg-white px-3 py-2 shadow-hard-sm"
                >
                  <span className="pp-label w-7 shrink-0 text-center text-obsidian/50">{i + 1}</span>
                  {fileThumb === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={URL.createObjectURL(entry.file)}
                      alt=""
                      className="checker-bg h-10 w-10 shrink-0 border border-obsidian/30 object-cover"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setTimeout(() => URL.revokeObjectURL(img.src), 1000);
                      }}
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-obsidian bg-paper">
                      <span className="pp-label">PDF</span>
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.file.name}</span>
                  <span className="pp-label hidden shrink-0 text-obsidian/50 sm:block">{formatBytes(entry.file.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.file.name}`}
                    onClick={() => onFilesChange(files.filter((f) => f.id !== entry.id))}
                    className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-obsidian bg-white hover:bg-alert hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

      {files.length > 0 && (
        <section aria-label="Options" className="mt-8 space-y-4">
          <h2 className="pp-heading flex items-center gap-2 text-lg">
            <span className="inline-block h-4 w-4 bg-pixel" aria-hidden="true" />
            Configure
          </h2>
          {options}
        </section>
      )}

      {files.length > 0 && (
        <div className="mt-8 border-2 border-obsidian bg-white p-4 shadow-hard">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-obsidian/70">{busyHint ?? `Ready when you are — ${tool.action.toLowerCase()} runs entirely on your device.`}</p>
            <PPButton size="lg" disabled={!canRun} onClick={onStart} className="shrink-0">
              {runLabel ?? tool.action}
            </PPButton>
          </div>
          {!canRun && (
            <p className="pp-label mt-3 text-obsidian/45">
              {tool.multiple && tool.minFiles && tool.minFiles > 1
                ? `Add at least ${tool.minFiles} files to continue.`
                : "Add the required input first."}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 border-2 border-obsidian bg-pixel/20 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-xs font-medium leading-relaxed text-obsidian/80">
          Local processing — your files stay on this device and are never uploaded to any server.
          {" "}
          <Link href="/privacy" className="underline underline-offset-2">Read how it works</Link>
        </p>
      </div>
    </div>
  );
}

export function ToolHeader({ tool, big }: { tool: ToolMeta; big?: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={cn(
          "flex shrink-0 items-center justify-center border-2 border-obsidian bg-pixel shadow-hard",
          big ? "h-16 w-16" : "h-12 w-12"
        )}
        aria-hidden="true"
      >
        <ToolGlyph name={tool.icon} />
      </span>
      <div>
        <h1 className={cn("pp-heading", big ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}>{tool.name}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-obsidian/70">{tool.description}</p>
        <p className="pp-label mt-2 inline-block border border-obsidian/40 px-2 py-0.5 text-obsidian/60">
          Works offline once loaded · {tool.acceptLabel}
        </p>
      </div>
    </div>
  );
}

export function ToolGlyph({ name }: { name: string }) {
  const Icon = getToolIcon(name);
  return <Icon className="h-6 w-6 text-obsidian" strokeWidth={2.2} />;
}
