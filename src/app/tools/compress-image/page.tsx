import type { Metadata } from "next";
import { CompressImageTool } from "@/components/tools/compress-image";

export const metadata: Metadata = {
  title: "Compress Images",
  description:
    "Batch-compress JPG, PNG and WEBP images with a quality dial or target file size — with before/after previews.",
};

export default function Page() {
  return <CompressImageTool />;
}
