import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, FileDown, Github, HardDriveDownload, Lock, WifiOff } from "lucide-react";
import { LogoMark } from "@/components/pixelpress/logo";

export const metadata: Metadata = {
  title: "About",
  description: "What PixelPress is, how it works under the hood, and why local processing matters.",
};

const FACTS = [
  {
    icon: Cpu,
    title: "Runs on your hardware",
    text: "The processing engine is built from browser-native APIs: PDF-lib for document surgery, PDF.js for rendering, Canvas and Web Workers for image work. Your CPU does the work, so your files stay yours.",
  },
  {
    icon: WifiOff,
    title: "Network-optional",
    text: "Once the page has loaded, every tool keeps working even if you go offline. Files are never part of any request — there is no upload endpoint to send them to.",
  },
  {
    icon: Lock,
    title: "No accounts, no tracking",
    text: "PixelPress has no sign-up, no analytics and no advertising. We have nothing to track because nothing about your documents reaches us.",
  },
  {
    icon: HardDriveDownload,
    title: "Honest temp storage",
    text: "Jobs and outputs live in your browser's IndexedDB so a refresh doesn't destroy your work. They expire automatically after 6 hours, or you can delete them with one click.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-pixel-grid min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="border-2 border-obsidian bg-white p-3 shadow-hard-lg" style={{ width: "fit-content" }}>
          <LogoMark size={56} />
        </div>
        <h1 className="pp-heading mt-8 text-3xl sm:text-5xl">About PixelPress</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-obsidian/75">
          PixelPress is an all-in-one PDF and image utility platform built on a simple bet: the
          most private cloud is no cloud at all. Modern browsers ship with everything needed to
          parse documents, render pages and compress images — so that&apos;s exactly where the work
          happens.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FACTS.map((fact) => (
            <div key={fact.title} className="border-2 border-obsidian bg-white p-5 shadow-hard">
              <fact.icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
              <h2 className="pp-heading mt-3 text-lg">{fact.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-obsidian/70">{fact.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-2 border-obsidian bg-obsidian p-6 text-paper shadow-hard">
          <p className="pp-label text-pixel">Under the hood</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-paper/80">
            <li>· <strong>PDF-lib</strong> — creating, merging, splitting, watermarking and page-level edits.</li>
            <li>· <strong>PDF.js</strong> — rendering page thumbnails and rasterising pages for compression.</li>
            <li>· <strong>Canvas + OffscreenCanvas in Web Workers</strong> — image resizing, cropping, rotation and format conversion.</li>
            <li>· <strong>browser-image-compression</strong> — streamed, worker-based image compression with target sizes.</li>
            <li>· <strong>JSZip</strong> — bundling multi-file results, assembled in memory.</li>
            <li>· <strong>IndexedDB</strong> — temporary local job persistence between pages.</li>
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/tools"
            className="pp-label inline-flex items-center gap-2 border-2 border-obsidian bg-pixel px-6 py-3.5 shadow-hard transition-transform hover:-translate-y-0.5"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" /> Try the tools
          </Link>
          <p className="pp-label flex items-center gap-2 text-obsidian/60">
            <Github className="h-4 w-4" aria-hidden="true" /> Built by Souhardya
          </p>
        </div>
      </div>
    </div>
  );
}
