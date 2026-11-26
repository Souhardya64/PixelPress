import Link from "next/link";
import { ArrowRight, Cpu, Download, FileCheck, ShieldCheck, WifiOff } from "lucide-react";
import { ToolCard } from "@/components/pixelpress/tool-card";
import { toolsByCategory, popularTools } from "@/lib/tools";

const STEPS = [
  { icon: FileCheck, title: "Pick a tool", text: "Ten focused tools for PDFs and images — no accounts, no bundles you don't need." },
  { icon: Cpu, title: "Drop your files", text: "Files are read straight into your browser's memory. Nothing is sent anywhere." },
  { icon: WifiOff, title: "Process offline-grade", text: "Web Workers, PDF-lib, PDF.js and Canvas do the heavy lifting on your device." },
  { icon: Download, title: "Download", text: "Results are verified, then saved through your browser's normal download flow." },
];

export default function HomePage() {
  const pdfTools = toolsByCategory("pdf");
  const imageTools = toolsByCategory("image");
  const popular = popularTools();

  return (
    <div>
      {/* Hero */}
      <section className="bg-pixel-grid border-b-2 border-obsidian">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div>
            <p className="pp-label inline-block border-2 border-obsidian bg-paper px-3 py-1.5 shadow-hard-sm">
              Convert · Compress · Edit · More
            </p>
            <h1 className="pp-heading mt-6 text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Your files.
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Your control.</span>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-1 z-0 h-4 bg-pixel sm:h-6" />
              </span>
              <br />
              Zero uploads.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-obsidian/75 sm:text-lg">
              Convert, compress and organise your files using simple, powerful tools that run
              entirely inside your browser. No sign-up, no servers, no waiting rooms.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/tools"
                className="pp-label inline-flex items-center gap-2 border-2 border-obsidian bg-pixel px-7 py-4 text-sm text-obsidian shadow-hard-lg transition-all hover:-translate-y-1 hover:shadow-hard"
              >
                Explore tools <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/privacy"
                className="pp-label inline-flex items-center gap-2 border-2 border-obsidian bg-white px-5 py-3.5 text-obsidian shadow-hard-sm transition-all hover:-translate-y-0.5"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> How privacy works
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <StatCard big value="0" label="Files uploaded — ever" />
            <div className="grid grid-cols-2 gap-4">
              <StatCard value="10" label="Working tools" />
              <StatCard value="100%" label="On-device processing" />
            </div>
            <div className="border-2 border-obsidian bg-obsidian p-4 text-paper shadow-hard">
              <p className="pp-label text-pixel">Why local matters</p>
              <p className="mt-2 text-xs leading-relaxed text-paper/75">
                Contracts, invoices, ID scans and personal photos never touch a network request.
                PixelPress works the moment the page loads — even on flaky connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="overflow-hidden border-b-2 border-obsidian bg-pixel py-2.5" aria-hidden="true">
        <div className="pp-marquee-track flex w-max gap-8">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-8">
              {["CONVERT", "COMPRESS", "EDIT", "MERGE", "SPLIT", "ORGANISE", "WATERMARK", "RESIZE", "CROP", "ZERO UPLOADS"].map((word) => (
                <span key={word} className="pp-label flex items-center gap-8 text-obsidian">
                  {word} <span className="inline-block h-2.5 w-2.5 border border-obsidian bg-obsidian" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* PDF tools */}
      <Section
        id="pdf-tools"
        kicker="7 tools"
        title="PDF Tools"
        description="Merge, split, compress, organise, watermark and extract — full document control without a single upload."
        href="/pdf-tools"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pdfTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </Section>

      {/* Image tools */}
      <Section
        id="image-tools"
        kicker="3 tools"
        title="Image Tools"
        description="Compress, resize, crop and convert images in batches — with live previews and honest file-size numbers."
        href="/image-tools"
        alt
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imageTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </Section>

      {/* Popular tools */}
      <Section kicker="Start here" title="Popular tools" description="The four tools people reach for first.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((tool) => (
            <ToolCard key={tool.id} tool={tool} compact />
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" kicker="How PixelPress works" title="Four steps, zero servers" description="Every tool follows the same honest flow." alt>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative border-2 border-obsidian bg-white p-4 shadow-hard">
              <span className="pp-heading absolute -top-3 left-3 border-2 border-obsidian bg-pixel px-2 text-sm" aria-hidden="true">
                {i + 1}
              </span>
              <step.icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
              <p className="pp-heading mt-3 text-base">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-obsidian/65">{step.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Privacy strip */}
      <section className="border-t-2 border-obsidian bg-obsidian text-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="pp-label text-pixel">Privacy by architecture</p>
            <h2 className="pp-heading mt-2 text-2xl sm:text-3xl">Your documents never leave your device.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/70">
              There is no upload endpoint, no cloud queue and no account system — because the
              processing engine is your browser. Temporary job data lives only in your device&apos;s
              local storage and is deleted automatically after 6 hours, or instantly whenever you
              choose.
            </p>
          </div>
          <Link
            href="/privacy"
            className="pp-label shrink-0 border-2 border-paper bg-pixel px-6 py-3.5 text-obsidian shadow-hard-yellow transition-transform hover:-translate-y-0.5"
          >
            Read the privacy page
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({
  id,
  kicker,
  title,
  description,
  href,
  alt,
  children,
}: {
  id?: string;
  kicker: string;
  title: string;
  description: string;
  href?: string;
  alt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={alt ? "bg-paper" : "bg-white"}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="pp-label flex items-center gap-2 text-obsidian/60">
              <span className="inline-block h-2.5 w-2.5 border border-obsidian bg-pixel" aria-hidden="true" />
              {kicker}
            </p>
            <h2 className="pp-heading mt-2 text-2xl sm:text-4xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-obsidian/70">{description}</p>
          </div>
          {href && (
            <Link
              href={href}
              className="pp-label inline-flex items-center gap-2 border-2 border-obsidian bg-white px-4 py-2.5 shadow-hard-sm transition-all hover:-translate-y-0.5 hover:bg-pixel"
            >
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function StatCard({ value, label, big }: { value: string; label: string; big?: boolean }) {
  return (
    <div className={`border-2 border-obsidian p-4 ${big ? "bg-pixel shadow-hard-lg" : "bg-white shadow-hard"}`}>
      <p className={`pp-heading tabular-nums ${big ? "text-5xl sm:text-6xl" : "text-3xl"}`}>{value}</p>
      <p className="pp-label mt-1 text-obsidian/70">{label}</p>
    </div>
  );
}
