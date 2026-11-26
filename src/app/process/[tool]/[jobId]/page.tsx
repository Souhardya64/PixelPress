"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, X } from "lucide-react";
import { LogoMark } from "@/components/pixelpress/logo";
import { PPButton } from "@/components/pixelpress/pp-button";
import { STAGES, describeTool, type JobRecord } from "@/lib/job-types";
import { formatBytes, formatEta } from "@/lib/format";
import { friendlyError, runJob } from "@/lib/runner";
import { getJobSafe } from "@/lib/db";
import { getToolById } from "@/lib/tools";
import { cn } from "@/lib/utils";

type Phase = "loading" | "running" | "done-redirect" | "error" | "cancelled" | "missing" | "stale";

export default function ProcessJobPage() {
  const params = useParams<{ tool: string; jobId: string }>();
  const jobId = params.jobId;
  const toolId = params.tool;
  const router = useRouter();

  const [job, setJob] = useState<JobRecord | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [stageIndex, setStageIndex] = useState(0);
  const [stageDetail, setStageDetail] = useState<string | undefined>();
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  const tool = getToolById(toolId);

  const beginRun = useCallback(
    async (record: JobRecord) => {
      startedRef.current = true;
      setPhase("running");
      setStageIndex(0);
      setProgress(0);
      setEta(null);
      setErrorMessage(null);
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        await runJob(
          record.id,
          {
            onJob: (updated) => {
              setJob(updated);
              if (updated.status === "done") {
                setStageIndex(STAGES.length - 1);
                setProgress(1);
                setPhase("done-redirect");
              } else if (updated.status === "cancelled") {
                setPhase("cancelled");
                setErrorMessage("The operation was cancelled before completion.");
              }
            },
            onStage: (index, detail) => {
              setStageIndex(index);
              setStageDetail(detail);
            },
            onProgress: (value) => setProgress(value),
            onEta: (ms) => setEta(ms),
          },
          controller.signal
        );
      } catch (err) {
        setPhase("error");
        setErrorMessage(friendlyError(err));
      }
    },
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const record = await getJobSafe(jobId);
      if (!alive) return;
      if (!record || record.toolId !== toolId) {
        setPhase("missing");
        return;
      }
      setJob(record);
      if (record.status === "done") {
        router.replace(`/download/${record.id}`);
        return;
      }
      if (record.status === "queued") {
        if (!startedRef.current) void beginRun(record);
        return;
      }
      if (record.status === "processing") {
        setPhase("stale");
        return;
      }
      if (record.status === "error") {
        setPhase("error");
        setErrorMessage(record.error ?? "Processing failed.");
        return;
      }
      if (record.status === "cancelled") {
        setPhase("cancelled");
      }
    })();
    return () => {
      alive = false;
    };
  }, [jobId, toolId, router, beginRun]);

  useEffect(() => {
    if (phase !== "done-redirect") return;
    const t = setTimeout(() => {
      if (job) router.replace(`/download/${job.id}`);
    }, 900);
    return () => clearTimeout(t);
  }, [phase, job, router]);

  const cancel = () => {
    controllerRef.current?.abort();
  };

  const restart = () => {
    startedRef.current = false;
    if (job) void beginRun(job);
  };

  if (phase === "missing") {
    return (
      <Shell>
        <div className="pp-pop border-2 border-obsidian bg-white p-8 text-center shadow-hard-lg">
          <AlertTriangle className="mx-auto h-10 w-10 text-alert" />
          <h1 className="pp-heading mt-4 text-2xl">Job not found</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-obsidian/70">
            This processing job does not exist in this browser. Temporary job data may have been
            deleted, or the link came from a different device or private window.
          </p>
          <PPButton className="mx-auto mt-6" onClick={() => router.push("/tools")}>
            Pick a tool
          </PPButton>
        </div>
      </Shell>
    );
  }

  const fileLine = job ? (job.fileNames.length === 1 ? job.fileNames[0] : `${job.fileNames.length} files`) : "";

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="border-2 border-obsidian bg-paper p-2 shadow-hard">
            <LogoMark size={44} />
          </div>
          <p className="pp-label mt-4 text-obsidian/60">Processing locally on your device</p>
          <h1 className="pp-heading mt-1 text-2xl sm:text-3xl">{describeTool({ toolId })}</h1>
          {tool && (
            <p className="pp-label mt-1 border border-obsidian/40 px-2 py-0.5 text-obsidian/60">
              {tool.name}
            </p>
          )}
        </div>

        <div className="border-2 border-obsidian bg-white shadow-hard-lg">
          <div className="border-b-2 border-obsidian bg-obsidian px-4 py-3 text-paper">
            <p className="pp-label truncate" title={fileLine}>
              {fileLine || "…"}
            </p>
          </div>

          <ol className="divide-y-2 divide-obsidian/10" aria-label="Processing stages">
            {STAGES.map((stage, i) => {
              const isDone = i < stageIndex || phase === "done-redirect";
              const isCurrent = i === stageIndex && phase === "running";
              return (
                <li
                  key={stage.key}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5",
                    isCurrent && "bg-pixel/25",
                    isDone && "text-obsidian/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center border-2 border-obsidian",
                      isDone && "bg-mint",
                      isCurrent && "bg-pixel"
                    )}
                    aria-hidden="true"
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : isCurrent ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  </span>
                  <span className="pp-label">{stage.label}</span>
                  {isCurrent && stageDetail && (
                    <span className="pp-label ml-auto hidden max-w-[50%] truncate text-obsidian/60 sm:block" title={stageDetail}>
                      {stageDetail}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="border-t-2 border-obsidian bg-paper px-4 py-5">
            <div className="flex items-end justify-between">
              <p className="pp-heading text-2xl tabular-nums">{Math.round(progress * 100)}%</p>
              <p className="pp-label text-obsidian/60">{formatEta(eta)}</p>
            </div>
            <div
              className="mt-2 h-5 overflow-hidden border-2 border-obsidian bg-white"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="pixel-fill h-full bg-pixel transition-[width] duration-200 ease-linear"
                style={{ width: `${Math.max(2, progress * 100)}%` }}
              />
            </div>
            <p className="pp-label mt-2 text-obsidian/50">
              Real progress from the processing engine — no fake numbers.
            </p>
          </div>
        </div>

        {phase === "running" && (
          <div className="mt-5 flex justify-center">
            <PPButton variant="outline" onClick={cancel}>
              <X className="h-4 w-4" /> Cancel operation
            </PPButton>
          </div>
        )}

        {phase === "done-redirect" && (
          <div className="pp-pop mt-5 border-2 border-obsidian bg-mint/20 p-4 text-center shadow-hard">
            <p className="pp-heading flex items-center justify-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5" /> Ready to download
            </p>
            <p className="pp-label mt-1 text-obsidian/60">Opening the download page…</p>
            <PPButton className="mt-3" onClick={() => job && router.push(`/download/${job.id}`)}>
              Continue now
            </PPButton>
          </div>
        )}

        {phase === "stale" && (
          <div className="mt-5 border-2 border-obsidian bg-alert/10 p-4 shadow-hard">
            <p className="pp-heading flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" /> Processing was interrupted
            </p>
            <p className="mt-1 text-sm text-obsidian/70">
              A refresh or closed tab stopped this job. Your files are still saved locally — restart the
              job to continue.
            </p>
            <PPButton className="mt-3" onClick={restart}>
              <RotateCcw className="h-4 w-4" /> Restart job
            </PPButton>
          </div>
        )}

        {(phase === "error" || phase === "cancelled") && (
          <div className="mt-5 border-2 border-obsidian bg-alert/10 p-4 shadow-hard">
            <p className="pp-heading flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5" /> {phase === "cancelled" ? "Operation cancelled" : "Processing failed"}
            </p>
            <p className="mt-1 text-sm text-obsidian/70">{errorMessage}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <PPButton onClick={restart}>
                <RotateCcw className="h-4 w-4" /> Try again
              </PPButton>
              <PPButton variant="outline" onClick={() => router.push(tool ? `/tools/${tool.slug}` : "/tools")}>
                Back to {tool?.name ?? "tools"}
              </PPButton>
            </div>
          </div>
        )}

        <p className="pp-label mt-6 text-center text-obsidian/40">
          <Link href="/" className="underline underline-offset-2 hover:text-obsidian">PixelPress</Link>{" "}
          keeps job data only in this browser and deletes it automatically after 6 hours.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-pixel-grid min-h-[calc(100vh-8rem)] px-4 py-14">
      {children}
    </div>
  );
}
