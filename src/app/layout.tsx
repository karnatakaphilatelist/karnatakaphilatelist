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
        {/* Skip the intro right after sign-in (the callback sets this cookie), otherwise start its clock now, before the page's scripts have loaded. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'var h=document.documentElement;if(/(?:^|; )kp_skip_intro=1/.test(document.cookie))h.setAttribute("data-intro-seen","");else if(location.pathname==="/"){window.__kpIntroT0=performance.now();h.setAttribute("data-intro-go","")}',
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
