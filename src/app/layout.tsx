import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = localFont({
  src: "../../public/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valorant Random Agent Picker",
  description:
    'Valorant Agent Picker/Randomizer. Select the agents you want to play and get a random one from the selection. Completely ad-free!',
  openGraph: {
    locale: "en_US",
    type: "website",
    title: "Valorant Random Agent Picker",
    description:
      'Valorant Agent Picker/Randomizer. Select the agents you want to play and get a random one from the selection. Completely ad-free!',
    url: "https://www.valorantpicker.com/",
    siteName: "Valorant Random Agent Picker",
    images: ["/imgs/agents/icons/brimstone.png"],
  },
  twitter: {
    card: "summary",
    title: "Valorant Random Agent Picker",
    description:
      'Valorant Agent Picker/Randomizer. Select the agents you want to play and get a random one from the selection. Completely ad-free!',
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
