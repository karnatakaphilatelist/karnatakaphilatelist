import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Next.js loads .env.local into process.env itself (next dev/build); plain
// Vite/Vitest doesn't, so any test that imports a real (unmocked) module
// chain touching src/lib/env.ts crashed with "Missing environment variable"
// here even with .env.local present — e.g. OfficeDetail.test.tsx, which
// doesn't mock @/lib/supabase/public the way offices.test.ts does. Load the
// same .env.local Next.js reads and merge it into process.env for tests too.
Object.assign(process.env, loadEnv("test", process.cwd(), ""));

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
