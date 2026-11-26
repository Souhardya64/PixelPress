import type { Metadata } from "next";
import { OrganisePdfTool } from "@/components/tools/organise-pdf";

export const metadata: Metadata = {
  title: "Organise PDF",
  description:
    "Reorder, rotate and delete PDF pages with live thumbnails — organised locally, nothing is uploaded.",
};

export default function Page() {
  return <OrganisePdfTool />;
}
