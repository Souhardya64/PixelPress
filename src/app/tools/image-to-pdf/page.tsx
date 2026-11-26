import type { Metadata } from "next";
import { ImageToPdfTool } from "@/components/tools/img-to-pdf";

export const metadata: Metadata = {
  title: "Image to PDF",
  description:
    "Convert JPG, PNG and WEBP images into a single PDF with page sizes, margins, watermarks and page numbers — processed entirely in your browser.",
};

export default function Page() {
  return <ImageToPdfTool />;
}
