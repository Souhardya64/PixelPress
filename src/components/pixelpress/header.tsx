"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/pdf-tools", label: "PDF Tools" },
  { href: "/image-tools", label: "Image Tools" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-obsidian bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="PixelPress home" className="flex shrink-0 items-center">
          <Logo height={38} priority />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "pp-label border-2 px-3 py-1.5 transition-colors",
                isActive(item.href)
                  ? "border-obsidian bg-pixel text-obsidian shadow-hard-sm"
                  : "border-transparent text-obsidian hover:border-obsidian hover:bg-pixel/40"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/tools"
            className="pp-label ml-2 border-2 border-obsidian bg-obsidian px-3 py-1.5 text-paper shadow-hard-sm transition-transform hover:-translate-y-0.5"
          >
            Explore Tools
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center border-2 border-obsidian bg-pixel shadow-hard-sm active:translate-y-px md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t-2 border-obsidian bg-paper px-4 pb-4 pt-2 md:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "pp-label my-1 block border-2 px-4 py-3",
                isActive(item.href)
                  ? "border-obsidian bg-pixel text-obsidian"
                  : "border-obsidian/20 bg-white text-obsidian"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/tools"
            className="pp-label my-1 block border-2 border-obsidian bg-obsidian px-4 py-3 text-center text-paper"
          >
            Explore Tools
          </Link>
        </nav>
      )}
    </header>
  );
}
