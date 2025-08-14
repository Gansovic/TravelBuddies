import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "TravelBuddies - Capture Travel Memories Together",
  description: "Real-time collaborative trip recording app that captures memories as they happen through photos, videos, voice notes, and location tracking.",
  keywords: ["travel", "memories", "collaboration", "recording", "photos", "timeline"],
  authors: [{ name: "TravelBuddies Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TravelBuddies",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "TravelBuddies",
    title: "TravelBuddies - Capture Travel Memories Together",
    description: "Real-time collaborative trip recording app",
  },
  icons: {
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA iOS support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TravelBuddies" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Disable iOS zoom on input focus */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* Apple splash screens */}
        <link rel="apple-touch-startup-image" href="/splash/launch-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        
        {/* Camera and microphone permissions hint */}
        <meta name="permissions-policy" content="camera=*, microphone=*, geolocation=*" />
      </head>
      <body>
        <Providers>
          <main style={{ minHeight: "100vh", padding: "16px" }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
