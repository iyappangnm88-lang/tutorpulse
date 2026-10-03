import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'app.nuzigo.mobile',
  appName: 'Nuzigo',
  webDir: 'public',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://tutorpulse-three.vercel.app',
    cleartext: process.env.NODE_ENV === 'development',
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#FAFBEF',
    allowMixedContent: false,
    captureInput: true,
    appendUserAgent: 'NuzigoNativeApp/1.0 Capacitor',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 4000,
      launchFadeOutDuration: 250,
      backgroundColor: '#FAFBEF',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#55C832',
    },
  },
};

export default config;
