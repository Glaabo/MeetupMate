import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "FreeDay — find days that work for everyone",
    template: "%s · FreeDay",
  },
  description:
    "Mark the days you're free, invite your friends, and instantly see which days work for the whole group.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FreeDay",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
