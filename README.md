# PixelPress

**CONVERT. COMPRESS. EDIT. MORE.**
Your files. Your control. Zero uploads.

PixelPress is an all-in-one PDF & image utility platform that runs **entirely in your browser**. Files are never uploaded to any server — all processing happens locally on your device.

Made by Souhardya.

## Features

- **10 fully functional tools** — 7 PDF + 3 image utilities
- **100% local processing** — no uploads, no accounts, no tracking of file contents
- **Dedicated process & download pages** — real progress with live stage tracking (Reading → Preparing → Processing → Generating → Verifying → Ready), ETA, and cancel support
- **Verified outputs** — every output is checked (page counts, dimensions, signatures) before success is claimed
- **Temporary job storage** — processed results live in your browser's IndexedDB for 6 hours, then auto-expire. Delete them any time from the download page.

### PDF tools

| Tool | What it does |
| --- | --- |
| Image to PDF | Batch images → one PDF, with reorder, rotation, image compression, page sizes/margins, fit modes, watermark, page numbers and background color |
| Merge PDF | Combine multiple PDFs, reorder before merging |
| Compress PDF | Multiple compression levels with honest reporting — if a PDF can't compress further, it says so |
| Extract Pages | Pull selected pages into a new PDF (click pages or type ranges) |
| Organise PDF | Reorder, rotate and delete pages with a visual editor |
| Watermark PDF | Text or image watermark with position/opacity/rotation control, per-page selection |
| Split PDF | Split by custom ranges, fixed interval, or one file per page — multi-output with ZIP bundling |

### Image tools

| Tool | What it does |
| --- | --- |
| Compress Images | Batch compression with quality control, target file size, and max-edge resizing |
| Resize & Crop | Resize with aspect lock and presets, live crop preview, rotation, format & quality control |
| Convert Images | Batch convert between JPG / PNG / WEBP with quality and background control |

## Tech stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **Tailwind CSS v4** — Neo-Brutalist design system (Obsidian `#111111`, Pixel Yellow `#FFD600`, Paper White `#F2F2E9`)
- **pdf-lib** — PDF construction & manipulation
- **pdf.js (pdfjs-dist)** — PDF rendering & page previews
- **browser-image-compression** + Canvas / OffscreenCanvas
- **JSZip** — multi-output bundling
- **Web Workers** — heavy image work off the main thread with a main-thread fallback
- **IndexedDB** — temporary local job storage (auto-expires after 6 hours)

## Getting started

```bash
bun install
bun run dev
```

Open http://localhost:4000.

> The dev server port is set by the sandbox workflow. To run elsewhere: `bun run dev --port <port>`.

### Other scripts

```bash
bun run typecheck   # TypeScript verification
bun run build       # production build
bun run start       # serve a production build
bun run lint        # eslint
```

## How the local pipeline works

1. You pick files on a tool page. They are held in memory only.
2. Hitting the action button creates a **job** — a record stored in IndexedDB containing the input files, options and status. Nothing leaves the device.
3. The app navigates to `/process/{tool}/{job-id}`, where the runner executes the tool implementation with real progress and stage reporting (Web Workers where it helps).
4. Outputs are verified (page counts, image dimensions, file signatures) and stored back into the job record.
5. You are taken to `/download/{job-id}` — download files individually or as a ZIP, then keep or delete the temporary data.

If processing is interrupted (tab closed mid-run), the job stays in IndexedDB marked as incomplete — you can simply start again.

## Deployment

The app is a static-capable Next.js app with no server-side data handling (there is no backend beyond Next itself), so it can be deployed anywhere Next.js runs:

```bash
bun run build
bun run start        # node server, or:
```

…or host the build output on Vercel / Netlify / any Node host. No environment variables or API keys are required.

## Privacy

Everything runs locally. See the in-app `/privacy` page for the plain-language policy: files are processed in your browser, temporarily stored in IndexedDB for at most 6 hours, and never transmitted.
