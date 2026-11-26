import type { OutputFile } from "../job-types";
import { sanitizeFileName } from "../format";
import { processImage } from "../workers/image-client";
import { sanitizeOutputName, throwIfAborted, verifyImageBlob } from "./shared";
import type { RunCtx } from "../runner-types";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function compressImages(ctx: RunCtx): Promise<OutputFile[]> {
  const o = ctx.options;
  const quality = Number(o.quality ?? 0.75);
  const targetMB = o.targetMB != null && Number(o.targetMB) > 0 ? Number(o.targetMB) : null;
  const maxEdge = o.maxEdge ? Number(o.maxEdge) : null;
  const chosen = String(o.format ?? "auto");

  ctx.stage(2, "Compressing images");
  const outputs: OutputFile[] = [];
  for (let i = 0; i < ctx.files.length; i++) {
    throwIfAborted(ctx.signal);
    const file = ctx.files[i];
    const resolvedType =
      chosen === "auto" ? (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg") : chosen;

    const { default: imageCompression } = await import("browser-image-compression");
    const compressed = await imageCompression(file, {
      useWebWorker: true,
      initialQuality: quality,
      fileType: resolvedType,
      ...(targetMB ? { maxSizeMB: targetMB } : {}),
      ...(maxEdge ? { maxWidthOrHeight: maxEdge } : {}),
      signal: ctx.signal,
      onProgress: (p: number) => {
        ctx.item(i + p, ctx.files.length);
      },
    });

    await verifyImageBlob(compressed);
    outputs.push({
      name: sanitizeOutputName(file.name, "-compressed", EXT_BY_TYPE[resolvedType] ?? "jpg"),
      blob: compressed,
      size: compressed.size,
      kind: "image",
      sourceIndex: i,
    });
    ctx.item(i + 1, ctx.files.length);
  }
  ctx.stage(5, "Checking every compressed image");
  return outputs;
}

export interface ResizeCropOptions {
  targetW: number | null;
  targetH: number | null;
  fit: "cover" | "contain" | "stretch";
  rotation: number;
  crop: { x: number; y: number; w: number; h: number };
  format: string;
  quality: number;
  bg: string;
}

export async function resizeCropImages(ctx: RunCtx): Promise<OutputFile[]> {
  const o = ctx.options as unknown as ResizeCropOptions;
  ctx.stage(2, "Resizing and cropping");
  const suffix = o.targetW && o.targetH ? `-${o.targetW}x${o.targetH}` : "-edited";
  const outputs: OutputFile[] = [];

  for (let i = 0; i < ctx.files.length; i++) {
    throwIfAborted(ctx.signal);
    const file = ctx.files[i];
    const res = await processImage({
      file,
      format: o.format,
      quality: o.quality,
      background: o.bg,
      targetW: o.targetW,
      targetH: o.targetH,
      fit: o.fit,
      rotation: o.rotation,
      crop: o.crop,
    });
    await verifyImageBlob(res.blob);
    outputs.push({
      name: sanitizeOutputName(file.name, suffix, EXT_BY_TYPE[o.format] ?? "png"),
      blob: res.blob,
      size: res.blob.size,
      kind: "image",
      sourceIndex: i,
    });
    ctx.item(i + 1, ctx.files.length);
  }
  ctx.stage(5, "Checking every edited image");
  return outputs;
}

export async function convertImages(ctx: RunCtx): Promise<OutputFile[]> {
  const o = ctx.options;
  const format = String(o.format ?? "image/png");
  const quality = Number(o.quality ?? 0.9);
  ctx.stage(2, "Converting images");
  const outputs: OutputFile[] = [];

  for (let i = 0; i < ctx.files.length; i++) {
    throwIfAborted(ctx.signal);
    const file = ctx.files[i];
    const res = await processImage({
      file,
      format,
      quality,
      background: String(o.bg ?? "#ffffff"),
      maxEdge: 8000,
    });
    await verifyImageBlob(res.blob);
    outputs.push({
      name: sanitizeOutputName(file.name, "", EXT_BY_TYPE[format] ?? "png"),
      blob: res.blob,
      size: res.blob.size,
      kind: "image",
      sourceIndex: i,
    });
    ctx.item(i + 1, ctx.files.length);
  }
  ctx.stage(5, "Checking every converted image");
  return outputs;
}
