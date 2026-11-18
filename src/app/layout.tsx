import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { INTRO_BOOT_SCRIPT } from "@/lib/intro-boot";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/noto-sans-kannada";
import "@fontsource/courier-prime/400.css";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { GOOGLE_TAG_ID } from "@/lib/analytics";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Philatrail: the map and tracker for the Philately Passport",
    template: "%s · Philatrail",
  },
  description:
    "Find post offices of the Philately Passport on a map — Karnataka (100 offices) and Tamil Nadu (58 offices). Plan your next visit and keep track of every postmark you collect.",
  applicationName: "Philatrail",
  openGraph: {
    type: "website",
    siteName: "Philatrail",
    locale: "en_IN",
    title: "Philatrail: the map and tracker for the Philately Passport",
    description:
      "Find post offices of the Philately Passport on a map — Karnataka (100 offices) and Tamil Nadu (58 offices). Plan your next visit and keep track of every postmark you collect.",
    images: [{ url: "/og-image.png", width: 1024, height: 500, alt: "Philatrail" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#cf1830",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        {/* Skip the intro right after sign-in (the callback sets this cookie), otherwise start its clock now, before the page's scripts have loaded. */}
        <script
          dangerouslySetInnerHTML={{
            __html: INTRO_BOOT_SCRIPT,
          }}
        />
      </head>
      <body className="min-h-dvh">
        {/* Google Analytics. No Content-Security-Policy anywhere, so the app's web view can run it. */}
        <Script
          src={`https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-tag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());`}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
