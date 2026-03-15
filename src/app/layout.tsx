import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import KeyboardShortcutHint from "@/components/KeyboardShortcutHint";
import "./globals.css";

const inter = localFont({
  src: "../../public/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.valorantpicker.com"),
  title: {
    default: "Valorant Random Agent Picker",
    template: "%s | Valorant Picker",
  },
  description:
    "Valorant Agent Picker/Randomizer. Select the agents you want to play and get a random one from the selection.",
  openGraph: {
    locale: "en_US",
    type: "website",
    url: "https://www.valorantpicker.com/",
    siteName: "Valorant Random Agent Picker",
    images: ["/imgs/navbar/v-logo-red.webp"],
  },
  twitter: {
    card: "summary",
    images: ["/imgs/navbar/v-logo-red.webp"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload fonts */}
        <link rel="preload" href="/fonts/Tungsten-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/valorant-regular-webfont.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/DINNextW1G-Regular.otf" as="font" type="font/otf" crossOrigin="anonymous" />

        {/* Preload navbar assets */}
        <link rel="preload" href="/imgs/navbar/bmc.svg" as="image" />
        <link rel="preload" href="/imgs/navbar/v-logo-red.webp" as="image" type="image/webp" />

        {/* Preload role icons */}
        <link rel="preload" href="/imgs/roles/controller.webp" as="image" type="image/webp" />
        <link rel="preload" href="/imgs/roles/sentinel.webp" as="image" type="image/webp" />
        <link rel="preload" href="/imgs/roles/initiator.webp" as="image" type="image/webp" />
        <link rel="preload" href="/imgs/roles/duelist.webp" as="image" type="image/webp" />

        {/* Preload agent icon sprite */}
        <link rel="preload" href="/imgs/agents/agent-icons-sprite.webp" as="image" type="image/webp" />

        {/* Prefetch agent portrait sprite (lower priority, shown on interaction) */}
        <link rel="prefetch" href="/imgs/agents/agent-portraits-sprite.webp" as="image" type="image/webp" />

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4006903176175824"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=UA-28576677-4"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'UA-28576677-4');
          `}
        </Script>
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
        <KeyboardShortcutHint />
      </body>
    </html>
  );
}
