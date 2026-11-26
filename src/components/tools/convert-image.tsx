"use client";

import { useState } from "react";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { ColorInput, Field, OptionSection, PPRange, SegmentedControl } from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("convert-image")!;

export function ConvertImageTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/webp");
  const [quality, setQuality] = useState(90);
  const [bg, setBg] = useState("#ffffff");
  const { start, starting } = useStartJob(tool.id);

  const lossy = format !== "image/png";

  return (
    <ToolShell
      tool={tool}
      files={files}
      onFilesChange={setFiles}
      canRun={files.length > 0 && !starting}
      runLabel={starting ? "Starting…" : tool.action}
      onStart={() =>
        void start(
          files.map((f) => f.file),
          { format, quality: quality / 100, bg }
        )
      }
      busyHint={`Converting ${files.length} image${files.length === 1 ? "" : "s"} to ${format.split("/")[1].toUpperCase()}.`}
      fileThumb="image"
      options={
        <OptionSection title="Conversion settings">
          <Field label="Convert to">
            <SegmentedControl
              value={format}
              onChange={setFormat}
              options={[
                { value: "image/png", label: "PNG" },
                { value: "image/jpeg", label: "JPG" },
                { value: "image/webp", label: "WEBP" },
              ]}
            />
          </Field>
          {lossy && (
            <>
              <Field label={`Quality — ${quality}%`}>
                <PPRange value={quality} min={30} max={100} onChange={setQuality} ariaLabel="Conversion quality" />
              </Field>
              <Field label="Background for transparency" hint="JPG has no transparency — transparent areas are filled with this colour.">
                <ColorInput value={bg} onChange={setBg} label="Background colour" />
              </Field>
            </>
          )}
          <p className="text-xs text-obsidian/60">
            Supported in every direction: JPG ↔ PNG ↔ WEBP. Each converted file is verified before download.
          </p>
        </OptionSection>
      }
    />
  );
}
