"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="pp-label mb-1.5 block text-obsidian/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-obsidian/55">{hint}</span>}
    </label>
  );
}

export function PPSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full appearance-none border-2 border-obsidian bg-white px-3 pr-8 text-sm font-medium text-obsidian shadow-hard-sm",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23111111%22 stroke-width=%223%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[right_0.6rem_center] bg-no-repeat",
        "focus-visible:outline-[3px] focus-visible:outline-offset-1",
        className
      )}
      {...props}
    />
  );
}

export function PPInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full border-2 border-obsidian bg-white px-3 text-sm font-medium text-obsidian shadow-hard-sm placeholder:text-obsidian/35",
        className
      )}
      {...props}
    />
  );
}

export function PPTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full border-2 border-obsidian bg-white px-3 py-2 text-sm font-medium text-obsidian shadow-hard-sm placeholder:text-obsidian/35",
        className
      )}
      {...props}
    />
  );
}

export function PPRange({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="range"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none border-2 border-obsidian bg-white accent-pixel",
        "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-obsidian [&::-webkit-slider-thumb]:bg-pixel",
        "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-obsidian [&::-moz-range-thumb]:bg-pixel",
        className
      )}
    />
  );
}

export function PPCheck({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 select-none">
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center border-2 border-obsidian bg-white",
          checked && "bg-pixel"
        )}
      >
        {checked && <span className="block h-2.5 w-2.5 bg-obsidian" />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm font-medium text-obsidian">{label}</span>
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex w-full border-2 border-obsidian bg-white shadow-hard-sm">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "pp-label flex-1 px-2 py-2.5 transition-colors",
            i > 0 && "border-l-2 border-obsidian",
            value === opt.value ? "bg-pixel text-obsidian" : "bg-white text-obsidian/60 hover:bg-pixel/20"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2">
      <span className="relative h-10 w-10 shrink-0 overflow-hidden border-2 border-obsidian shadow-hard-sm">
        <input
          type="color"
          aria-label={label ?? "Pick a colour"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer border-0 p-0"
        />
      </span>
      <span className="pp-label text-obsidian/70">{value.toUpperCase()}</span>
    </label>
  );
}

export function OptionSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-2 border-obsidian bg-white shadow-hard">
      <summary className="pp-label flex cursor-pointer list-none items-center justify-between border-b-2 border-obsidian bg-paper px-4 py-2.5 [&::-webkit-details-marker]:hidden">
        {title}
        <span className="pp-label text-obsidian/50 transition-transform group-open:rotate-90">▶</span>
      </summary>
      <div className="space-y-4 p-4">{children}</div>
    </details>
  );
}
