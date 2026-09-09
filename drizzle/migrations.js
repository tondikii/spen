// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260909000000_baseline/migration.sql';
import m0001 from './20260909082517_absurd_preak/migration.sql';

export default {
  journal: {
    entries: [
      { idx: 0, version: '7', when: 20260909000000, tag: 'baseline', breakpoints: true },
      { idx: 1, version: '7', when: 20260909082517, tag: 'absurd_preak', breakpoints: true },
    ],
  },
  migrations: {
    '20260909000000_baseline': m0000,
    '20260909000000_baseline': m0000,
    '20260909082517_absurd_preak': m0001,
  },
};
