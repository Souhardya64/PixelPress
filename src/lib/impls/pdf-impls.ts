import type { OutputFile } from "../job-types";
import type { PDFDocument, PDFImage } from "pdf-lib";
import { hexToRgb01, sanitizeFileName } from "../format";
import { getPdfjs, parsePageRanges } from "../pdf-client";
import { processImage } from "../workers/image-client";
import {
  buildZip,
  positionToXY,
  readPdfWithLib,
  sanitizeOutputName,
  throwIfAborted,
  verifyPdfBytes,
} from "./shared";
import type { RunCtx } from "../runner-types";

const MM_TO_PT = 72 / 25.4;

const PAGE_SIZES_PT: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  LETTER: [612, 792],
};

const WATERMARK_PADDING = 24;

export interface ImgToPdfOptions {
  quality: number;
  pageSize: "A4" | "A3" | "LETTER" | "CUSTOM";
  customW: number;
  customH: number;
  orientation: "portrait" | "landscape";
  margin: number;
  fit: "fit" | "fill" | "original";
  bg: string;
  watermark: {
    mode: "none" | "text" | "image";
    text: string;
    fontSize: number;
    opacity: number;
    rotation: number;
    position: string;
    color: string;
    imageFile: File | null;
    imageScale: number;
    imageOpacity: number;
  };
  pageNumbers: {
    enabled: boolean;
    position: string;
    format: "n" | "n-slash-total" | "page-n" | "page-n-of-total";
  };
}

