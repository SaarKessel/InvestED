import type { CapacitorConfig } from "@capacitor/cli";

// InvestED native shell (Google Play + iOS App Store). The web app is loaded live from the
// production origin so the app always matches the site; there is nothing to version twice.
const config: CapacitorConfig = {
  appId: "com.invested.app",
  appName: "InvestED",
  webDir: "dist",
  server: {
    url: "https://investeducationai.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "never",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
