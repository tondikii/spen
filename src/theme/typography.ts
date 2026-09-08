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
