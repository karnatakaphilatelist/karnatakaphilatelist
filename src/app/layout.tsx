import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/noto-sans-kannada";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "Philatelist: the post office stamp passport for India",
    template: "%s · Philatelist",
  },
  description:
    "Find post offices across India on the map, plan your day, and keep a passport of the stamps you have collected.",
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
        {/* Mark a returning visitor before the first paint so the intro never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("kp:intro-seen:v1")||sessionStorage.getItem("kp:intro-seen:v1"))document.documentElement.setAttribute("data-intro-seen","")}catch(e){}',
          }}
        />
      </head>
      <body className="min-h-dvh">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
