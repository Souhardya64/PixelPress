"use client";

import Link from "next/link";
import { getToolIcon } from "./tool-icons";
import type { ToolMeta } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, compact }: { tool: ToolMeta; compact?: boolean }) {
  const Icon = getToolIcon(tool.icon);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col border-2 border-obsidian bg-white p-4 shadow-hard transition-all duration-100 hover:-translate-y-1 hover:shadow-hard-lg",
        compact && "p-3"
      )}
    >
      <span className="flex items-center justify-between">
        <span
          className={cn(
            "flex items-center justify-center border-2 border-obsidian bg-pixel",
            compact ? "h-10 w-10" : "h-12 w-12"
          )}
          aria-hidden="true"
        >
          <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2.2} />
        </span>
        {tool.popular && (
          <span className="pp-label border-2 border-obsidian bg-obsidian px-1.5 py-0.5 text-pixel">Popular</span>
        )}
      </span>
      <span className="pp-heading mt-3 block text-base sm:text-lg">{tool.name}</span>
      <span className="mt-1 block flex-1 text-xs leading-relaxed text-obsidian/65">{tool.short}</span>
      <span className="pp-label mt-3 inline-flex items-center gap-1.5 text-obsidian">
        Open tool
        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
