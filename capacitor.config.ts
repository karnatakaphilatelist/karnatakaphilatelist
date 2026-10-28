import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The native apps are a shell around the live site, so every web release reaches the apps at once.
 * `native-www` is only the offline fallback page shown when the site cannot be reached.
 */
const config: CapacitorConfig = {
  appId: "com.karnatakaphilatelist.passport",
  appName: "Philatelist",
  webDir: "native-www",
  server: {
    url: "https://karnatakaphilatelist.vercel.app",
    cleartext: false,
    // Sign-in with Google happens in the system browser and returns through this scheme.
    allowNavigation: ["karnatakaphilatelist.vercel.app", "*.supabase.co"],
  },
  // Keep the page clear of the notch and home bar; Android pads the web view itself.
  ios: {
    contentInset: "always",
    scheme: "Philatelist",
    backgroundColor: "#fbf5e9",
  },
  android: { allowMixedContent: false },
  plugins: {
    SystemBars: { insetsHandling: "native" },
    SplashScreen: { launchShowDuration: 800, backgroundColor: "#cf1830" },
  },
};

export default config;
