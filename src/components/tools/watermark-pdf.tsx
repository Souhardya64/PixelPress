"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { PdfPagesPanel, type PdfPageEntry } from "@/components/pixelpress/pdf-pages-panel";
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
import { loadPdfDoc } from "@/lib/pdf-client";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("watermark-pdf")!;

const POSITIONS = [
  "top-left", "top-center", "top-right",
  "middle-left", "center", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

export function WatermarkPdfTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [entries, setEntries] = useState<PdfPageEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allPages, setAllPages] = useState(true);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [font, setFont] = useState("helvetica-bold");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#111111");
  const [opacity, setOpacity] = useState(35);
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState("center");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageScale, setImageScale] = useState(40);
  const { start, starting } = useStartJob(tool.id);

  useEffect(() => {
    let alive = true;
    (async () => {
      const entry = files[0];
      if (!entry) {
        setEntries([]);
        setSelected(new Set());
        return;
      }
      try {
        const { numPages } = await loadPdfDoc(entry.id, entry.file);
        if (!alive) return;
        setEntries(Array.from({ length: numPages }, (_, i) => ({ key: `p${i}`, index: i, rotation: 0 })));
        setSelected(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not read this PDF.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [files]);

  const pagesValue = allPages ? "all" : [...selected].map((k) => (entries.find((e) => e.key === k)?.index ?? -1) + 1).filter((n) => n > 0).sort((a, b) => a - b).join(",");
  const canRun = files.length > 0 && entries.length > 0 && !starting && (allPages || selected.size > 0) && (mode === "text" ? text.trim().length > 0 : !!imageFile);

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={(next) => {
        setFiles(next.slice(0, 1));
        if (!next.length) {
          setEntries([]);
          setSelected(new Set());
        }
      }}
      canRun={canRun}
      runLabel={starting ? "Starting…" : tool.action}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          {
            mode,
            text,
            font,
            fontSize,
            color,
            opacity: opacity / 100,
            rotation,
            position,
            imageFile,
            imageScale,
            pages: pagesValue || "all",
          }
        )
      }
      busyHint={allPages ? "The watermark will be stamped on every page." : `Watermarking ${selected.size} selected page${selected.size === 1 ? "" : "s"}.`}
      fileThumb="pdf"
      options={
        <>
          <OptionSection title="Watermark style">
            <Field label="Watermark type">
              <SegmentedControl
                value={mode}
                onChange={setMode}
                options={[
                  { value: "text", label: "Text" },
                  { value: "image", label: "Image" },
                ]}
              />
            </Field>

            {mode === "text" ? (
              <>
                <Field label="Watermark text">
                  <PPInput value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder="CONFIDENTIAL" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Font">
                    <PPSelect value={font} onChange={(e) => setFont(e.target.value)}>
                      <option value="helvetica">Helvetica</option>
                      <option value="helvetica-bold">Helvetica Bold</option>
                      <option value="times">Times Roman</option>
                      <option value="times-bold">Times Bold</option>
                      <option value="courier">Courier</option>
                      <option value="courier-bold">Courier Bold</option>
                    </PPSelect>
                  </Field>
                  <Field label={`Font size — ${fontSize}pt`}>
                    <PPRange value={fontSize} min={12} max={140} onChange={setFontSize} ariaLabel="Font size" />
                  </Field>
                  <Field label="Colour">
                    <ColorInput value={color} onChange={setColor} label="Watermark colour" />
                  </Field>
                  <Field label={`Rotation — ${rotation}°`}>
                    <PPRange value={rotation} min={0} max={90} onChange={setRotation} ariaLabel="Rotation" />
                  </Field>
                </div>
              </>
            ) : (
              <>
                <Field label="Watermark image (JPG or PNG — PNG keeps transparency)">
                  <PPInput
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </Field>
                {imageFile && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`Width — ${imageScale}% of page width`}>
                      <PPRange value={imageScale} min={5} max={100} onChange={setImageScale} ariaLabel="Watermark width" />
                    </Field>
                  </div>
                )}
              </>
            )}

            <Field label={`Opacity — ${opacity}%`}>
              <PPRange value={opacity} min={5} max={100} onChange={setOpacity} ariaLabel="Opacity" />
            </Field>
            <Field label="Position on page">
              <PPSelect value={position} onChange={(e) => setPosition(e.target.value)}>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p.replace(/-/g, " ")}</option>
                ))}
              </PPSelect>
            </Field>
          </OptionSection>

          <OptionSection title="Pages to stamp">
            <PPCheck checked={allPages} onChange={setAllPages} label="Apply to all pages" />
            {!allPages && (
              <p className="pp-label text-obsidian/60">
                Click pages below to choose where the watermark goes.
              </p>
            )}
          </OptionSection>
        </>
      }
      customPanel={
        files.length > 0 && entries.length > 0 && !allPages ? (
          <PdfPagesPanel
            file={files[0].file}
            entries={entries}
            flags={{ select: true }}
            selected={selected}
            onSelectionChange={setSelected}
          />
        ) : null
      }
    />
  );
}
