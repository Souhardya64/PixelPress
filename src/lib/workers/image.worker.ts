export interface ImagePayload {
  file: File;
  format: string;
  quality: number;
  background?: string;
  maxEdge?: number | null;
  targetW?: number | null;
  targetH?: number | null;
  fit?: "cover" | "contain" | "stretch";
  rotation?: number;
  crop?: { x: number; y: number; w: number; h: number } | null;
  aspectCrop?: number | null;
}

export interface WorkerResult {
  blob: Blob;
  width: number;
  height: number;
}

function isQuarterTurn(rotation: number): boolean {
  const r = ((rotation % 360) + 360) % 360;
  return r === 90 || r === 270;
}

function dimsAfterRotation(w: number, h: number, rotation: number): [number, number] {
  return isQuarterTurn(rotation) ? [h, w] : [w, h];
}

function centerCropToAspect(sx: number, sy: number, sw: number, sh: number, aspect: number): [number, number, number, number] {
  let w = sw;
  let h = w / aspect;
  if (h > sh) {
    h = sh;
    w = sh * aspect;
  }
  const x = sx + (sw - w) / 2;
  const y = sy + (sh - h) / 2;
  return [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
}

async function processImage(payload: ImagePayload): Promise<WorkerResult> {
  const bitmap = await createImageBitmap(payload.file);
  try {
    const rotation = payload.rotation ?? 0;
    let sx = 0;
    let sy = 0;
    let sw = bitmap.width;
    let sh = bitmap.height;

    if (payload.crop) {
      const c = payload.crop;
      sx = Math.round(c.x * bitmap.width);
      sy = Math.round(c.y * bitmap.height);
      sw = Math.max(1, Math.round(c.w * bitmap.width));
      sh = Math.max(1, Math.round(c.h * bitmap.height));
      sx = Math.max(0, Math.min(sx, bitmap.width - 1));
      sy = Math.max(0, Math.min(sy, bitmap.height - 1));
      sw = Math.min(sw, bitmap.width - sx);
      sh = Math.min(sh, bitmap.height - sy);
    }

    let canvasW: number;
    let canvasH: number;
    let drawW = sw;
    let drawH = sh;
    const hasTarget = !!payload.targetW && !!payload.targetH;

    if (hasTarget) {
      const tW = payload.targetW as number;
      const tH = payload.targetH as number;
      canvasW = tW;
      canvasH = tH;
      if (payload.fit === "stretch") {
        if (isQuarterTurn(rotation)) {
          drawW = tH;
          drawH = tW;
        } else {
          drawW = tW;
          drawH = tH;
        }
      } else {
        const coverScale = isQuarterTurn(rotation)
          ? Math.max(tW / sh, tH / sw)
          : Math.max(tW / sw, tH / sh);
        const containScale = isQuarterTurn(rotation)
          ? Math.min(tW / sh, tH / sw)
          : Math.min(tW / sw, tH / sh);
        const scale = payload.fit === "cover" ? coverScale : containScale;
        drawW = sw * scale;
        drawH = sh * scale;
      }
    } else if (payload.aspectCrop) {
      [sx, sy, sw, sh] = centerCropToAspect(sx, sy, sw, sh, payload.aspectCrop);
      const [rw, rh] = dimsAfterRotation(sw, sh, rotation);
      canvasW = rw;
      canvasH = rh;
    } else {
      if (payload.maxEdge && Math.max(sw, sh) > payload.maxEdge) {
        const scale = payload.maxEdge / Math.max(sw, sh);
        sw = Math.max(1, Math.round(sw * scale));
        sh = Math.max(1, Math.round(sh * scale));
      }
      const [rw, rh] = dimsAfterRotation(sw, sh, rotation);
      canvasW = rw;
      canvasH = rh;
      drawW = sw;
      drawH = sh;
    }

    const canvas = new OffscreenCanvas(canvasW, canvasH);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");

    const hasAlphaTarget = payload.format === "image/png" || payload.format === "image/webp";
    const bg = payload.background && payload.background !== "transparent" ? payload.background : null;
    if (!hasAlphaTarget || bg) {
      ctx.fillStyle = bg ?? "#ffffff";
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(bitmap, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const blob = await canvas.convertToBlob({ type: payload.format, quality: payload.quality });
    return { blob, width: canvasW, height: canvasH };
  } finally {
    bitmap.close();
  }
}

export async function handleOnMainThread(payload: ImagePayload): Promise<WorkerResult> {
  return processImage(payload);
}

if (typeof self !== "undefined" && typeof (self as { document?: unknown }).document === "undefined") {
  self.onmessage = async (event: MessageEvent<{ id: number; payload: ImagePayload }>) => {
    const { id, payload } = event.data;
    try {
      const result = await processImage(payload);
      (self as unknown as Worker).postMessage({ id, ok: true, result });
    } catch (err) {
      (self as unknown as Worker).postMessage({
        id,
        ok: false,
        error: err instanceof Error ? err.message : "Image processing failed",
      });
    }
  };
}
