import { uid } from "./format";
import { getJob, putJob } from "./db";
import type { JobRecord, JobStatus } from "./job-types";

export async function createJob(
  toolId: string,
  files: File[],
  options: Record<string, unknown>
): Promise<JobRecord> {
  const job: JobRecord = {
    id: uid(),
    toolId,
    status: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    files,
    fileNames: files.map((f) => f.name),
    fileSizes: files.map((f) => f.size),
    options,
    outputs: [],
    stats: { originalSize: files.reduce((s, f) => s + f.size, 0) },
  };
  await putJob(job);
  return job;
}

export async function touchJob(id: string, status: JobStatus, extra?: Partial<JobRecord>): Promise<void> {
  const job = await getJobSafe(id);
  if (!job) return;
  const next: JobRecord = { ...job, ...extra, status, updatedAt: Date.now() };
  await putJob(next);
}

export async function getJobSafe(id: string): Promise<JobRecord | undefined> {
  try {
    return await getJob(id);
  } catch {
    return undefined;
  }
}
