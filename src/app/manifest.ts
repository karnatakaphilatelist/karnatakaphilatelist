import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Philatrail",
    short_name: "Philatrail",
    description:
      "The map and tracker for Karnataka's Philately Passport. An independent project.",
    start_url: "/explore",
    display: "standalone",
    background_color: "#fcf6e8",
    theme_color: "#cf1830",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
