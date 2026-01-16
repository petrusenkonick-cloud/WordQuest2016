import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProviderWrapper } from "@/components/providers/ClerkProviderWrapper";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import { GlobalEffects } from "@/components/effects/GlobalEffects";
import { AudioProvider } from "@/components/providers/AudioProvider";

export const metadata: Metadata = {
  title: "WordQuest - Misha's Adventure",
  description: "Learn English through Minecraft-style adventures! A fun educational game for kids.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
    shortcut: "/icons/icon-96.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WordQuest",
    startupImage: [
      { url: "/icons/icon-512.png" },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: "WordQuest - Misha's Adventure",
    description: "Learn English through Minecraft-style adventures!",
    type: "website",
    locale: "en_US",
    siteName: "WordQuest",
  },
  twitter: {
    card: "summary_large_image",
    title: "WordQuest - Misha's Adventure",
    description: "Learn English through Minecraft-style adventures!",
  },
  applicationName: "WordQuest",
  keywords: ["education", "kids", "learning", "english", "minecraft", "game"],
  authors: [{ name: "WordQuest Team" }],
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FCDB05",
  viewportFit: "cover", // Support for notched devices
  colorScheme: "dark",
};

// Force dynamic rendering to avoid Clerk SSG issues
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

        {/* Splash Screens for iOS */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />

        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#FCDB05" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />

        {/* Theme Color for all browsers */}
        <meta name="theme-color" content="#FCDB05" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a0a00" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="font-game antialiased">
        <ClerkProviderWrapper>
          <ConvexClientProvider>
            <AudioProvider>
              <ServiceWorkerRegistration />
              <GlobalEffects />
              {children}
            </AudioProvider>
          </ConvexClientProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
