export interface PageGridPosition {
  x: 0 | 0.5 | 1;
  y: 0 | 0.5 | 1;
}

export function positionToXY(position: string): PageGridPosition {
  const map: Record<string, PageGridPosition> = {
    "top-left": { x: 0, y: 1 },
    "top-center": { x: 0.5, y: 1 },
    "top-right": { x: 1, y: 1 },
    "middle-left": { x: 0, y: 0.5 },
    center: { x: 0.5, y: 0.5 },
    "middle-right": { x: 1, y: 0.5 },
    "bottom-left": { x: 0, y: 0 },
    "bottom-center": { x: 0.5, y: 0 },
    "bottom-right": { x: 1, y: 0 },
  };
  return map[position] ?? { x: 0.5, y: 0.5 };
}

export function sanitizeOutputName(base: string, suffix: string, ext: string): string {
  const cleanBase = base.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 70) || "file";
  return `${cleanBase}${suffix}.${ext}`;
}

export async function verifyPdfBytes(bytes: Uint8Array, expectedPages?: number): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const count = doc.getPageCount();
  if (count < 1) throw new Error("Output verification failed: the generated PDF has no pages.");
  if (expectedPages != null && count !== expectedPages) {
    throw new Error(`Output verification failed: expected ${expectedPages} pages but found ${count}.`);
  }
  return count;
}

export async function verifyImageBlob(blob: Blob): Promise<void> {
  const bitmap = await createImageBitmap(blob);
  bitmap.close();
}

export async function readPdfWithLib(file: File) {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (doc.isEncrypted) {
    throw new Error("This PDF is password-protected, so it cannot be processed.");
  }
  return doc;
}

export function estimateImageToPdfSize(files: File[], quality: number): number {
  let total = 0;
  for (const f of files) {
    const isPng = f.type === "image/png";
    const factor = isPng ? 0.18 + 0.42 * quality : 0.16 + 0.48 * quality;
    total += f.size * factor;
  }
  return Math.round(total) + 40 * 1024;
}

export function cancelledError(): Error {
  return new Error("__CANCELLED__");
}

export function isCancelled(err: unknown): boolean {
  return err instanceof Error && err.message === "__CANCELLED__";
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw cancelledError();
}

export function buildZip(outputs: { name: string; blob: Blob }[], onItem?: (done: number, total: number) => void): Promise<Blob> {
  return (async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const used = new Set<string>();
    for (const out of outputs) {
      let name = out.name;
      let n = 2;
      while (used.has(name)) {
        name = out.name.replace(/(\.[^.]+)$/, `-${n}$1`);
        n++;
      }
      used.add(name);
      zip.file(name, out.blob);
    }
    return zip.generateAsync(
      { type: "blob", compression: "STORE" },
      (meta) => {
        if (onItem && outputs.length > 0) onItem(Math.round((meta.percent / 100) * outputs.length), outputs.length);
      }
    );
  })();
}
