"use client";

import { useState } from "react";
import { ToolShell, type PPFileEntry } from "@/components/pixelpress/tool-shell";
import { Field, OptionSection, PPCheck, PPRange, PPSelect } from "@/components/pixelpress/controls";
import { useStartJob } from "@/components/pixelpress/use-start-job";
import { getToolBySlug } from "@/lib/tools";

const tool = getToolBySlug("compress-image")!;

export function CompressImageTool() {
  const [files, setFiles] = useState<PPFileEntry[]>([]);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState("auto");
  const [useTarget, setUseTarget] = useState(false);
  const [targetMB, setTargetMB] = useState(0.5);
  const [maxEdge, setMaxEdge] = useState("0");
  const { start, starting } = useStartJob(tool.id);

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
          {
            quality: quality / 100,
            format,
            targetMB: useTarget ? targetMB : null,
            maxEdge: Number(maxEdge) || null,
          }
        )
      }
      busyHint={`Compressing ${files.length} image${files.length === 1 ? "" : "s"} at ${quality}% quality — you'll see a size comparison for each file.`}
      fileThumb="image"
      options={
        <OptionSection title="Compression settings">
          <Field label={`Quality — ${quality}%`} hint="Applies to JPG and WEBP output. PNG output is lossless and benefits most from the size target.">
            <PPRange value={quality} min={30} max={95} onChange={setQuality} ariaLabel="Compression quality" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Output format" hint="Auto keeps each file's original format.">
              <PPSelect value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="auto">Auto (keep original)</option>
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
              </PPSelect>
            </Field>
            <Field label="Resolution cap" hint="Also downsizes very large images.">
              <PPSelect value={maxEdge} onChange={(e) => setMaxEdge(e.target.value)}>
                <option value="0">Keep original resolution</option>
                <option value="3840">Limit to 4K (3840px)</option>
                <option value="2048">Limit to 2048px</option>
                <option value="1920">Limit to Full HD (1920px)</option>
                <option value="1280">Limit to 1280px</option>
              </PPSelect>
            </Field>
          </div>

          <PPCheck checked={useTarget} onChange={setUseTarget} label="Compress towards a target file size" />
          {useTarget && (
            <Field label={`Target size — ${targetMB} MB per image`} hint="Best effort: formats that are already efficient may not reach the target.">
              <PPRange value={targetMB * 100} min={5} max={200} onChange={(v) => setTargetMB(v / 100)} ariaLabel="Target size in megabytes" />
            </Field>
          )}
        </OptionSection>
      }
    />
  );
}
