import { useEffect, useState } from 'react';

/* The hydration flip is intentional for static web rendering. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
/* eslint-enable react-hooks/set-state-in-effect */
