// Jest setup untuk reanimated 4 + worklets (SDK 57).
// - react-native-worklets 0.10.x `src/mock` belum mengekspor beberapa API yang
//   diimpor reanimated >=4.5 saat module scope (getUIRuntimeHolder,
//   getUISchedulerHolder, createShareable); lengkapi di sini.
// - Komponen memakai mock resmi reanimated (`mock.js`) agar hook/layout
//   animation stabil di bawah jest-expo.
jest.mock('react-native-worklets', () => {
  const workletsMock = require('react-native-worklets/src/mock');
  return {
    ...workletsMock,
    getUIRuntimeHolder: () => null,
    getUISchedulerHolder: () => null,
    UIRuntimeId: 0,
    createShareable: (_runtimeId, initial) => initial,
  };
});
jest.mock('react-native-reanimated', () => {
  const reanimatedMock = require('react-native-reanimated/mock');
  return {
    ...reanimatedMock,
    // mock resmi belum menyediakan useReducedMotion (komponen Spen memakainya)
    useReducedMotion: () => false,
  };
});
require('react-native-reanimated').setUpTests();
const i18n = require('./src/i18n').default;
beforeEach(() => {
  void i18n.changeLanguage('id');
});
