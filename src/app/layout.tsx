import type { Metadata, Viewport } from "next";
import { INTRO_BOOT_SCRIPT } from "@/lib/intro-boot";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/noto-sans-kannada";
import "@fontsource/courier-prime/400.css";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "Philatrail: the map and tracker for Karnataka's Philately Passport",
    template: "%s · Philatrail",
  },
  description:
    "Find the 100 post offices of Karnataka's Philately Passport on a map, plan your next visit, and keep track of every postmark you collect.",
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
