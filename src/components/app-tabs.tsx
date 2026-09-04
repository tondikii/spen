import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabItem = {
  name: 'index' | 'plan' | 'report' | 'settings';
  label: string;
  icon: string;
};

const tabs: TabItem[] = [
  { name: 'index', label: 'Beranda', icon: '⌂' },
  { name: 'plan', label: 'Rencana', icon: '▤' },
  { name: 'report', label: 'Laporan', icon: '◔' },
  { name: 'settings', label: 'Pengaturan', icon: '☼' },
];

export default function AppTabs() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      {tabs.slice(0, 2).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>{tab.icon}</Text>,
          }}
        />
      ))}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarAccessibilityLabel: 'Tambah transaksi',
          tabBarStyle: { display: 'none' },
          tabBarButton: () => (
            <Pressable
              accessibilityLabel="Tambah transaksi"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/create' } as never)}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.pine, borderColor: theme.background },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.addIcon}>＋</Text>
            </Pressable>
          ),
        }}
      />
      {tabs.slice(2).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarAccessibilityLabel: tab.label,
            tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>{tab.icon}</Text>,
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
