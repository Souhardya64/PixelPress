"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageEntry {
  id: string;
  file: File;
  rotation: number;
  url: string;
}

export function ImageReorderGrid({
  images,
  onChange,
}: {
  images: ImageEntry[];
  onChange: (next: ImageEntry[]) => void;
}) {
  const dragId = useRef<string | null>(null);

  if (images.length === 0) return null;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="list" aria-label="Images in order">
      {images.map((img, i) => (
        <div
          key={img.id}
          role="listitem"
          draggable
          onDragStart={(e) => {
            dragId.current = img.id;
            e.dataTransfer.effectAllowed = "move";
            try {
              e.dataTransfer.setData("text/plain", img.id);
            } catch {}
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const from = images.findIndex((x) => x.id === dragId.current);
            const to = images.findIndex((x) => x.id === img.id);
            if (from >= 0 && to >= 0) move(from, to);
            dragId.current = null;
          }}
          className="group relative cursor-grab border-2 border-obsidian bg-white p-2 shadow-hard-sm active:cursor-grabbing"
        >
          <span className="pp-label absolute -top-2.5 left-2 z-10 border border-obsidian bg-pixel px-1 text-obsidian" aria-hidden="true">
            {i + 1}
          </span>
          <div className="checker-bg flex h-32 items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.file.name}
              draggable={false}
              className="max-h-full max-w-full transition-transform"
              style={{ transform: `rotate(${img.rotation}deg)` }}
            />
          </div>
          <p className="mt-2 truncate text-xs font-medium" title={img.file.name}>
            {img.file.name}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Move earlier"
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
                className="flex h-6 w-6 items-center justify-center border border-obsidian bg-paper disabled:opacity-30"
              >
                <ArrowLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label="Move later"
                disabled={i === images.length - 1}
                onClick={() => move(i, i + 1)}
                className="flex h-6 w-6 items-center justify-center border border-obsidian bg-paper disabled:opacity-30"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label={`Rotate image (currently ${img.rotation} degrees)`}
                onClick={() => {
                  const next = [...images];
                  next[i] = { ...img, rotation: (img.rotation + 90) % 360 };
                  onChange(next);
                }}
                className="flex h-6 w-6 items-center justify-center border border-obsidian bg-paper hover:bg-pixel/40"
              >
                <RotateCw className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label={`Remove image`}
                onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                className={cn("flex h-6 w-6 items-center justify-center border border-obsidian bg-paper hover:bg-alert hover:text-white")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
