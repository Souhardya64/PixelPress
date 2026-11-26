import type { Metadata } from "next";
import { SplitPdfTool } from "@/components/tools/split-pdf";

export const metadata: Metadata = {
  title: "Split PDF",
  description:
    "Split a PDF by custom ranges, fixed intervals or into single pages — download individually or as a ZIP.",
};

export default function Page() {
  return <SplitPdfTool />;
}
