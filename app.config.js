// Konfigurasi dinamis: application ID/bundle identifier berbeda per profile
// EAS agar build development/preview/production bisa dipasang berdampingan.
// APP_VARIANT diatur eksplisit oleh masing-masing profile EAS. Nilai lokal
// memakai production agar identik dengan rilis Play Store.
const VARIANTS = {
  development: {
    name: 'Spen Dev',
    package: 'com.spen.budget.dev',
    bundleIdentifier: 'com.spen.budget.dev',
  },
  preview: {
    name: 'Spen Preview',
    package: 'com.spen.budget.preview',
    bundleIdentifier: 'com.spen.budget.preview',
  },
  production: {
    name: 'Spen',
    package: 'com.spen.budget.app',
    bundleIdentifier: 'com.spen.budget.app',
  },
};

const variant = VARIANTS[process.env.APP_VARIANT] ?? VARIANTS.production;

module.exports = {
  expo: {
    name: variant.name,
    slug: 'spen',
    owner: 'kizaruxds-team',
    scheme: 'spen',
    description: 'Budget planner mobile berbahasa Indonesia dengan AI, data lokal.',
    version: '1.0.0',
    icon: './assets/spen/logo.png',
    userInterfaceStyle: 'automatic',
    orientation: 'portrait',
    backgroundColor: '#F6F5F0',
    newArchEnabled: true,
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/spen/logo.png',
    },
    android: {
      package: variant.package,
      icon: './assets/spen/logo.png',
      adaptiveIcon: {
        foregroundImage: './assets/spen/adaptive-icon.png',
        backgroundColor: '#235B50',
      },
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: variant.bundleIdentifier,
      icon: './assets/spen/logo.png',
    },
    plugins: [
      'expo-notifications',
      [
        'expo-splash-screen',
        {
          image: './assets/spen/splash-icon.png',
          imageWidth: 200,
          backgroundColor: '#F6F5F0',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '0802f61b-3e43-499d-882f-fb6b9c22d359',
      },
    },
  },
};
