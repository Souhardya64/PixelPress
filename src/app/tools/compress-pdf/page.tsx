import type { Metadata } from "next";
import { CompressPdfTool } from "@/components/tools/compress-pdf";

export const metadata: Metadata = {
  title: "Compress PDF",
  description:
    "Shrink PDF file size with lossless or high-quality raster compression — processed locally in your browser with real, honest results.",
};

export default function Page() {
  return <CompressPdfTool />;
}
