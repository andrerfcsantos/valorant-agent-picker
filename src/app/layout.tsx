import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AGENTS } from "@/data/agents";
import "./globals.css";

const agentKeys = Object.keys(AGENTS);

const inter = localFont({
  src: "../../public/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valorant Random Agent Picker",
  description:
    'Valorant Agent Picker/Randomizer. Select the agents you want to play and get a random one from the selection.',
  openGraph: {
    locale: "en_US",
    type: "website",
    title: "Valorant Random Agent Picker",
    description:
      'Valorant Agent Picker/Randomizer. Select the agents you want to play and get a random one from the selection.',
    url: "https://www.valorantpicker.com/",
    siteName: "Valorant Random Agent Picker",
    images: ["/imgs/agents/icons/brimstone.png"],
  },
  twitter: {
    card: "summary",
    title: "Valorant Random Agent Picker",
    description:
      'Valorant Agent Picker/Randomizer. Select the agents you want to play and get a random one from the selection.',
    images: ["/imgs/agents/icons/brimstone.png"],
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
        <link rel="preload" href="/fonts/DINNextW1G-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* Preload navbar assets */}
        <link rel="preload" href="/imgs/navbar/bmc.svg" as="image" />
        <link rel="preload" href="/imgs/navbar/v-logo-red.png" as="image" />

        {/* Preload role icons */}
        <link rel="preload" href="/imgs/roles/controller.png" as="image" />
        <link rel="preload" href="/imgs/roles/sentinel.png" as="image" />
        <link rel="preload" href="/imgs/roles/initiator.png" as="image" />
        <link rel="preload" href="/imgs/roles/duelist.png" as="image" />

        {/* Preload agent icons */}
        {agentKeys.map((key) => (
          <link key={`preload-icon-${key}`} rel="preload" href={`/imgs/agents/icons/${key}.png`} as="image" />
        ))}

        {/* Prefetch agent portraits (lower priority, shown on interaction) */}
        {agentKeys.map((key) => (
          <link key={`prefetch-portrait-${key}`} rel="prefetch" href={`/imgs/agents/portraits/${key}.png`} as="image" />
        ))}

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
      </body>
    </html>
  );
}
