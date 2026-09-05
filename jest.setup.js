jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
require('react-native-reanimated').setUpTests();
const i18n = require('./src/i18n').default;
beforeEach(() => {
  void i18n.changeLanguage('id');
});