export async function imgToPdf(ctx: RunCtx): Promise<OutputFile[]> {
  const o = ctx.options as unknown as ImgToPdfOptions;
  ctx.stage(0, "Decoding and checking images");
  for (let i = 0; i < ctx.files.length; i++) {
    throwIfAborted(ctx.signal);
    try {
      const bmp = await createImageBitmap(ctx.files[i]);
      bmp.close();
    } catch {
      throw new Error(`"${ctx.files[i].name}" could not be read as an image. It may be corrupted.`);
    }
    ctx.item(i + 1, ctx.files.length);
  }

  ctx.stage(1, "Compressing images before PDF build");
  const compressed: { blob: Blob; width: number; height: number; size: number }[] = [];
  for (let i = 0; i < ctx.files.length; i++) {
    throwIfAborted(ctx.signal);
    const res = await processImage({
      file: ctx.files[i],
      format: "image/jpeg",
      quality: o.quality,
      background: o.bg || "#ffffff",
      maxEdge: 3500,
    });
    compressed.push({ blob: res.blob, width: res.width, height: res.height, size: res.blob.size });
    ctx.item(i + 1, ctx.files.length);
  }

  ctx.stage(3, "Building PDF pages");
  const { PDFDocument, StandardFonts, degrees, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle("PixelPress document");
  pdf.setProducer("PixelPress");
  pdf.setCreator("PixelPress (local processing)");

  const [sizeW, sizeH] = pageSizePoints(o);
  const marginPt = o.margin * MM_TO_PT;
  const contentW = Math.max(10, sizeW - marginPt * 2);
  const contentH = Math.max(10, sizeH - marginPt * 2);

  let textFont: Awaited<ReturnType<PDFDocument["embedFont"]>> | null = null;
  let wmImage: PDFImage | null = null;
  if (o.watermark.mode === "text" && o.watermark.text.trim()) {
    textFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  }
  if (o.watermark.mode === "image" && o.watermark.imageFile) {
    const bytes = await o.watermark.imageFile.arrayBuffer();
    try {
      wmImage =
        o.watermark.imageFile.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    } catch {
      throw new Error("The watermark image could not be read. Use a JPG or PNG file.");
    }
  }

  for (let i = 0; i < compressed.length; i++) {
    throwIfAborted(ctx.signal);
    const page = pdf.addPage([sizeW, sizeH]);
    const bgRgb = hexToRgb01(o.bg || "#ffffff");
    page.drawRectangle({ x: 0, y: 0, width: sizeW, height: sizeH, color: rgb(bgRgb.r, bgRgb.g, bgRgb.b) });

    let drawW: number;
    let drawH: number;
    if (o.fit === "fill") {
      const aspect = contentW / contentH;
      const cropped = await processImage({
        file: ctx.files[i],
        format: "image/jpeg",
        quality: o.quality,
        background: o.bg || "#ffffff",
        aspectCrop: aspect,
        maxEdge: 3500,
      });
      const embedded = await pdf.embedJpg(await cropped.blob.arrayBuffer());
      page.drawImage(embedded, { x: marginPt, y: marginPt, width: contentW, height: contentH });
    } else {
      const embedded = await pdf.embedJpg(await compressed[i].blob.arrayBuffer());
      if (o.fit === "original") {
        const nativeW = compressed[i].width * 0.75;
        const nativeH = compressed[i].height * 0.75;
        const scale = Math.min(1, contentW / nativeW, contentH / nativeH);
        drawW = nativeW * scale;
        drawH = nativeH * scale;
      } else {
        const scale = Math.min(contentW / compressed[i].width, contentH / compressed[i].height);
        drawW = compressed[i].width * scale;
        drawH = compressed[i].height * scale;
      }
      page.drawImage(embedded, {
        x: marginPt + (contentW - drawW) / 2,
        y: marginPt + (contentH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }

    if (o.watermark.mode === "text" && textFont && o.watermark.text.trim()) {
      const size = o.watermark.fontSize;
      const textW = textFont.widthOfTextAtSize(o.watermark.text, size);
      const pos = positionToXY(o.watermark.position);
      const x = WATERMARK_PADDING + (sizeW - WATERMARK_PADDING * 2 - textW) * pos.x;
      const y = WATERMARK_PADDING + (sizeH - WATERMARK_PADDING * 2 - size) * pos.y;
      const c = hexToRgb01(o.watermark.color);
      page.drawText(o.watermark.text, {
        x,
        y,
        size,
        font: textFont,
        color: rgb(c.r, c.g, c.b),
        opacity: o.watermark.opacity,
        rotate: degrees(-o.watermark.rotation),
      });
    } else if (o.watermark.mode === "image" && wmImage) {
      const wmW = sizeW * (o.watermark.imageScale / 100);
      const wmH = (wmImage.height / wmImage.width) * wmW;
      const pos = positionToXY(o.watermark.position);
      const x = WATERMARK_PADDING + (sizeW - WATERMARK_PADDING * 2 - wmW) * pos.x;
      const y = WATERMARK_PADDING + (sizeH - WATERMARK_PADDING * 2 - wmH) * pos.y;
      page.drawImage(wmImage, { x, y, width: wmW, height: wmH, opacity: o.watermark.imageOpacity });
    }

    if (o.pageNumbers.enabled) {
      const numText = formatPageNumber(o.pageNumbers.format, i + 1, compressed.length);
      if (!textFont) textFont = await pdf.embedFont(StandardFonts.Helvetica);
      const size = 11;
      const textW = textFont.widthOfTextAtSize(numText, size);
      const pos = positionToXY(o.pageNumbers.position);
      const pad = 22;
      const x = pad + (sizeW - pad * 2 - textW) * pos.x;
      const y = pad + (sizeH - pad * 2 - size) * pos.y;
      page.drawText(numText, { x, y, size, font: textFont, color: rgb(0.15, 0.15, 0.15) });
    }

    ctx.item(i + 1, compressed.length);
  }

  ctx.stage(4, "Serialising PDF");
  const bytes = await pdf.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });

  ctx.stage(5, "Checking the generated PDF");
  const pageCount = await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()), compressed.length);

  const base = ctx.files.length === 1 ? sanitizeFileName(ctx.files[0].name) : "pixelpress-images";
  return [
    {
      name: sanitizeOutputName(base, "-pdf", "pdf"),
      blob,
      size: blob.size,
      kind: "pdf",
      pages: pageCount,
    },
  ];
}

function formatPageNumber(fmt: string, n: number, total: number): string {
  switch (fmt) {
    case "n-slash-total":
      return `${n} / ${total}`;
    case "page-n":
      return `Page ${n}`;
    case "page-n-of-total":
      return `Page ${n} of ${total}`;
    default:
      return `${n}`;
  }
}

export function pageSizePoints(o: ImgToPdfOptions): [number, number] {
  let w: number;
  let h: number;
  if (o.pageSize === "CUSTOM") {
    w = o.customW * MM_TO_PT;
    h = o.customH * MM_TO_PT;
  } else {
    const s = PAGE_SIZES_PT[o.pageSize] ?? PAGE_SIZES_PT.A4;
    w = s[0];
    h = s[1];
  }
  const lo = Math.min(w, h);
  const hi = Math.max(w, h);
  return o.orientation === "landscape" ? [hi, lo] : [lo, hi];
}

