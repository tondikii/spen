import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';

import { SetupWizard, completeSetup, getSetupState } from '@/features/setup';
import { Fonts, Shadows, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { MotionPressable } from '@/components/ui/motion';

type TabItem = {
  name: 'home/index' | 'plan' | 'report' | 'settings/index';
  translationKey: 'home' | 'plan' | 'report' | 'settings';
  icon: ComponentProps<typeof Ionicons>['name'];
  activeIcon: ComponentProps<typeof Ionicons>['name'];
};

const tabs: TabItem[] = [
  {
    name: 'home/index',
    translationKey: 'home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'plan',
    translationKey: 'plan',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  {
    name: 'report',
    translationKey: 'report',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
  },
  {
    name: 'settings/index',
    translationKey: 'settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
];

const tabIconSize = 22;

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
        tabBarIconStyle: styles.iconSlot,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      {localizedTabs.slice(0, 2).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                color={color}
                name={focused ? tab.activeIcon : tab.icon}
                size={tabIconSize}
              />
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
              hitSlop={8}
              onPress={() => router.push({ pathname: '/create' })}
              style={[
                styles.addButton,
                { backgroundColor: theme.pine, borderColor: theme.background },
              ]}
            >
              <Ionicons color="#FFFFFF" name="add" size={30} />
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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                color={color}
                name={focused ? tab.activeIcon : tab.icon}
                size={tabIconSize}
              />
            ),
          }}
        />
      ))}
      {/* Nested screens: not items in the persistent tab bar. */}
      <Tabs.Screen name="home/daily" options={{ href: null }} />
      <Tabs.Screen name="settings/faq" options={{ href: null }} />
      <Tabs.Screen name="settings/terms" options={{ href: null }} />
      <Tabs.Screen name="settings/privacy" options={{ href: null }} />
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
    paddingTop: 2,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    lineHeight: 12,
  },
  iconSlot: {
    height: 32,
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
  pressed: {
    opacity: 0.75,
  },
});
