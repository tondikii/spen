import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import { MotionPressable } from '@/components/motion';

type TabItem = {
  name: 'index' | 'plan' | 'report' | 'settings';
  translationKey: 'home' | 'plan' | 'report' | 'settings';
  icon: 'home-variant-outline' | 'clipboard-text-outline' | 'chart-pie-outline' | 'cog-outline';
};

const tabs: TabItem[] = [
  { name: 'index', translationKey: 'home', icon: 'home-variant-outline' },
  { name: 'plan', translationKey: 'plan', icon: 'clipboard-text-outline' },
  { name: 'report', translationKey: 'report', icon: 'chart-pie-outline' },
  { name: 'settings', translationKey: 'settings', icon: 'cog-outline' },
];

export default function AppTabs() {
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
              <MaterialCommunityIcons name={tab.icon} size={24} color={color} />
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
              onPress={() => router.push({ pathname: '/create' } as never)}
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
              <MaterialCommunityIcons name={tab.icon} size={24} color={color} />
            ),
          }}
        />
      ))}
      {/* These are full-screen routes, not items in the persistent tab bar. */}
      <Tabs.Screen
        name="daily"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="terms"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="privacy"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="faq"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

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
