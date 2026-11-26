import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/pixelpress/header";
import { Footer } from "@/components/pixelpress/footer";
import { LoadingScreen } from "@/components/pixelpress/loading-screen";
import { Boot } from "@/components/pixelpress/boot";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pixelpress.local"),
  title: {
    default: "PixelPress — Convert. Compress. Edit. More.",
    template: "%s · PixelPress",
  },
  description:
    "An all-in-one PDF and image toolbox that runs entirely in your browser. Convert, compress, merge, split, watermark and organise files — with zero uploads.",
  applicationName: "PixelPress",
  keywords: ["pdf tools", "image tools", "compress pdf", "merge pdf", "image to pdf", "local processing", "privacy first"],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "PixelPress — Convert. Compress. Edit. More.",
    description: "Your files. Your control. Zero uploads. PDF and image tools that run locally in your browser.",
    type: "website",
    images: ["/logo/pixelpress-logo-small.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FFD600",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <LoadingScreen />
        <Boot />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <TooltipProvider>
          <Toaster />
        </TooltipProvider>
        {/* WARNING FOR AGENT: DO NOT REMOVE THIS SCRIPT */}
        <Script src="https://cdn.jsdelivr.net/gh/IdeavoAI/ideavo-scripts@latest/scripts/ideavo.min.js" />
      </body>
    </html>
  );
}
