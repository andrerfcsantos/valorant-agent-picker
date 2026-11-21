import type { Metadata } from "next";
import Script from "next/script";
import SiteChrome from "@/components/SiteChrome";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import KeyboardShortcutHint from "@/components/KeyboardShortcutHint";
import PageViewTracker from "@/components/PageViewTracker";
import { GA_MEASUREMENT_ID } from "@/lib/googleAnalytics";
import { DESIGN_BOOT_SCRIPT } from "@/lib/design";
import { SHARE_PARAM } from "@/lib/share/urls";
import "./globals.css";
import "./refresh.css";

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
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The boot script below sets data-design before React hydrates, which
    // React would otherwise report as a mismatch on this one element.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Stamps the visitor's design on <html> before the first paint. */}
        <script
          id="design-boot"
          dangerouslySetInnerHTML={{ __html: DESIGN_BOOT_SCRIPT }}
        />

        {/* Preload fonts */}
        <link
          rel="preload"
          href="/fonts/Tungsten-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/valorant-regular-webfont.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/DINNextW1G-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preload navbar assets */}
        <link
          rel="preload"
          href="/imgs/logo/ap-logo.webp"
          as="image"
          type="image/webp"
        />

        {/* Preload role icons sprite */}
        <link
          rel="preload"
          href="/imgs/roles/role-icons-sprite.webp"
          as="image"
          type="image/webp"
        />

        {/* Preload agent icon sprite */}
        <link
          rel="preload"
          href="/imgs/agents/agent-icons-sprite.webp"
          as="image"
          type="image/webp"
        />

        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            // Same rule as sanitizePageLocation() in lib/googleAnalytics.ts: drop
            // the share payload (it can carry player names) and the fragment.
            function sanitizeUrl(href) {
              var url = new URL(href);
              url.searchParams.delete('${SHARE_PARAM}');
              url.hash = '';
              return url.toString();
            }
            gtag('js', new Date());
            // Set for every hit, including gtag's automatic events
            // (user_engagement, scroll, ...), which would otherwise read the
            // raw URL and referrer. A share page linking to the generator
            // makes the share URL the next page's referrer.
            var pageContext = { page_location: sanitizeUrl(location.href) };
            if (document.referrer) {
              pageContext.page_referrer = sanitizeUrl(document.referrer);
            }
            gtag('set', pageContext);
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            gtag('event', 'page_view', {
              page_location: pageContext.page_location,
              page_title: document.title,
            });
          `}
        </Script>
      </head>
      <body>
        <SiteChrome
          navbar={<Navbar />}
          footer={<Footer />}
          extras={
            <>
              <KeyboardShortcutHint />
              <PageViewTracker />
            </>
          }
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
