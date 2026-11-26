import Link from "next/link";
import { LogoMark } from "@/components/pixelpress/logo";

export default function NotFound() {
  return (
    <div className="bg-pixel-grid flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
      <div className="pp-pop w-full max-w-md border-2 border-obsidian bg-white p-8 text-center shadow-hard-lg">
        <div className="mx-auto inline-block border-2 border-obsidian bg-paper p-2">
          <LogoMark size={48} />
        </div>
        <p className="pp-heading mt-6 text-5xl">404</p>
        <h1 className="pp-heading mt-2 text-xl">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-sm text-obsidian/70">
          The link may be old, or the job data it pointed to may have expired. Nothing was lost —
          your files only ever lived in your browser.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="pp-label border-2 border-obsidian bg-pixel px-5 py-3 shadow-hard transition-transform hover:-translate-y-0.5">
            Back to home
          </Link>
          <Link href="/tools" className="pp-label border-2 border-obsidian bg-white px-5 py-3 shadow-hard-sm transition-transform hover:-translate-y-0.5">
            Browse tools
          </Link>
        </div>
      </div>
    </div>
  );
}
