import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nusaai.finance',
  appName: 'NusaAI Finance',
  webDir: 'out',
  server: {
    url: 'https://finace-nu.vercel.app',
    cleartext: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    }
  }
};

export default config;
