// Platform-specific runtimes are selected by Metro. The web fallback must stay
// free of native-only imports because Expo also uses it while rendering web
// routes on the server.
export { default } from './app-runtime.web';
