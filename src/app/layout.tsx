import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource-variable/noto-sans-kannada";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "Karnataka Philatelic Passport",
    template: "%s · Karnataka Philatelic Passport",
  },
  description:
    "Find every post office in the Karnataka philatelic passport on the map, plan your day, and track the stamps you have collected.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d63a2b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-dvh">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
