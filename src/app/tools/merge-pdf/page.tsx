import type { Metadata } from "next";
import { MergePdfTool } from "@/components/tools/merge-pdf";

export const metadata: Metadata = {
  title: "Merge PDF",
  description:
    "Combine multiple PDFs into one document in any order — merged locally in your browser, nothing is uploaded.",
};

export default function Page() {
  return <MergePdfTool />;
}
