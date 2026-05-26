import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetupMate",
  description: "Find days when friends can meet — privacy-first group availability",
  applicationName: "MeetupMate",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MeetupMate",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
