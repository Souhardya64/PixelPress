import type { JobRecord, OutputFile } from "./job-types";
import type { RunCtx } from "./runner-types";
import { getJob, putJob } from "./db";
import { isCancelled } from "./impls/shared";
import {
  compressPdf,
  extractPages,
  imgToPdf,
  mergePdf,
  organisePdf,
  splitPdf,
  watermarkPdf,
} from "./impls/pdf-impls";
import { compressImages, convertImages, resizeCropImages } from "./impls/image-impls";

export type { RunCtx };

type ToolImpl = (ctx: RunCtx) => Promise<OutputFile[]>;

const IMPLS: Record<string, ToolImpl> = {
  "img-to-pdf": imgToPdf,
  "merge-pdf": mergePdf,
  "compress-pdf": compressPdf,
  "extract-pages": extractPages,
  "organise-pdf": organisePdf,
  "watermark-pdf": watermarkPdf,
  "split-pdf": splitPdf,
  "compress-image": compressImages,
  "resize-crop": resizeCropImages,
  "convert-image": convertImages,
};

export interface RunnerHooks {
  onJob: (job: JobRecord) => void;
  onStage: (index: number, detail?: string) => void;
  onProgress: (value: number) => void;
  onEta: (ms: number | null) => void;
}

export class JobCancelled extends Error {
  constructor() {
    super("Job cancelled");
    this.name = "JobCancelled";
  }
}

export async function runJob(jobId: string, hooks: RunnerHooks, signal: AbortSignal): Promise<void> {
  const job = await getJob(jobId);
  if (!job) throw new Error("This job could not be found locally. It may have been deleted.");
  if (job.status === "done") return;

  const impl = IMPLS[job.toolId];
  if (!impl) throw new Error(`Unknown tool: ${job.toolId}`);

  const startedAt = Date.now();
  let lastItemDone = 0;
  let lastItemTotal = 0;
  let lastItemTime = startedAt;
  let itemAvgMs = 0;
  let currentStage = -1;

  const ctx: RunCtx = {
    files: job.files,
    options: job.options,
    signal,
    stage: (index, detail) => {
      if (index === currentStage) return;
      currentStage = index;
      hooks.onStage(index, detail);
    },
    progress: (value) => hooks.onProgress(Math.min(1, Math.max(0, value))),
    item: (done, total) => {
      lastItemTotal = total;
      const now = Date.now();
      if (done > lastItemDone && lastItemDone > 0) {
        const dt = now - lastItemTime;
        itemAvgMs = itemAvgMs ? itemAvgMs * 0.6 + (dt / (done - lastItemDone)) * 0.4 : dt / (done - lastItemDone);
      }
      lastItemDone = done;
      lastItemTime = now;
      const frac = total > 0 ? done / total : 0;
      hooks.onProgress(Math.min(1, Math.max(0, frac)));
      hooks.onEta(done > 0 && done < total ? itemAvgMs * (total - done) : null);
    },
  };

  try {
    hooks.onJob({ ...job, status: "processing" });
    await putJob({ ...job, status: "processing", outputs: [], error: undefined, updatedAt: Date.now() });
    ctx.stage(0);

    const outputs = await impl(ctx);
    if (!outputs.length || outputs.some((o) => !o.blob || o.blob.size === 0)) {
      throw new Error("Processing produced an empty result. Please try again.");
    }

    const originalSize = job.fileSizes.reduce((s, v) => s + v, 0);
    const outputSize = outputs.reduce((s, o) => s + o.size, 0);
    const stats = {
      ...job.stats,
      originalSize,
      outputSize,
      reductionPct:
        originalSize > 0 && outputSize > 0 ? Math.round(((originalSize - outputSize) / originalSize) * 100) : 0,
    };

    const doneJob: JobRecord = {
      ...job,
      status: "done",
      outputs,
      stats,
      updatedAt: Date.now(),
    };
    await putJob(doneJob);
    hooks.onJob(doneJob);
    hooks.onProgress(1);
    hooks.onEta(0);
  } catch (err) {
    if (isCancelled(err) || signal.aborted) {
      await putJob({ ...job, status: "cancelled", updatedAt: Date.now() });
      hooks.onJob({ ...job, status: "cancelled" });
      return;
    }
    const message = err instanceof Error ? err.message : "Something went wrong while processing.";
    await putJob({ ...job, status: "error", error: message, updatedAt: Date.now() });
    hooks.onJob({ ...job, status: "error", error: message });
    throw err instanceof Error ? err : new Error(message);
  }
}

export function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "The user aborted a request." || err.name === "AbortError") {
      return "Processing was cancelled.";
    }
    return err.message;
  }
  return "Something went wrong while processing.";
}
