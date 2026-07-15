import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nusaai.finance',
  appName: 'NusaAI Finance',
  webDir: 'out',
  server: {
    url: 'https://nusaai-finance.vercel.app',
    cleartext: true
  }
};

export default config;
