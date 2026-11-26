import type { Metadata } from "next";
import { WatermarkPdfTool } from "@/components/tools/watermark-pdf";

export const metadata: Metadata = {
  title: "Watermark PDF",
  description:
    "Stamp text or image watermarks on PDF pages with full control over font, size, opacity, rotation and position.",
};

export default function Page() {
  return <WatermarkPdfTool />;
}
