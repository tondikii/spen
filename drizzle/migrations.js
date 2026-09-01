// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260901102535_foamy_runaways/migration.sql';
import m0001 from './20260901191900_unknown_baron_strucker/migration.sql';

  export default {
    journal: {
      entries: [
        { idx: 0, version: '7', when: 20260901102535, tag: '20260901102535_foamy_runaways', breakpoints: true },
        { idx: 1, version: '7', when: 20260901191900, tag: '20260901191900_unknown_baron_strucker', breakpoints: true },
      ],
    },
    migrations: {
      "20260901102535_foamy_runaways": m0000,
      "20260901191900_unknown_baron_strucker": m0001,
    },
  };
