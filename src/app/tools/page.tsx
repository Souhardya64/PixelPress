import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolCard } from "@/components/pixelpress/tool-card";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools",
  description: "Browse all ten PixelPress PDF and image tools — every one runs locally in your browser.",
};

export default function ToolsPage() {
  const pdf = TOOLS.filter((t) => t.category === "pdf");
  const image = TOOLS.filter((t) => t.category === "image");
  return (
    <div className="bg-pixel-grid min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="pp-label text-obsidian/60">The complete toolbox</p>
        <h1 className="pp-heading mt-2 text-3xl sm:text-5xl">All {TOOLS.length} tools</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-obsidian/70">
          Every tool works the same way: drop files, tweak settings, download results. All
          processing happens on your device.
        </p>

        <h2 className="pp-heading mt-12 flex items-center gap-2 text-xl">
          <span className="inline-block h-3 w-3 border border-obsidian bg-pixel" aria-hidden="true" /> PDF Tools
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pdf.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <h2 className="pp-heading mt-12 flex items-center gap-2 text-xl">
          <span className="inline-block h-3 w-3 border border-obsidian bg-pixel" aria-hidden="true" /> Image Tools
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {image.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <p className="pp-label mt-12 flex items-center gap-2 text-obsidian/50">
          Looking for something specific?
          <Link href="/pdf-tools" className="text-obsidian underline underline-offset-2">PDF tools</Link>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
          <Link href="/image-tools" className="text-obsidian underline underline-offset-2">Image tools</Link>
        </p>
      </div>
    </div>
  );
}
