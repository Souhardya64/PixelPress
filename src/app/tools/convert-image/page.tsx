import type { Metadata } from "next";
import { ConvertImageTool } from "@/components/tools/convert-image";

export const metadata: Metadata = {
  title: "Image Format Converter",
  description:
    "Convert images between JPG, PNG and WEBP in one batch, with quality control — processed in your browser.",
};

export default function Page() {
  return <ConvertImageTool />;
}
