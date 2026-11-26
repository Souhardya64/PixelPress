"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { ColorInput, Field, OptionSection, PPCheck, PPInput, PPRange, PPSelect, SegmentedControl } from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("resize-crop")!;

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: "1080 × 1080 (square)", w: 1080, h: 1080 },
  { label: "1080 × 1350 (portrait 4:5)", w: 1080, h: 1350 },
  { label: "1920 × 1080 (Full HD)", w: 1920, h: 1080 },
  { label: "1280 × 720 (HD)", w: 1280, h: 720 },
  { label: "1200 × 630 (social card)", w: 1200, h: 630 },
  { label: "2480 × 3508 (A4 300dpi)", w: 2480, h: 3508 },
];

export function ResizeCropTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [targetW, setTargetW] = useState<number | null>(null);
  const [targetH, setTargetH] = useState<number | null>(null);
  const [lockAspect, setLockAspect] = useState(true);
  const [fit, setFit] = useState<"cover" | "contain" | "stretch">("cover");
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 1, h: 1 });
  const [format, setFormat] = useState("auto");
  const [quality, setQuality] = useState(90);
  const [bg, setBg] = useState("#ffffff");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDims, setPreviewDims] = useState<{ w: number; h: number } | null>(null);
  const dragRef = useRef<{ mode: "move" | "resize"; startX: number; startY: number; crop: CropRect } | null>(null);
  const { start, starting } = useStartJob(tool.id);

  const firstFile = files[0]?.file ?? null;

  useEffect(() => {
    if (!firstFile) {
      setPreviewUrl(null);
      setPreviewDims(null);
      return;
    }
    const url = URL.createObjectURL(firstFile);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => setPreviewDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [firstFile]);

  const effectiveTarget = useMemo(() => {
    if (!previewDims) return null;
    if (targetW && targetH) return { w: targetW, h: targetH };
    if (rotation === 90 || rotation === 270) {
      return { w: previewDims.h, h: previewDims.w };
    }
    return previewDims;
  }, [previewDims, targetW, targetH, rotation]);

  const applyPreset = (w: number, h: number) => {
    setTargetW(w);
    setTargetH(h);
    if (previewDims && lockAspect) {
      const ratio = previewDims.w / previewDims.h;
      const targetRatio = w / h;
      if (Math.abs(ratio - targetRatio) > 0.01) {
        setFit("cover");
      }
    }
  };

  const onWidthChange = (w: number | null) => {
    setTargetW(w);
    if (lockAspect && w && previewDims) {
      const ratio = previewDims.w / previewDims.h;
      setTargetH(Math.round(w / ratio));
    }
  };

  const onHeightChange = (h: number | null) => {
    setTargetH(h);
    if (lockAspect && h && previewDims) {
      const ratio = previewDims.w / previewDims.h;
      setTargetW(Math.round(h * ratio));
    }
  };

  const resolvedFormat = format === "auto" ? (firstFile?.type === "image/png" ? "image/png" : "image/jpeg") : format;

  const pointerHandlers = {
    onPointerDown: (e: React.PointerEvent, mode: "move" | "resize") => {
      if (!previewDims) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = { mode, startX: e.clientX, startY: e.clientY, crop: { ...crop } };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !previewDims) return;
      const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const dx = (e.clientX - drag.startX) / box.width;
      const dy = (e.clientY - drag.startY) / box.height;
      if (drag.mode === "move") {
        const x = Math.min(1 - drag.crop.w, Math.max(0, drag.crop.x + dx));
        const y = Math.min(1 - drag.crop.h, Math.max(0, drag.crop.y + dy));
        setCrop({ ...drag.crop, x, y });
      } else {
        const w = Math.min(1 - drag.crop.x, Math.max(0.1, drag.crop.w + dx));
        const h = Math.min(1 - drag.crop.y, Math.max(0.1, drag.crop.h + dy));
        setCrop({ ...drag.crop, w, h });
      }
    },
    onPointerUp: () => {
      dragRef.current = null;
    },
  };

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={(next) => {
        setFiles(next);
        setCrop({ x: 0, y: 0, w: 1, h: 1 });
      }}
      canRun={files.length > 0 && !starting}
      runLabel={starting ? "Starting…" : tool.action}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          {
            targetW: effectiveTarget?.w ?? null,
            targetH: effectiveTarget?.h ?? null,
            fit,
            rotation,
            crop,
            format: resolvedFormat,
            quality: quality / 100,
            bg,
          }
        )
      }
      busyHint={`Settings below apply to all ${files.length || ""} image${files.length === 1 ? "" : "s"}.`}
      fileThumb="image"
      options={
        <>
          <OptionSection title="Live crop preview">
            <div
              className="relative mx-auto w-full max-w-md select-none overflow-hidden border-2 border-obsidian bg-obsidian/5"
              style={{ aspectRatio: previewDims ? `${previewDims.w} / ${previewDims.h}` : "4 / 3" }}
              {...pointerHandlers}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) pointerHandlers.onPointerDown(e, "move");
              }}
            >
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Crop preview" className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-60" draggable={false} />
              )}
              <div
                className="pointer-events-none absolute border-[3px] border-pixel bg-transparent"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.w * 100}%`,
                  height: `${crop.h * 100}%`,
                  boxShadow: "0 0 0 9999px rgba(17,17,17,0.45)",
                }}
              />
              <div
                role="button"
                aria-label="Resize crop area"
                className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize border-l-2 border-t-2 border-pixel bg-pixel/80"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  pointerHandlers.onPointerDown(e, "resize");
                }}
              />
            </div>
            <p className="pp-label mt-2 text-center text-obsidian/60">Drag inside the frame to move · corner handle to resize the crop</p>
          </OptionSection>

          <OptionSection title="Output size">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Width (px)">
                <PPInput
                  type="number"
                  min={16}
                  value={effectiveTarget?.w ?? ""}
                  placeholder={previewDims ? String(previewDims.w) : "auto"}
                  onChange={(e) => onWidthChange(e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label="Height (px)">
                <PPInput
                  type="number"
                  min={16}
                  value={effectiveTarget?.h ?? ""}
                  placeholder={previewDims ? String(previewDims.h) : "auto"}
                  onChange={(e) => onHeightChange(e.target.value ? Number(e.target.value) : null)}
                />
              </Field>
              <Field label="Keep aspect ratio">
                <PPCheck checked={lockAspect} onChange={setLockAspect} label="Lock ratio" />
              </Field>
            </div>
            <Field label="Presets">
              <PPSelect
                value=""
                onChange={(e) => {
                  const preset = PRESETS.find((p) => p.label === e.target.value);
                  if (preset) applyPreset(preset.w, preset.h);
                }}
              >
                <option value="">Choose a preset…</option>
                {PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </PPSelect>
            </Field>
            <Field label="Sizing when ratio differs">
              <SegmentedControl
                value={fit}
                onChange={setFit}
                options={[
                  { value: "cover", label: "Cover (crop)" },
                  { value: "contain", label: "Contain (bars)" },
                  { value: "stretch", label: "Stretch" },
                ]}
              />
            </Field>
            {fit === "contain" && <ColorInput value={bg} onChange={setBg} label="Bar colour" />}
          </OptionSection>

          <OptionSection title="Rotate & output">
            <Field label="Rotation">
              <SegmentedControl
                value={String(rotation) as "0" | "90" | "180" | "270"}
                onChange={(v) => setRotation(Number(v))}
                options={[
                  { value: "0", label: "0°" },
                  { value: "90", label: "90°" },
                  { value: "180", label: "180°" },
                  { value: "270", label: "270°" },
                ]}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Output format">
                <PPSelect value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="auto">Auto (like input)</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WEBP</option>
                </PPSelect>
              </Field>
              <Field label={`Quality — ${quality}%`} hint="Used for JPG and WEBP output.">
                <PPRange value={quality} min={30} max={100} onChange={setQuality} ariaLabel="Output quality" />
              </Field>
            </div>
          </OptionSection>
        </>
      }
    />
  );
}
