// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260909000000_baseline/migration.sql';

export default {
  journal: {
    entries: [
      { idx: 0, version: '7', when: 20260909000000, tag: 'baseline', breakpoints: true },
    ],
  },
  migrations: {
    '20260909000000_baseline': m0000,
  },
};
