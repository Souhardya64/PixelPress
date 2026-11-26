import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Database, EyeOff, HardDrive, Lock, RefreshCw, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How PixelPress processes files locally in your browser: what leaves your device (nothing), how temporary data works, and how to delete it.",
};

const SECTIONS = [
  {
    icon: EyeOff,
    title: "Does anything leave my device?",
    body: (
      <>
        <p>
          No. Every PixelPress tool reads your files directly into the browser&apos;s memory using the
          File API and processes them with JavaScript running on your device. The app has{" "}
          <strong>no upload endpoint</strong> — there is no server code that could receive a file,
          because none exists. You can verify this yourself: open your browser&apos;s network monitor
          while processing a document and watch for outbound file data.
        </p>
        <p>
          One precise clarification: loading the website itself (its HTML, JavaScript, fonts and
          assets) requires network requests to the host serving the app — as with any website.
          Those requests contain the app code only. <strong>The contents of your files are never
          part of any network request.</strong>
        </p>
      </>
    ),
  },
  {
    icon: Database,
    title: "How local browser processing works",
    body: (
      <p>
        When you add a file, it is held in browser memory. PDF operations use PDF-lib and PDF.js;
        image operations use Canvas APIs inside a Web Worker, so the interface stays responsive.
        Compression runs through a worker-based engine on your own CPU. When processing finishes,
        the result is verified (a corrupted or empty output is never shown as success) and handed
        to your browser&apos;s normal download system — exactly as if you had saved a file from any
        web page.
      </p>
    ),
  },
  {
    icon: HardDrive,
    title: "Temporary file handling",
    body: (
      <>
        <p>
          So a page refresh doesn&apos;t destroy your job, PixelPress stores the job — input files,
          settings and finished outputs — in <strong>IndexedDB</strong>, a private storage area of
          your browser tied to this website. This data:
        </p>
        <ul className="mt-2 list-none space-y-1.5">
          <li>· exists only on your device, in your browser profile;</li>
          <li>· is not synchronized to any cloud account;</li>
          <li>· is deleted automatically after 6 hours;</li>
          <li>· can be deleted instantly with the &ldquo;Delete temporary job data&rdquo; button on any download page.</li>
        </ul>
      </>
    ),
  },
  {
    icon: RefreshCw,
    title: "How to delete temporary data yourself",
    body: (
      <>
        <p>
          The most precise way: finish (or abandon) a job and press{" "}
          <strong>&ldquo;Delete temporary job data&rdquo;</strong> on its download page. For a full
          sweep of everything PixelPress has stored:
        </p>
        <ul className="mt-2 list-none space-y-1.5">
          <li>· Chrome/Edge: Settings → Privacy → Site data → find this site → delete.</li>
          <li>· Firefox: Settings → Privacy &amp; Security → Cookies and Site Data → Manage Data.</li>
          <li>· Safari: Settings → Privacy → Manage Website Data.</li>
          <li>· Or simply clear site data / use a private window — private modes don&apos;t persist IndexedDB.</li>
        </ul>
      </>
    ),
  },
  {
    icon: AlertTriangle,
    title: "Browser limitations & honest caveats",
    body: (
      <ul className="list-none space-y-1.5">
        <li>· Very large files are limited by your device&apos;s memory, not by a server quota — a 2 GB PDF may fail on a modest phone.</li>
        <li>· Compressing scanned PDFs rasterises pages, which makes text non-selectable (the tool tells you when this happens).</li>
        <li>· Password-protected PDFs cannot be processed (and we can&apos;t crack them — that&apos;s a privacy feature too).</li>
        <li>· Private/incognito windows delete all data when closed, which is actually perfect for one-off jobs.</li>
        <li>· If you use the hosted version, the hosting platform serves the app but never receives your file contents.</li>
      </ul>
    ),
  },
  {
    icon: Lock,
    title: "What we collect",
    body: (
      <p>
        Nothing. No analytics, no cookies for tracking, no accounts, no contact forms. We
        couldn&apos;t see your files if we wanted to — the architecture doesn&apos;t allow it.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-pixel-grid min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="pp-label inline-block border-2 border-obsidian bg-pixel px-3 py-1.5 shadow-hard-sm">
          Plain English · no dark patterns
        </p>
        <h1 className="pp-heading mt-6 text-3xl sm:text-5xl">Privacy</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-obsidian/75">
          PixelPress was designed so that trusting us isn&apos;t required. The privacy story isn&apos;t a
          policy promise — it&apos;s the architecture. Here is exactly how your files are handled.
        </p>

        <div className="mt-10 space-y-4">
          {SECTIONS.map((section) => (
            <section key={section.title} className="border-2 border-obsidian bg-white p-5 shadow-hard">
              <h2 className="pp-heading flex items-center gap-3 text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-obsidian bg-pixel">
                  <section.icon className="h-4.5 w-4.5" strokeWidth={2.2} aria-hidden="true" />
                </span>
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-obsidian/75">{section.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-2 border-obsidian bg-mint/20 p-5 shadow-hard">
          <ShieldCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">
            Bottom line: your files are processed on your device and stored (briefly) only in your
            browser.{" "}
            <Link href="/tools" className="underline underline-offset-2">
              See the tools
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