export async function mergePdf(ctx: RunCtx): Promise<OutputFile[]> {
  ctx.stage(0, "Opening PDFs");
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  out.setProducer("PixelPress");
  out.setCreator("PixelPress (local processing)");
  let totalPages = 0;

  ctx.stage(2, "Copying pages into the merged document");
  for (let i = 0; i < ctx.files.length; i++) {
    throwIfAborted(ctx.signal);
    const src = await readPdfWithLib(ctx.files[i]);
    const indices = src.getPageIndices();
    const copied = await out.copyPages(src, indices);
    for (const p of copied) out.addPage(p);
    totalPages += indices.length;
    ctx.item(i + 1, ctx.files.length);
  }

  ctx.stage(4, "Serialising merged PDF");
  const bytes = await out.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });

  ctx.stage(5, "Checking the merged PDF");
  const count = await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()), totalPages);

  const base = ctx.files.length === 1 ? sanitizeFileName(ctx.files[0].name) : "pixelpress-merged";
  return [
    {
      name: sanitizeOutputName(base, "-merged", "pdf"),
      blob,
      size: blob.size,
      kind: "pdf",
      pages: count,
    },
  ];
}

export async function compressPdf(ctx: RunCtx): Promise<OutputFile[]> {
  const level = String(ctx.options.level ?? "balanced");
  const file = ctx.files[0];

  if (level === "light") {
    ctx.stage(2, "Optimising PDF structure");
    const doc = await readPdfWithLib(file);
    ctx.stage(4, "Serialising with object streams");
    const bytes = await doc.save({ useObjectStreams: true, updateFieldAppearances: false });
    let blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
    const notes: string[] = [];
    if (blob.size >= file.size) {
      blob = new Blob([await file.arrayBuffer()], { type: "application/pdf" });
      notes.push(
        "Lossless optimisation could not shrink this PDF — it is already well compressed. The original file is returned unchanged."
      );
    }
    ctx.stage(5, "Checking the output");
    await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()));
    return [
      {
        name: sanitizeOutputName(file.name, "-compressed", "pdf"),
        blob,
        size: blob.size,
        kind: "pdf",
      },
    ];
  }

  const scale = level === "extreme" ? 96 / 72 : 144 / 72;
  const jpegQuality = level === "extreme" ? 0.5 : 0.72;

  ctx.stage(0, "Reading PDF structure");
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const src = await pdfjs
    .getDocument({ data, standardFontDataUrl: "/pdf/standard_fonts/", wasmUrl: "/pdf/wasm/" })
    .promise;
  const numPages = src.numPages;

  ctx.stage(2, "Rasterising pages");
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  out.setProducer("PixelPress");
  out.setCreator("PixelPress (local processing)");

  for (let i = 1; i <= numPages; i++) {
    throwIfAborted(ctx.signal);
    const page = await src.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const c2d = canvas.getContext("2d");
    if (!c2d) throw new Error("Canvas is not supported in this browser.");
    c2d.fillStyle = "#ffffff";
    c2d.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: c2d, viewport }).promise;
    const jpegBytes = await canvasToJpegBytes(canvas, jpegQuality);
    const embedded = await out.embedJpg(jpegBytes);
    const newPage = out.addPage([baseViewport.width, baseViewport.height]);
    newPage.drawImage(embedded, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
    canvas.width = 0;
    canvas.height = 0;
    ctx.item(i, numPages);
  }
  void src.cleanup();

  ctx.stage(4, "Serialising compressed PDF");
  const bytes = await out.save({ useObjectStreams: true });
  let blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const notes: string[] = [
    level === "extreme"
      ? "Extreme mode rasterises pages into 96 DPI JPEG images. Text becomes part of the image and is no longer selectable."
      : "Balanced mode rasterises pages into 144 DPI JPEG images. Text becomes part of the image and is no longer selectable.",
  ];
  if (blob.size >= file.size) {
    blob = new Blob([await file.arrayBuffer()], { type: "application/pdf" });
    notes.push(
      "The rasterised result was larger than the original, so the original file is returned unchanged. This PDF is already heavily compressed."
    );
  }
  ctx.stage(5, "Checking the output");
  await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()));

  return [
    {
      name: sanitizeOutputName(file.name, "-compressed", "pdf"),
      blob,
      size: blob.size,
      kind: "pdf",
    },
  ];
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number): Promise<ArrayBuffer> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Could not encode a page while compressing the PDF.");
  return blob.arrayBuffer();
}

