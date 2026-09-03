import { SvgXml } from 'react-native-svg';

import logoSvg from '../../assets/spen/logo.svg';
import splashSvg from '../../assets/spen/splash.svg';

export function SpenLogo({ size = 42 }: { size?: number }) {
  return <SvgXml accessibilityLabel="Logo Spen" xml={logoSvg} width={size} height={size} />;
}

export function SpenSplash() {
  return <SvgXml accessibilityLabel="Splash screen Spen" xml={splashSvg} width="100%" height="100%" />;
}
