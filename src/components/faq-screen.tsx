import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PageHeader } from '@/components/ui-primitives';
import { Fonts, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { faqEntries } from '@/lib/faq';

type FaqScreenProps = {
  onBack: () => void;
};

export default function FaqScreen({ onBack }: FaqScreenProps) {
  const theme = useTheme();
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (question: string) => {
    setOpenQuestions((current) => {
      const next = new Set(current);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });
  };

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Kembali"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <ThemedText style={styles.backIcon} themeColor="pine">
              ‹
            </ThemedText>
            <ThemedText type="smallBold" themeColor="pine">
              Kembali
            </ThemedText>
          </Pressable>

          <View style={styles.header}>
            <PageHeader eyebrow="BANTUAN" title="FAQ" />
            <ThemedText type="small" themeColor="muted" style={styles.subtitle}>
              Jawaban singkat tentang cara kerja Spen.
            </ThemedText>
          </View>

          <View style={styles.list}>
            {faqEntries.map((entry) => {
              const expanded = openQuestions.has(entry.question);
              return (
                <ThemedView
                  key={entry.question}
                  style={[styles.item, { backgroundColor: theme.card, borderColor: theme.line }]}
                >
                  <Pressable
                    accessibilityLabel={entry.question}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    onPress={() => toggleQuestion(entry.question)}
                    style={({ pressed }) => [styles.question, pressed && styles.pressed]}
                  >
                    <ThemedText type="smallBold" style={styles.questionText}>
                      {entry.question}
                    </ThemedText>
                    <ThemedText style={[styles.chevron, { color: theme.pine }]}>
                      {expanded ? '⌃' : '⌄'}
                    </ThemedText>
                  </Pressable>
                  {expanded && (
                    <ThemedText
                      type="small"
                      themeColor="muted"
                      style={[styles.answer, { borderTopColor: theme.line }]}
                    >
                      {entry.answer}
                    </ThemedText>
                  )}
                </ThemedView>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: 430,
    paddingBottom: Spacing.five,
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.two,
    width: '100%',
  },
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: 32,
  },
  backIcon: { fontFamily: Fonts.sans, fontSize: 28, lineHeight: 28 },
  header: { marginBottom: Spacing.four, marginTop: Spacing.four },
  eyebrow: { ...Typography.eyebrow, marginBottom: Spacing.one },
  subtitle: { marginTop: Spacing.one },
  list: { gap: Spacing.two },
  item: { borderRadius: Radius.medium, borderWidth: 1, overflow: 'hidden' },
  question: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 58,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  questionText: { flex: 1 },
  chevron: { fontFamily: Fonts.sans, fontSize: 22, lineHeight: 22 },
  answer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
