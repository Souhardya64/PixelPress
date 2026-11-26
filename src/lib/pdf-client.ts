let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export interface PdfDocHandle {
  doc: import("pdfjs-dist").PDFDocumentProxy;
  numPages: number;
}

const docCache = new Map<string, PdfDocHandle>();
const MAX_CACHED_DOCS = 4;

export async function loadPdfDoc(fileId: string, file: File): Promise<PdfDocHandle> {
  const cached = docCache.get(fileId);
  if (cached) return cached;
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  let doc;
  try {
    doc = await pdfjs.getDocument({
      data,
      standardFontDataUrl: "/pdf/standard_fonts/",
      wasmUrl: "/pdf/wasm/",
      cMapUrl: "/pdf/cmaps/",
      cMapPacked: true,
    }).promise;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    if (name === "PasswordException") {
      throw new Error("This PDF is password-protected and cannot be opened.");
    }
    if (name === "InvalidPDFException") {
      throw new Error("This file does not look like a valid PDF.");
    }
    throw new Error("Could not read this PDF. It may be corrupted.");
  }
  const handle = { doc, numPages: doc.numPages };
  docCache.set(fileId, handle);
  if (docCache.size > MAX_CACHED_DOCS) {
    const oldest = docCache.keys().next().value as string | undefined;
    if (oldest) {
      const old = docCache.get(oldest);
      old?.doc.destroy();
      docCache.delete(oldest);
    }
  }
  return handle;
}

export function releasePdfDoc(fileId: string): void {
  const handle = docCache.get(fileId);
  if (handle) {
    handle.doc.destroy();
    docCache.delete(fileId);
  }
}

export function getNumPagesCached(fileId: string): number | undefined {
  return docCache.get(fileId)?.numPages;
}

export async function renderPageDataUrl(
  fileId: string,
  file: File,
  pageNumber: number,
  targetWidth = 180,
  rotationDelta = 0
): Promise<string> {
  const { doc } = await loadPdfDoc(fileId, file);
  const page = await doc.getPage(pageNumber);
  const totalRotation = ((page.rotate + rotationDelta) % 360 + 360) % 360;
  const base = page.getViewport({ scale: 1, rotation: totalRotation });
  const scale = targetWidth / base.width;
  const viewport = page.getViewport({ scale, rotation: totalRotation });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}

export function parsePageRanges(
  input: string,
  totalPages: number
): number[] {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter at least one page or range, e.g. 1-3, 5.");
  const parts = trimmed.split(/[,;\s]+/).filter(Boolean);
  const picked = new Set<number>();
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`"${part}" is not a valid page or range.`);
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
      throw new Error(`Pages must be between 1 and ${totalPages}.`);
    }
    if (start > end) throw new Error(`Range "${part}" goes backwards.`);
    for (let p = start; p <= end; p++) picked.add(p);
  }
  return [...picked].sort((a, b) => a - b);
}

export function describeRanges(indices: number[]): string {
  const sorted = [...indices].sort((a, b) => a - b);
  const parts: string[] = [];
  let runStart = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur !== prev + 1) {
      parts.push(runStart === prev ? `${runStart}` : `${runStart}-${prev}`);
      runStart = cur;
    }
    prev = cur;
  }
  return parts.join(", ");
}
