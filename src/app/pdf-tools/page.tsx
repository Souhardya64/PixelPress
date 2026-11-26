import type { Metadata } from "next";
import { ToolCard } from "@/components/pixelpress/tool-card";
import { toolsByCategory } from "@/lib/tools";

export const metadata: Metadata = {
  title: "PDF Tools",
  description:
    "Seven local-first PDF tools: image to PDF, merge, compress, extract pages, organise, watermark and split.",
};

export default function PdfToolsPage() {
  const tools = toolsByCategory("pdf");
  return (
    <div className="bg-pixel-grid min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="pp-label inline-block border-2 border-obsidian bg-pixel px-3 py-1.5 shadow-hard-sm">
          {tools.length} tools · processed on your device
        </p>
        <h1 className="pp-heading mt-6 text-3xl sm:text-5xl">PDF Tools</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-obsidian/70">
          Everything you need to build, trim and polish PDF documents. Files are read directly from
          your disk into the browser — no server ever sees them.
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
