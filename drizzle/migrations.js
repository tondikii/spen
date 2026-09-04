// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260901102535_foamy_runaways/migration.sql';
import m0001 from './20260901191900_unknown_baron_strucker/migration.sql';
import m0002 from './20260901193906_nostalgic_dragon_lord/migration.sql';
import m0003 from './20260902031456_windy_starbolt/migration.sql';
import m0004 from './20260902165744_flawless_puppet_master/migration.sql';
import m0005 from './20260902165825_remarkable_thor/migration.sql';
import m0006 from './20260903120000_unified_expenses/migration.sql';
import m0007 from './20260903140000_expense_payment_toggle/migration.sql';
import m0008 from './20260904160000_wallet_to_index/migration.sql';

export default {
  journal: {
    entries: [
      { idx: 0, version: '7', when: 20260901102535, tag: 'foamy_runaways', breakpoints: true },
      { idx: 1, version: '7', when: 20260901191900, tag: 'unknown_baron_strucker', breakpoints: true },
      { idx: 2, version: '7', when: 20260901193906, tag: 'nostalgic_dragon_lord', breakpoints: true },
      { idx: 3, version: '7', when: 20260902031456, tag: 'windy_starbolt', breakpoints: true },
      { idx: 4, version: '7', when: 20260902165744, tag: 'flawless_puppet_master', breakpoints: true },
      { idx: 5, version: '7', when: 20260902165825, tag: 'remarkable_thor', breakpoints: true },
      { idx: 6, version: '7', when: 20260903120000, tag: 'unified_expenses', breakpoints: true },
      { idx: 7, version: '7', when: 20260903140000, tag: 'expense_payment_toggle', breakpoints: true },
      { idx: 8, version: '7', when: 20260904160000, tag: 'wallet_to_index', breakpoints: true },
    ],
  },
  migrations: {
    '20260901102535_foamy_runaways': m0000,
    '20260901191900_unknown_baron_strucker': m0001,
    '20260901193906_nostalgic_dragon_lord': m0002,
    '20260902031456_windy_starbolt': m0003,
    '20260902165744_flawless_puppet_master': m0004,
    '20260902165825_remarkable_thor': m0005,
    '20260903120000_unified_expenses': m0006,
    '20260903140000_expense_payment_toggle': m0007,
    '20260904160000_wallet_to_index': m0008,
  },
};
