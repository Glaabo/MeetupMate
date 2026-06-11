import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "MeetupMate — find days that work for everyone",
    template: "%s · MeetupMate",
  },
  description:
    "Mark the days you're free, invite your friends, and instantly see which days work for the whole group.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MeetupMate",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf5ee",
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
