import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The native apps are a shell around the live site, so every web release reaches the apps at once.
 * `native-www` is only the offline fallback page shown when the site cannot be reached.
 */
const config: CapacitorConfig = {
  appId: "app.vinvi.philatrail",
  appName: "Philatrail",
  webDir: "native-www",
  server: {
    // CI can point a test build at a preview deployment with CAP_SERVER_URL.
    url: process.env.CAP_SERVER_URL || "https://philatrail.com",
    cleartext: false,
    // If the site cannot be reached (for example no connection at launch), show native-www/index.html
    // instead of the browser's raw error page.
    errorPath: "index.html",
    // Sign-in with Google happens in the system browser and returns through this scheme.
    // The old vercel.app address stays allowed so redirects from it still open inside the app.
    allowNavigation: ["philatrail.com", "www.philatrail.com", "karnatakaphilatelist.vercel.app", "*.supabase.co"],
  },
  // Keep the page clear of the notch and home bar; Android pads the web view itself.
  ios: {
    contentInset: "always",
    scheme: "Philatrail",
    appendUserAgent: "PhilatrailApp",
    backgroundColor: "#fcf6e8",
  },
  // The user-agent tag lets the site recognise the app before any script runs.
  android: { allowMixedContent: false, backgroundColor: "#fcf6e8", appendUserAgent: "PhilatrailApp" },
  plugins: {
    SystemBars: { insetsHandling: "native" },
    SplashScreen: { launchShowDuration: 0, launchAutoHide: false, backgroundColor: "#fcf6e8" },
  },
};

export default config;
