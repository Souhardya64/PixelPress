import { cn } from "@/lib/utils";

export function Logo({
  className,
  height = 40,
  priority,
}: {
  className?: string;
  height?: number;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/pixelpress-logo-small.png"
      alt="PixelPress — Convert. Compress. Edit. More."
      width={720}
      height={155}
      style={{ height, width: "auto" }}
      loading={priority ? "eager" : "lazy"}
      className={cn("block", className)}
      draggable={false}
    />
  );
}

export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/pixelpress-mark.png"
      alt="PixelPress mark"
      width={220}
      height={220}
      style={{ height: size, width: "auto" }}
      className={cn("block", className)}
      draggable={false}
    />
  );
}
