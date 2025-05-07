import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Yavirac-auth',
  webDir: 'www',
  plugins: {
    Geolocation: {
      enableHighAccuracy: true, // 📌 Activa la geolocalización de alta precisión
    },
  },
};

export default config;
