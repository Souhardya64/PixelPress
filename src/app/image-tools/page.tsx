import type { Metadata } from "next";
import { ToolCard } from "@/components/pixelpress/tool-card";
import { toolsByCategory } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Image Tools",
  description:
    "Three local-first image tools: batch compression, resize & crop with live preview, and format conversion.",
};

export default function ImageToolsPage() {
  const tools = toolsByCategory("image");
  return (
    <div className="bg-pixel-grid min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="pp-label inline-block border-2 border-obsidian bg-pixel px-3 py-1.5 shadow-hard-sm">
          {tools.length} tools · processed on your device
        </p>
        <h1 className="pp-heading mt-6 text-3xl sm:text-5xl">Image Tools</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-obsidian/70">
          Batch compress towards a target size, resize and crop with a live frame, or convert
          between JPG, PNG and WEBP. Powered by Web Workers and Canvas on your own hardware.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
