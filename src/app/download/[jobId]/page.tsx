"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Download, FileArchive, Home, Repeat, Trash2 } from "lucide-react";
import { PPButton } from "@/components/pixelpress/pp-button";
import { describeTool, type JobRecord } from "@/lib/job-types";
import { formatBytes } from "@/lib/format";
import { getJobSafe } from "@/lib/db";
import { getToolById } from "@/lib/tools";
import { buildZip } from "@/lib/impls/shared";

export default function DownloadJobPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const router = useRouter();

  const [job, setJob] = useState<JobRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [zipPct, setZipPct] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const record = await getJobSafe(jobId);
      if (!alive) return;
      if (!record) {
        setMissing(true);
        return;
      }
      setJob(record);
    })();
    return () => {
      alive = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!job) return;
    const urls: Record<number, string> = {};
    job.outputs.forEach((out, i) => {
      if (out.kind === "image" && out.blob) {
        urls[i] = URL.createObjectURL(out.blob);
      }
    });
    setPreviewUrls(urls);
    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [job]);

  const tool = job ? getToolById(job.toolId) : undefined;

  const download = useCallback((blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }, []);

  const downloadZip = useCallback(async () => {
    if (!job) return;
    setZipping(true);
    setZipPct(0);
    try {
      const zip = await buildZip(job.outputs, (done, total) => setZipPct(total ? done / total : 0));
      const name = `${(tool?.slug ?? "pixelpress").replace(/-/g, "-")}-output.zip`;
      download(zip, `pixelpress-${tool?.slug ?? "output"}.zip`);
      void name;
    } catch {
      // keep UI usable if zipping fails
    } finally {
      setZipping(false);
    }
  }, [job, tool, download]);

  const deleteJob = useCallback(async () => {
    const { deleteJob } = await import("@/lib/db");
    await deleteJob(jobId);
    router.push("/");
  }, [jobId, router]);

  const stats = job?.stats;
  const reduction = useMemo(() => {
    if (!stats?.originalSize || !stats?.outputSize) return null;
    return Math.round(((stats.originalSize - stats.outputSize) / stats.originalSize) * 100);
  }, [stats]);

  if (missing) {
    return (
      <Page>
        <div className="pp-pop border-2 border-obsidian bg-white p-8 text-center shadow-hard-lg">
          <h1 className="pp-heading text-2xl">Nothing to download here</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-obsidian/70">
            This download job does not exist in this browser. Temporary job data may have been
            deleted or expired — process your files again to get fresh downloads.
          </p>
          <PPButton className="mx-auto mt-6" onClick={() => router.push("/tools")}>
            Pick a tool
          </PPButton>
        </div>
      </Page>
    );
  }

  if (!job) {
    return (
      <Page>
        <p className="pp-label animate-pulse text-center text-obsidian/50">Loading job…</p>
      </Page>
    );
  }

  if (job.status !== "done") {
    return (
      <Page>
        <div className="pp-pop border-2 border-obsidian bg-white p-8 text-center shadow-hard-lg">
          <h1 className="pp-heading text-2xl">This job is not finished yet</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-obsidian/70">
            Status: {job.status}. If processing was interrupted by a refresh, you can restart it.
          </p>
          <PPButton className="mx-auto mt-6" onClick={() => router.push(`/process/${job.toolId}/${job.id}`)}>
            Go to processing
          </PPButton>
        </div>
      </Page>
    );
  }

  const single = job.outputs.length === 1;

  return (
    <Page>
      <div className="mx-auto max-w-3xl">
        <div className="pp-pop flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center border-2 border-obsidian bg-mint shadow-hard">
            <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
          </span>
          <h1 className="pp-heading mt-4 text-3xl sm:text-4xl">Success — files ready</h1>
          <p className="pp-label mt-1 text-obsidian/60">
            {describeTool(job)} · processed locally {new Date(job.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Job statistics">
          <StatBox label="Original" value={formatBytes(stats?.originalSize ?? job.fileSizes.reduce((s, v) => s + v, 0))} />
          <StatBox label="Output" value={formatBytes(stats?.outputSize ?? job.outputs.reduce((s, o) => s + o.size, 0))} highlight />
          {reduction != null && reduction !== 0 && (
            <StatBox label={reduction > 0 ? "Saved" : "Larger by"} value={`${Math.abs(reduction)}%`} accent={reduction > 0} />
          )}
          {(stats?.pageCount != null || stats?.imageCount != null) && (
            <StatBox label={stats?.pageCount != null ? "Pages" : "Images"} value={String(stats?.pageCount ?? stats?.imageCount)} />
          )}
        </div>

        {single ? (
          <div className="mt-8 border-2 border-obsidian bg-white p-5 shadow-hard-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="pp-heading truncate text-lg" title={job.outputs[0].name}>{job.outputs[0].name}</p>
                <p className="pp-label mt-1 text-obsidian/60">
                  {formatBytes(job.outputs[0].size)}
                  {job.outputs[0].pages != null ? ` · ${job.outputs[0].pages} pages` : ""} · verified ✓
                </p>
              </div>
              <PPButton size="lg" onClick={() => download(job.outputs[0].blob, job.outputs[0].name)}>
                <Download className="h-4 w-4" /> Download file
              </PPButton>
            </div>
            {job.outputs[0].kind === "image" && previewUrls[0] && (
              <div className="checker-bg mt-4 flex max-h-72 justify-center overflow-hidden border-2 border-obsidian/20 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrls[0]} alt="Output preview" className="max-h-64 w-auto" />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 border-2 border-obsidian bg-white shadow-hard-lg">
            <div className="flex items-center justify-between border-b-2 border-obsidian bg-paper px-4 py-3">
              <p className="pp-heading text-base">{job.outputs.length} output files</p>
              <PPButton variant="dark" size="sm" onClick={downloadZip} disabled={zipping}>
                <FileArchive className="h-4 w-4" />
                {zipping ? `Zipping ${Math.round(zipPct * 100)}%` : "Download all as ZIP"}
              </PPButton>
            </div>
            <ul className="divide-y-2 divide-obsidian/10">
              {job.outputs.map((out, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  {out.kind === "image" && previewUrls[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrls[i]} alt="" className="checker-bg h-10 w-10 shrink-0 border border-obsidian/30 object-cover" />
                  ) : (
                    <span className="pp-label flex h-8 w-10 shrink-0 items-center justify-center border-2 border-obsidian bg-paper">
                      {out.kind.toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" title={out.name}>{out.name}</span>
                    <span className="pp-label text-obsidian/50">
                      {formatBytes(out.size)}
                      {out.pages != null ? ` · ${out.pages} pages` : ""} · verified ✓
                    </span>
                  </span>
                  <PPButton variant="outline" size="sm" onClick={() => download(out.blob, out.name)}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </PPButton>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stats?.notes && stats.notes.length > 0 && (
          <div className="mt-5 border-2 border-obsidian bg-pixel/20 p-4">
            {stats.notes.map((note, i) => (
              <p key={i} className="text-xs leading-relaxed text-obsidian/80">· {note}</p>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {tool && (
            <PPButton variant="dark" onClick={() => router.push(`/tools/${tool.slug}`)}>
              <Repeat className="h-4 w-4" /> Process another file
            </PPButton>
          )}
          <PPButton variant="outline" onClick={() => router.push("/")}>
            <Home className="h-4 w-4" /> Back to home
          </PPButton>
          <PPButton variant="danger" onClick={() => void deleteJob()}>
            <Trash2 className="h-4 w-4" /> Delete temporary job data
          </PPButton>
        </div>

        <p className="pp-label mt-6 text-center text-obsidian/40">
          Output files live only in this browser&apos;s local storage and are deleted automatically after 6
          hours. Nothing was uploaded.{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-obsidian">Privacy details</Link>
        </p>
      </div>
    </Page>
  );
}

function StatBox({ label, value, highlight, accent }: { label: string; value: string; highlight?: boolean; accent?: boolean }) {
  return (
    <div className={`border-2 border-obsidian px-4 py-3 shadow-hard-sm ${highlight ? "bg-pixel" : "bg-white"}`}>
      <p className="pp-label text-obsidian/60">{label}</p>
      <p className={`pp-heading mt-0.5 text-lg tabular-nums ${accent ? "text-mint" : ""}`}>{value}</p>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="bg-pixel-grid min-h-[calc(100vh-8rem)] px-4 py-14">{children}</div>;
}
