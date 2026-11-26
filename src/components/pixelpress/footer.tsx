import Link from "next/link";
import { LogoMark } from "./logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/pdf-tools", label: "PDF Tools" },
  { href: "/image-tools", label: "Image Tools" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-obsidian bg-obsidian text-paper">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="inline-block bg-paper p-2">
              <LogoMark size={44} />
            </div>
            <p className="pp-label mt-4 text-pixel">Convert. Compress. Edit. More.</p>
            <p className="mt-3 text-sm leading-relaxed text-paper/70">
              Your files. Your control. Zero uploads. Every PixelPress tool runs entirely
              inside your browser — nothing is ever sent to a server.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="pp-label border-b border-transparent py-1 text-paper/80 transition-colors hover:text-pixel"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="max-w-xs">
            <p className="pp-label text-paper/60">No accounts</p>
            <p className="mt-1 text-sm text-paper/80">No sign-up. No tracking. Just tools.</p>
            <p className="pp-label mt-5 text-paper/60">No uploads</p>
            <p className="mt-1 text-sm text-paper/80">
              Files are processed on your device with Web Workers, PDF-lib, PDF.js and Canvas.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-paper/20 pt-5">
          <p className="pp-label text-center text-paper/85">Made By Souhardya</p>
        </div>
      </div>
    </footer>
  );
}