export async function extractPages(ctx: RunCtx): Promise<OutputFile[]> {
  const ranges = String(ctx.options.ranges ?? "");
  ctx.stage(0, "Reading the PDF");
  const src = await readPdfWithLib(ctx.files[0]);
  const total = src.getPageCount();

  ctx.stage(2, "Parsing your selection");
  const indices = parsePageRanges(ranges, total);

  ctx.stage(3, "Building the extracted PDF");
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  out.setProducer("PixelPress");
  out.setCreator("PixelPress (local processing)");
  const copied = await out.copyPages(src, indices.map((p) => p - 1));
  for (const p of copied) out.addPage(p);

  ctx.stage(4, "Serialising PDF");
  const bytes = await out.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });

  ctx.stage(5, "Checking the extracted PDF");
  const count = await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()), indices.length);

  return [
    {
      name: sanitizeOutputName(ctx.files[0].name, "-extract", "pdf"),
      blob,
      size: blob.size,
      kind: "pdf",
      pages: count,
    },
  ];
}

export async function organisePdf(ctx: RunCtx): Promise<OutputFile[]> {
  const pagePlan = ctx.options.pages as { index: number; rotation: number }[];
  ctx.stage(0, "Reading the PDF");
  const src = await readPdfWithLib(ctx.files[0]);

  ctx.stage(3, "Rebuilding page order");
  const { PDFDocument, degrees } = await import("pdf-lib");
  const out = await PDFDocument.create();
  out.setProducer("PixelPress");
  out.setCreator("PixelPress (local processing)");
  const uniqueIndices = [...new Set(pagePlan.map((p) => p.index))];
  const copied = await out.copyPages(src, uniqueIndices);
  const copiedByIndex = new Map<number, (typeof copied)[number]>();
  uniqueIndices.forEach((idx, i) => copiedByIndex.set(idx, copied[i]));

  for (let i = 0; i < pagePlan.length; i++) {
    throwIfAborted(ctx.signal);
    const plan = pagePlan[i];
    const page = copiedByIndex.get(plan.index);
    if (!page) throw new Error("Internal error while reorganising pages.");
    out.addPage(page);
    page.setRotation(degrees(((plan.rotation % 360) + 360) % 360));
    ctx.item(i + 1, pagePlan.length);
  }

  ctx.stage(4, "Serialising PDF");
  const bytes = await out.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });

  ctx.stage(5, "Checking the organised PDF");
  const count = await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()), pagePlan.length);

  return [
    {
      name: sanitizeOutputName(ctx.files[0].name, "-organised", "pdf"),
      blob,
      size: blob.size,
      kind: "pdf",
      pages: count,
    },
  ];
}

