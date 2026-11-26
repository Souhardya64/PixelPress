"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PPButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "dark" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const PPButton = forwardRef<HTMLButtonElement, PPButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "pp-label inline-flex items-center justify-center gap-2 border-2 border-obsidian transition-all duration-100",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
          "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
          size === "sm" && "px-3 py-1.5 text-[11px]",
          size === "md" && "px-5 py-2.5 text-xs",
          size === "lg" && "px-7 py-3.5 text-sm",
          variant === "primary" && "bg-pixel text-obsidian shadow-hard hover:-translate-y-0.5 hover:shadow-hard-lg",
          variant === "dark" && "bg-obsidian text-paper shadow-hard hover:-translate-y-0.5 hover:shadow-hard-lg",
          variant === "outline" && "bg-white text-obsidian shadow-hard hover:-translate-y-0.5 hover:bg-pixel/30 hover:shadow-hard-lg",
          variant === "danger" && "bg-alert text-white shadow-hard-alert hover:-translate-y-0.5",
          variant === "ghost" && "border-transparent bg-transparent shadow-none hover:bg-obsidian/5",
          className
        )}
        {...props}
      />
    );
  }
);

PPButton.displayName = "PPButton";
