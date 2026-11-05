import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/noto-sans-kannada";
import "./globals.css";
import { ExploreHostLoader } from "@/components/explore/ExploreHostLoader";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "Philatrail: the post office stamp passport for India",
    template: "%s · Philatrail",
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
              '(function(){var h=document.documentElement;try{var c=window.Capacitor;if(location.pathname==="/"&&(/PhilatrailApp/.test(navigator.userAgent)||(c&&c.isNativePlatform&&c.isNativePlatform()))){var q=location.search.indexOf("tour")>-1,o=localStorage.getItem("kp:onboarded:v1")==="true";if(o||q){h.setAttribute("data-intro-seen","");location.replace(o&&!q?"/explore":"/welcome");return}setTimeout(function(){if(location.pathname==="/")location.replace("/welcome")},9000)}}catch(e){}if(/(?:^|; )kp_skip_intro=1/.test(document.cookie))h.setAttribute("data-intro-seen","");else if(location.pathname==="/"){window.__kpIntroT0=performance.now();h.setAttribute("data-intro-go","")}})()',
          }}
        />
      </head>
      <body className="min-h-dvh">
        <Providers>
          <AppShell explore={<ExploreHostLoader />}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
