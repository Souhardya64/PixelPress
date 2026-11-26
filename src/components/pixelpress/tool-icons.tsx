import {
  Images,
  Combine,
  FileArchive,
  FileOutput,
  LayoutGrid,
  Stamp,
  Scissors,
  ImageDown,
  Crop,
  Repeat,
  Circle,
  type LucideIcon,
} from "lucide-react";

export const TOOL_ICONS: Record<string, LucideIcon> = {
  Images,
  Combine,
  FileArchive,
  FileOutput,
  LayoutGrid,
  Stamp,
  Scissors,
  ImageDown,
  Crop,
  Repeat,
};

export function getToolIcon(name: string): LucideIcon {
  return TOOL_ICONS[name] ?? Circle;
}