export async function watermarkPdf(ctx: RunCtx): Promise<OutputFile[]> {
  const o = ctx.options;
  ctx.stage(0, "Reading the PDF");
  const { PDFDocument, StandardFonts, degrees, rgb } = await import("pdf-lib");
  const doc = await readPdfWithLib(ctx.files[0]);
  const total = doc.getPageCount();

  ctx.stage(2, "Preparing watermark");
  let pages: number[];
  if (o.pages === "all") {
    pages = Array.from({ length: total }, (_, i) => i);
  } else {
    pages = parsePageRanges(String(o.pages ?? ""), total).map((p) => p - 1);
  }
  if (pages.length === 0) throw new Error("No pages matched your selection.");

  let font: Awaited<ReturnType<PDFDocument["embedFont"]>> | null = null;
  if (o.mode === "text") {
    const fontMap: Record<string, import("pdf-lib").StandardFonts> = {
      helvetica: StandardFonts.Helvetica,
      "helvetica-bold": StandardFonts.HelveticaBold,
      times: StandardFonts.TimesRoman,
      "times-bold": StandardFonts.TimesRomanBold,
      courier: StandardFonts.Courier,
      "courier-bold": StandardFonts.CourierBold,
    };
    const chosen = fontMap[String(o.font ?? "helvetica-bold")] ?? StandardFonts.HelveticaBold;
    font = await doc.embedFont(chosen);
    if (!String(o.text ?? "").trim()) throw new Error("Enter the watermark text first.");
  }
  let wmImage: PDFImage | null = null;
  if (o.mode === "image") {
    const imageFile = o.imageFile as File | undefined;
    if (!imageFile) throw new Error("Choose a watermark image first.");
    const bytes = await imageFile.arrayBuffer();
    try {
      wmImage = imageFile.type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    } catch {
      throw new Error("The watermark image could not be read. Use a JPG or PNG file.");
    }
  }

  ctx.stage(3, "Stamping pages");
  const color = hexToRgb01(String(o.color ?? "#111111"));
  const allPages = doc.getPages();
  let done = 0;
  for (const pageIndex of pages) {
    throwIfAborted(ctx.signal);
    const page = allPages[pageIndex];
    const { width, height } = page.getSize();
    const pos = positionToXY(String(o.position ?? "center"));
    if (o.mode === "text" && font) {
      const text = String(o.text);
      const size = Number(o.fontSize ?? 48);
      const textW = font.widthOfTextAtSize(text, size);
      const pad = 24;
      const x = pad + (width - pad * 2 - textW) * pos.x;
      const y = pad + (height - pad * 2 - size) * pos.y;
      page.drawText(text, {
        x,
        y,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: Number(o.opacity ?? 0.35),
        rotate: degrees(-Number(o.rotation ?? 0)),
      });
    } else if (wmImage) {
      const wmW = width * (Number(o.imageScale ?? 40) / 100);
      const wmH = (wmImage.height / wmImage.width) * wmW;
      const pad = 24;
      const x = pad + (width - pad * 2 - wmW) * pos.x;
      const y = pad + (height - pad * 2 - wmH) * pos.y;
      page.drawImage(wmImage, { x, y, width: wmW, height: wmH, opacity: Number(o.opacity ?? 0.35) });
    }
    done++;
    ctx.item(done, pages.length);
  }

  ctx.stage(4, "Serialising PDF");
  const bytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });

  ctx.stage(5, "Checking the watermarked PDF");
  await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()), total);

  return [
    {
      name: sanitizeOutputName(ctx.files[0].name, "-watermarked", "pdf"),
      blob,
      size: blob.size,
      kind: "pdf",
      pages: total,
    },
  ];
}

export async function splitPdf(ctx: RunCtx): Promise<OutputFile[]> {
  const mode = String(ctx.options.mode ?? "ranges");
  ctx.stage(0, "Reading the PDF");
  const src = await readPdfWithLib(ctx.files[0]);
  const total = src.getPageCount();
  const { PDFDocument } = await import("pdf-lib");

  let groups: number[][] = [];
  if (mode === "ranges") {
    const parts = String(ctx.options.ranges ?? "")
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) throw new Error("Enter at least one range, e.g. 1-3.");
    for (const part of parts) {
      groups.push(parsePageRanges(part, total));
    }
  } else if (mode === "interval") {
    const n = Math.max(1, Math.floor(Number(ctx.options.interval ?? 1)));
    for (let start = 1; start <= total; start += n) {
      const end = Math.min(total, start + n - 1);
      groups.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
    }
  } else {
    groups = Array.from({ length: total }, (_, i) => [i + 1]);
  }

  ctx.stage(3, "Cutting the PDF");
  const base = sanitizeFileName(ctx.files[0].name);
  const outputs: OutputFile[] = [];
  for (let g = 0; g < groups.length; g++) {
    throwIfAborted(ctx.signal);
    const indices = groups[g];
    const out = await PDFDocument.create();
    out.setProducer("PixelPress");
    out.setCreator("PixelPress (local processing)");
    const copied = await out.copyPages(src, indices.map((p) => p - 1));
    for (const p of copied) out.addPage(p);
    const bytes = await out.save({ useObjectStreams: true });
    const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
    const count = await verifyPdfBytes(new Uint8Array(await blob.arrayBuffer()), indices.length);
    const label = groups.length > 1 ? `-part${g + 1}` : "-split";
    outputs.push({
      name: sanitizeOutputName(base, label, "pdf"),
      blob,
      size: blob.size,
      kind: "pdf",
      pages: count,
      sourceIndex: g,
    });
    ctx.item(g + 1, groups.length);
  }

  ctx.stage(5, "Checking all parts");
  return outputs;
}

export async function makeZipFromOutputs(
  outputs: { name: string; blob: Blob }[],
  onItem: (done: number, total: number) => void
): Promise<Blob> {
  return buildZip(outputs, onItem);
}
