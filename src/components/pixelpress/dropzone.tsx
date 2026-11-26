"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { PPButton } from "./pp-button";
import { cn } from "@/lib/utils";

export function Dropzone({
  accept,
  acceptLabel,
  multiple,
  onFiles,
  disabled,
}: {
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
    [disabled, multiple, onFiles]
  );

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) setDragging(false);
      }}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center border-[3px] border-dashed border-obsidian bg-white px-6 py-10 text-center transition-colors sm:py-14",
        dragging && "border-obsidian bg-pixel/25",
        disabled && "opacity-50"
      )}
      aria-label={`Upload ${acceptLabel} files`}
    >
      <span aria-hidden="true" className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-pixel" />
      <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-obsidian" />
      <span aria-hidden="true" className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-obsidian" />
      <span aria-hidden="true" className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-pixel" />

      <UploadCloud className="h-9 w-9 text-obsidian" strokeWidth={2.2} />
      <p className="pp-heading mt-3 text-lg sm:text-xl">Drag &amp; drop files here</p>
      <p className="mt-1 text-sm text-obsidian/60">
        or use the button below · {acceptLabel}
        {multiple ? " · multiple files" : " · single file"}
      </p>
      <PPButton
        type="button"
        size="md"
        className="mt-4"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Browse files
      </PPButton>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(multiple ? files : files.slice(0, 1));
          e.target.value = "";
        }}
      />
    </div>
  );
}
