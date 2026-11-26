import type { Metadata } from "next";
import { ExtractPagesTool } from "@/components/tools/extract-pages";

export const metadata: Metadata = {
  title: "Extract PDF Pages",
  description:
    "Visually pick pages or type ranges and build a new PDF from just those pages — entirely in your browser.",
};

export default function Page() {
  return <ExtractPagesTool />;
}
