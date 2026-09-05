import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import logoSvg from '../../assets/spen/logo.svg';
import splashSvg from '../../assets/spen/splash.svg';

export function SpenLogo({ size = 42 }: { size?: number }) {
  const { t } = useTranslation();
  return (
    <SvgXml accessibilityLabel={t('common.brandLogo')} xml={logoSvg} width={size} height={size} />
  );
}

export function SpenSplash() {
  const { t } = useTranslation();
  return (
    <SvgXml
      accessibilityLabel={t('common.splashScreen')}
      xml={splashSvg}
      width="100%"
      height="100%"
    />
  );
}
