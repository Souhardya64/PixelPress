import type { Metadata } from "next";
import { ResizeCropTool } from "@/components/tools/resize-crop";

export const metadata: Metadata = {
  title: "Resize & Crop",
  description:
    "Resize images to custom or preset dimensions, crop with a visual frame, and rotate — processed locally.",
};

export default function Page() {
  return <ResizeCropTool />;
}
