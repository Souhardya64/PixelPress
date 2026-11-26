import type { ImagePayload, WorkerResult } from "./image.worker";

let worker: Worker | null = null;
let workerBroken = false;
let seq = 0;
const pending = new Map<number, { resolve: (r: WorkerResult) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (typeof Worker === "undefined") return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("./image.worker.ts", import.meta.url));
      worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; result?: WorkerResult; error?: string }>) => {
        const { id, ok, result, error } = event.data;
        const entry = pending.get(id);
        if (!entry) return;
        pending.delete(id);
        if (ok && result) entry.resolve(result);
        else entry.reject(new Error(error ?? "Image processing failed"));
      };
      worker.onerror = () => {
        workerBroken = true;
        for (const [, entry] of pending) entry.reject(new Error("__WORKER_FALLBACK__"));
        pending.clear();
      };
    } catch {
      workerBroken = true;
      return null;
    }
  }
  return worker;
}

export async function processImage(payload: ImagePayload): Promise<WorkerResult> {
  const w = getWorker();
  if (!w) {
    const { handleOnMainThread } = await import("./image.worker");
    return handleOnMainThread(payload);
  }
  try {
    return await new Promise<WorkerResult>((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      w.postMessage({ id, payload });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "__WORKER_FALLBACK__") {
      const { handleOnMainThread } = await import("./image.worker");
      return handleOnMainThread(payload);
    }
    throw err;
  }
}
