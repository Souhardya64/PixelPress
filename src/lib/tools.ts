export type ToolCategory = "pdf" | "image";

export interface ToolMeta {
  id: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  category: ToolCategory;
  accept: string;
  acceptLabel: string;
  multiple: boolean;
  icon: string;
  action: string;
  popular?: boolean;
  minFiles?: number;
  maxFiles?: number;
}

export const TOOLS: ToolMeta[] = [
  {
    id: "img-to-pdf",
    slug: "image-to-pdf",
    name: "Image to PDF",
    short: "Turn images into a polished PDF",
    description:
      "Combine JPG, PNG and WEBP images into one PDF with page sizes, margins, watermarks and page numbers.",
    category: "pdf",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    acceptLabel: "JPG · PNG · WEBP",
    multiple: true,
    icon: "Images",
    action: "Generate PDF",
    popular: true,
    minFiles: 1,
  },
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    name: "Merge PDF",
    short: "Combine PDFs into one document",
    description:
      "Put several PDFs together in the exact order you want and download a single combined file.",
    category: "pdf",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: true,
    icon: "Combine",
    action: "Merge PDFs",
    popular: true,
    minFiles: 2,
  },
  {
    id: "compress-pdf",
    slug: "compress-pdf",
    name: "Compress PDF",
    short: "Shrink PDF file size",
    description:
      "Reduce PDF size with lossless optimisation or high-quality raster compression, right on your device.",
    category: "pdf",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    icon: "FileArchive",
    action: "Compress PDF",
    popular: true,
    minFiles: 1,
  },
  {
    id: "extract-pages",
    slug: "extract-pdf-pages",
    name: "Extract PDF Pages",
    short: "Pull out the pages you need",
    description:
      "Visually pick pages or type ranges and build a new PDF from just those pages.",
    category: "pdf",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    icon: "FileOutput",
    action: "Extract pages",
    minFiles: 1,
  },
  {
    id: "organise-pdf",
    slug: "organise-pdf",
    name: "Organise PDF",
    short: "Reorder, rotate and delete pages",
    description:
      "See every page as a thumbnail, then drag, rotate or delete pages before saving the result.",
    category: "pdf",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    icon: "LayoutGrid",
    action: "Save organised PDF",
    minFiles: 1,
  },
  {
    id: "watermark-pdf",
    slug: "watermark-pdf",
    name: "Watermark PDF",
    short: "Stamp text or images on pages",
    description:
      "Add a text or image watermark with full control over font, size, opacity, rotation and position.",
    category: "pdf",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    icon: "Stamp",
    action: "Apply watermark",
    minFiles: 1,
  },
  {
    id: "split-pdf",
    slug: "split-pdf",
    name: "Split PDF",
    short: "Cut a PDF into pieces",
    description:
      "Split by custom ranges, at fixed intervals, or into single pages. Download files one by one or as a ZIP.",
    category: "pdf",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    icon: "Scissors",
    action: "Split PDF",
    minFiles: 1,
  },
  {
    id: "compress-image",
    slug: "compress-image",
    name: "Compress Images",
    short: "Smaller images, same look",
    description:
      "Batch-compress JPG, PNG and WEBP files with a quality dial or a target file size — previews included.",
    category: "image",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    acceptLabel: "JPG · PNG · WEBP",
    multiple: true,
    icon: "ImageDown",
    action: "Compress images",
    popular: true,
    minFiles: 1,
  },
  {
    id: "resize-crop",
    slug: "resize-crop",
    name: "Resize & Crop",
    short: "Exact dimensions, no guesswork",
    description:
      "Resize to custom or preset dimensions, crop with a visual frame, and rotate — with a live preview.",
    category: "image",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    acceptLabel: "JPG · PNG · WEBP",
    multiple: true,
    icon: "Crop",
    action: "Apply changes",
    minFiles: 1,
  },
  {
    id: "convert-image",
    slug: "convert-image",
    name: "Format Converter",
    short: "JPG · PNG · WEBP, both ways",
    description:
      "Convert images between JPG, PNG and WEBP in one batch, with quality control for lossy formats.",
    category: "image",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    acceptLabel: "JPG · PNG · WEBP",
    multiple: true,
    icon: "Repeat",
    action: "Convert images",
    minFiles: 1,
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolById(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function toolsByCategory(cat: ToolCategory): ToolMeta[] {
  return TOOLS.filter((t) => t.category === cat);
}

export function popularTools(): ToolMeta[] {
  return TOOLS.filter((t) => t.popular);
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  pdf: "PDF Tools",
  image: "Image Tools",
};
