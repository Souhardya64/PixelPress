export interface OutputFile {
  name: string;
  blob: Blob;
  size: number;
  kind: "pdf" | "image" | "zip";
  pages?: number;
  sourceIndex?: number;
}

export interface JobStats {
  originalSize?: number;
  outputSize?: number;
  reductionPct?: number;
  pageCount?: number;
  imageCount?: number;
  notes?: string[];
}

export type JobStatus = "queued" | "processing" | "done" | "error" | "cancelled";

export interface JobRecord {
  id: string;
  toolId: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  files: File[];
  fileNames: string[];
  fileSizes: number[];
  options: Record<string, unknown>;
  outputs: OutputFile[];
  stats: JobStats;
  error?: string;
}

export const STAGES = [
  { key: "reading", label: "Reading files" },
  { key: "preparing", label: "Preparing documents" },
  { key: "processing", label: "Processing" },
  { key: "generating", label: "Generating output" },
  { key: "verifying", label: "Verifying output" },
  { key: "ready", label: "Ready to download" },
] as const;

export function describeTool(job: { toolId: string }): string {
  const names: Record<string, string> = {
    "img-to-pdf": "Images → PDF",
    "merge-pdf": "Merge PDFs",
    "compress-pdf": "Compress PDF",
    "extract-pages": "Extract pages",
    "organise-pdf": "Organise pages",
    "watermark-pdf": "Watermark PDF",
    "split-pdf": "Split PDF",
    "compress-image": "Compress images",
    "resize-crop": "Resize & crop",
    "convert-image": "Convert format",
  };
  return names[job.toolId] ?? job.toolId;
}
