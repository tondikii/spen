import { getSelectedCurrency } from '@/services/settings-service';

export const Colors = {
  light: {
    background: '#F6F5F0',
    backgroundElement: '#FFFEFA',
    backgroundSelected: '#DCE5EC',
    text: '#213431',
    textSecondary: '#7B8882',
    pine: '#235B50',
    pine2: '#17483F',
    mint: '#DCECE5',
    paper: '#F6F5F0',
    card: '#FFFEFA',
    ink: '#213431',
    muted: '#7B8882',
    line: '#E3E4DD',
    income: '#238B65',
    expense: '#C85C55',
    gold: '#BD8A30',
    coral: '#DC8C7C',
    heroText: '#F6FAF4',
    heroMuted: '#D4E4DD',
    heroDivider: '#FFFFFF22',
    overlay: '#10251D66',
    spareBackground: '#DEEEE7',
    spareText: '#1E4B42',
    walletPine: '#B6D7CC',
    walletCoral: '#EFC5BB',
    walletGold: '#E9D49A',
    walletGoal: '#C9B8DE',
    incomeBackground: '#DDF0E7',
    expenseBackground: '#F9E4E0',
    transferBackground: '#F6EDCF',
    walletAddBorder: '#AABBB3',
    dangerBackground: '#F9E4E0',
  },
  dark: {
    background: '#12231F',
    backgroundElement: '#19312C',
    backgroundSelected: '#20453B',
    text: '#EEF5EE',
    textSecondary: '#A6B5AE',
    pine: '#83B5A5',
    pine2: '#20453B',
    mint: '#20453B',
    paper: '#12231F',
    card: '#19312C',
    ink: '#EEF5EE',
    muted: '#A6B5AE',
    line: '#29443D',
    income: '#83B5A5',
    expense: '#E58A82',
    gold: '#D8AD58',
    coral: '#E3A096',
    heroText: '#E7F3ED',
    heroMuted: '#A6C5B9',
    heroDivider: '#FFFFFF1F',
    overlay: '#061610B3',
    spareBackground: '#20453B',
    spareText: '#E7F3ED',
    walletPine: '#4D776B',
    walletCoral: '#85564E',
    walletGold: '#876D36',
    walletGoal: '#75638A',
    incomeBackground: '#20453B',
    expenseBackground: '#5E302D',
    transferBackground: '#574722',
    walletAddBorder: '#648278',
    dangerBackground: '#5E302D',
  },
} as const;

export type Theme = (typeof Colors)[keyof typeof Colors];
export type ThemeColor = keyof Theme;
export type ColorScheme = keyof typeof Colors;

export const Fonts = {
  sans: 'NunitoSans_400Regular',
  sansMedium: 'NunitoSans_500Medium',
  sansSemiBold: 'NunitoSans_600SemiBold',
  sansBold: 'NunitoSans_700Bold',
  serif: 'Fraunces_500Medium',
  serifSemiBold: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 36,
  seven: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 22,
  hero: 26,
  sheet: 27,
  pill: 99,
} as const;

export const Typography = {
  eyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.9,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  heading: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 29,
    lineHeight: 31,
    letterSpacing: -1.16,
  },
  sectionHeading: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.72,
  },
  moneyHero: {
    fontFamily: Fonts.serifBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.28,
  },
  money: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.72,
  },
} as const;

export const Motion = {
  sheetDuration: 250,
  themeDuration: 300,
  walletDuration: 180,
  toggleDuration: 200,
  aiPulseDuration: 1000,
} as const;

export const Layout = {
  pagePadding: 21,
  sectionGap: 27,
  walletGap: 10,
  walletWidth: 119,
  walletHeight: 107,
  walletAddWidth: 119,
  walletAddHeight: 107,
} as const;

export const Shadows = {
  hero: {
    shadowColor: '#1E4A42',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 8,
  },
  card: {
    shadowColor: '#213431',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  fab: {
    shadowColor: '#235B50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
} as const;

export const BottomTabInset = 80;
export const MaxContentWidth = 430;

const CurrencySymbols: Record<string, string> = {
  IDR: 'Rp',
  USD: 'US$',
  SGD: 'S$',
  MYR: 'RM',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  SAR: '﷼',
  AED: 'د.إ',
};

export function formatMoney(amount: number, currency = getSelectedCurrency()) {
  const symbol = CurrencySymbols[currency] ?? currency;
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol} ${formattedAmount}`;
}
