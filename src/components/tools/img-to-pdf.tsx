"use client";

import { useMemo, useState } from "react";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { ImageReorderGrid, type ImageEntry } from "@/components/pixelpress/image-reorder-grid";
import { PPButton } from "@/components/pixelpress/pp-button";
import {
  ColorInput,
  Field,
  OptionSection,
  PPCheck,
  PPInput,
  PPRange,
  PPSelect,
  SegmentedControl,
} from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { estimateImageToPdfSize } from "@/lib/impls/shared";
import { formatBytes } from "@/lib/format";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("image-to-pdf")!;

export function ImageToPdfTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const { start, starting } = useStartJob(tool.id);

  const [quality, setQuality] = useState(80);
  const [pageSize, setPageSize] = useState<"A4" | "A3" | "LETTER" | "CUSTOM">("A4");
  const [customW, setCustomW] = useState(210);
  const [customH, setCustomH] = useState(297);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState(10);
  const [fit, setFit] = useState<"fit" | "fill" | "original">("fit");
  const [bg, setBg] = useState("#ffffff");
  const [wmMode, setWmMode] = useState<"none" | "text" | "image">("none");
  const [wmText, setWmText] = useState("PIXELPRESS");
  const [wmFontSize, setWmFontSize] = useState(48);
  const [wmColor, setWmColor] = useState("#111111");
  const [wmOpacity, setWmOpacity] = useState(30);
  const [wmRotation, setWmRotation] = useState(45);
  const [wmPosition, setWmPosition] = useState("center");
  const [wmImageFile, setWmImageFile] = useState<File | null>(null);
  const [wmImageScale, setWmImageScale] = useState(40);
  const [pageNums, setPageNums] = useState(false);
  const [pageNumPos, setPageNumPos] = useState("bottom-center");
  const [pageNumFmt, setPageNumFmt] = useState<"n" | "n-slash-total" | "page-n" | "page-n-of-total">("n");

  const ingest = (incoming: PPFileEntry[]) => {
    setFiles(incoming);
    const byId = new Map(incoming.map((f) => [f.id, f]));
    setImages((prev) => {
      const kept = prev.filter((p) => byId.has(p.id));
      const existing = new Set(kept.map((p) => p.id));
      const added = incoming
        .filter((f) => !existing.has(f.id))
        .map((f) => ({ id: f.id, file: f.file, rotation: 0, url: URL.createObjectURL(f.file) }));
      return [...kept, ...added];
    });
  };

  const estimated = useMemo(
    () => estimateImageToPdfSize(files.map((f) => f.file), quality / 100),
    [files, quality]
  );

  const canRun = files.length > 0 && !starting;

  const onStart = () => {
    void start(
      images.map((img) => img.file),
      {
        quality: quality / 100,
        pageSize,
        customW,
        customH,
        orientation,
        margin,
        fit,
        bg,
        watermark: {
          mode: wmMode,
          text: wmText,
          fontSize: wmFontSize,
          opacity: wmOpacity / 100,
          rotation: wmRotation,
          position: wmPosition,
          color: wmColor,
          imageFile: wmImageFile,
          imageScale: wmImageScale,
          imageOpacity: wmOpacity / 100,
        },
        pageNumbers: {
          enabled: pageNums,
          position: pageNumPos,
          format: pageNumFmt,
        },
      }
    );
  };

  const positions = [
    "top-left", "top-center", "top-right",
    "middle-left", "center", "middle-right",
    "bottom-left", "bottom-center", "bottom-right",
  ];

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={ingest}
      canRun={canRun}
      onStart={onStart}
      busyHint={starting ? "Starting…" : `Estimated PDF size: ≈ ${formatBytes(estimated)} (final size is shown after processing).`}
      customPanel={
        <ImageReorderGrid
          images={images}
          onChange={(next) => {
            setImages(next);
            const byId = new Set(next.map((n) => n.id));
            setFiles(files.filter((f) => byId.has(f.id)));
          }}
        />
      }
      options={
        <>
          <OptionSection title="Image quality">
            <Field label={`Compression quality — ${quality}%`} hint="Lower quality means smaller files. Images are compressed before the PDF is built.">
              <PPRange value={quality} min={40} max={95} onChange={setQuality} ariaLabel="Image quality" />
            </Field>
          </OptionSection>

          <OptionSection title="Page setup">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Page size">
                <PPSelect value={pageSize} onChange={(e) => setPageSize(e.target.value as typeof pageSize)}>
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="A3">A3 (297 × 420 mm)</option>
                  <option value="LETTER">Letter (216 × 279 mm)</option>
                  <option value="CUSTOM">Custom size</option>
                </PPSelect>
              </Field>
              <Field label="Orientation" hint={pageSize === "CUSTOM" ? "Flips your custom width and height." : undefined}>
                <SegmentedControl
                  value={orientation}
                  onChange={setOrientation}
                  options={[
                    { value: "portrait", label: "Portrait" },
                    { value: "landscape", label: "Landscape" },
                  ]}
                />
              </Field>
              {pageSize === "CUSTOM" && (
                <>
                  <Field label="Custom width (mm)">
                    <PPInput type="number" min={10} max={2000} value={customW} onChange={(e) => setCustomW(Math.max(10, Number(e.target.value) || 10))} />
                  </Field>
                  <Field label="Custom height (mm)">
                    <PPInput type="number" min={10} max={2000} value={customH} onChange={(e) => setCustomH(Math.max(10, Number(e.target.value) || 10))} />
                  </Field>
                </>
              )}
              <Field label={`Margins — ${margin} mm each side`}>
                <PPRange value={margin} min={0} max={30} onChange={setMargin} ariaLabel="Page margins" />
              </Field>
              <Field label="Image sizing">
                <PPSelect value={fit} onChange={(e) => setFit(e.target.value as typeof fit)}>
                  <option value="fit">Fit inside page (no crop)</option>
                  <option value="fill">Fill page (centre crop)</option>
                  <option value="original">Original size (1px ≈ 0.75pt)</option>
                </PPSelect>
              </Field>
              <Field label="Background colour" hint="Applied behind each page and used to flatten transparency.">
                <ColorInput value={bg} onChange={setBg} label="Background colour" />
              </Field>
            </div>
          </OptionSection>

          <OptionSection title="Watermark" defaultOpen={false}>
            <Field label="Watermark type">
              <SegmentedControl
                value={wmMode}
                onChange={setWmMode}
                options={[
                  { value: "none", label: "None" },
                  { value: "text", label: "Text" },
                  { value: "image", label: "Image" },
                ]}
              />
            </Field>

            {wmMode === "text" && (
              <>
                <Field label="Watermark text">
                  <PPInput value={wmText} onChange={(e) => setWmText(e.target.value)} maxLength={80} placeholder="CONFIDENTIAL" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`Font size — ${wmFontSize}pt`}>
                    <PPRange value={wmFontSize} min={12} max={120} onChange={setWmFontSize} ariaLabel="Watermark font size" />
                  </Field>
                  <Field label={`Opacity — ${wmOpacity}%`}>
                    <PPRange value={wmOpacity} min={5} max={100} onChange={setWmOpacity} ariaLabel="Watermark opacity" />
                  </Field>
                  <Field label={`Rotation — ${wmRotation}°`}>
                    <PPRange value={wmRotation} min={0} max={90} onChange={setWmRotation} ariaLabel="Watermark rotation" />
                  </Field>
                  <Field label="Colour">
                    <ColorInput value={wmColor} onChange={setWmColor} label="Watermark colour" />
                  </Field>
                </div>
                <Field label="Position">
                  <PPSelect value={wmPosition} onChange={(e) => setWmPosition(e.target.value)}>
                    {positions.map((p) => (
                      <option key={p} value={p}>{p.replace(/-/g, " ")}</option>
                    ))}
                  </PPSelect>
                </Field>
              </>
            )}

            {wmMode === "image" && (
              <>
                <Field label="Watermark image (JPG or PNG, transparency supported)">
                  <PPInput
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => setWmImageFile(e.target.files?.[0] ?? null)}
                  />
                </Field>
                {wmImageFile && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`Width — ${wmImageScale}% of page width`}>
                      <PPRange value={wmImageScale} min={5} max={100} onChange={setWmImageScale} ariaLabel="Watermark width" />
                    </Field>
                    <Field label={`Opacity — ${wmOpacity}%`}>
                      <PPRange value={wmOpacity} min={5} max={100} onChange={setWmOpacity} ariaLabel="Watermark opacity" />
                    </Field>
                  </div>
                )}
                <Field label="Position">
                  <PPSelect value={wmPosition} onChange={(e) => setWmPosition(e.target.value)}>
                    {positions.map((p) => (
                      <option key={p} value={p}>{p.replace(/-/g, " ")}</option>
                    ))}
                  </PPSelect>
                </Field>
              </>
            )}
          </OptionSection>

          <OptionSection title="Page numbers" defaultOpen={false}>
            <PPCheck checked={pageNums} onChange={setPageNums} label="Add page numbers to every page" />
            {pageNums && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Position">
                  <PPSelect value={pageNumPos} onChange={(e) => setPageNumPos(e.target.value)}>
                    {positions.map((p) => (
                      <option key={p} value={p}>{p.replace(/-/g, " ")}</option>
                    ))}
                  </PPSelect>
                </Field>
                <Field label="Format">
                  <PPSelect value={pageNumFmt} onChange={(e) => setPageNumFmt(e.target.value as typeof pageNumFmt)}>
                    <option value="n">1</option>
                    <option value="n-slash-total">1 / 12</option>
                    <option value="page-n">Page 1</option>
                    <option value="page-n-of-total">Page 1 of 12</option>
                  </PPSelect>
                </Field>
              </div>
            )}
          </OptionSection>
        </>
      }
    />
  );
}
