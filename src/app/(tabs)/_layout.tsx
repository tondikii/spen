import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';

import { SetupWizard, completeSetup, getSetupState } from '@/features/setup';
import { Fonts, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MotionPressable } from '@/components/motion';

type TabItem = {
  name: 'index' | 'plan' | 'report' | 'settings';
  translationKey: 'home' | 'plan' | 'report' | 'settings';
  icon: string;
  iconSize?: number;
};

const tabs: TabItem[] = [
  { name: 'index', translationKey: 'home', icon: '⌂' },
  { name: 'plan', translationKey: 'plan', icon: '▤' },
  { name: 'report', translationKey: 'report', icon: '◔', iconSize: 23 },
  { name: 'settings', translationKey: 'settings', icon: '☼', iconSize: 23 },
];

function AppTabs() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const localizedTabs = tabs.map((tab) => ({
    ...tab,
    label: t(`common.${tab.translationKey}`),
  }));
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.paper },
        tabBarActiveTintColor: theme.pine,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: `${theme.card}F0`,
            borderTopColor: theme.line,
            paddingBottom: Math.max(insets.bottom, Spacing.two),
            height: 74 + Math.max(insets.bottom, Spacing.two),
          },
        ],
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {localizedTabs.slice(0, 2).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color }) => (
              <Text
                style={[
                  styles.icon,
                  tab.iconSize ? { fontSize: tab.iconSize, lineHeight: tab.iconSize + 4 } : null,
                  { color },
                ]}
              >
                {tab.icon}
              </Text>
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarAccessibilityLabel: t('common.addTransaction'),
          tabBarStyle: { display: 'none' },
          tabBarButton: () => (
            <MotionPressable
              accessibilityLabel={t('common.addTransaction')}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/create' })}
              style={[
                styles.addButton,
                { backgroundColor: theme.pine, borderColor: theme.background },
              ]}
            >
              <Text style={styles.addIcon}>＋</Text>
            </MotionPressable>
          ),
        }}
      />
      {localizedTabs.slice(2).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color }) => (
              <Text
                style={[
                  styles.icon,
                  tab.iconSize ? { fontSize: tab.iconSize, lineHeight: tab.iconSize + 4 } : null,
                  { color },
                ]}
              >
                {tab.icon}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

// The setup wizard keeps the tab bar hidden until the first wallet exists.
function TabsLayout() {
  const sqlite = useSQLiteContext();
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSetupState(sqlite)
      .then((setup) => {
        if (!cancelled) setSetupComplete(setup.hasWallet);
      })
      .catch(() => {
        if (!cancelled) setSetupComplete(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sqlite]);

  if (setupComplete === null) return null;
  if (!setupComplete)
    return (
      <SetupWizard
        onComplete={async (wallets, currency, locale) => {
          await completeSetup(sqlite, wallets, currency, locale);
          setSetupComplete(true);
        }}
      />
    );
  return <AppTabs />;
}

export default TabsLayout;

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    minWidth: 64,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 12,
  },
  icon: {
    fontFamily: Fonts.sans,
    fontSize: 19,
    lineHeight: 22,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 4,
    height: 58,
    justifyContent: 'center',
    marginHorizontal: Spacing.two,
    marginTop: -31,
    width: 58,
    ...Shadows.fab,
  },
  addIcon: {
    color: '#FFFFFF',
    fontFamily: Fonts.sans,
    fontSize: 31,
    lineHeight: 34,
  },
  pressed: {
    opacity: 0.75,
  },
});
