import { useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { currencyOptions, getSelectedCurrency, setDatabaseCurrency, setSelectedCurrency } from '@/services/settings-service';
import { createBackupFile, pickBackupContent, restoreDatabase, shareBackupFile } from '@/services/backup-service';
import type { CurrencyCode } from '@/types/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/components/theme-provider';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen({ database }: { database?: SQLiteDatabase } = {}) {
  const theme = useTheme();
  const { mode, setMode } = useAppTheme();
  const [currency, setCurrency] = useState<CurrencyCode>(getSelectedCurrency());
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const dark = mode === 'dark';
  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(''), 2600); };
  const chooseCurrency = async (option: CurrencyCode) => {
    try {
      setCurrency(database ? await setDatabaseCurrency(database, option) : setSelectedCurrency(option));
      setCurrencyOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Mata uang gagal disimpan.');
    }
  };
  const runBackup = async () => {
    if (!database) { showToast('Backup tersedia di aplikasi utama.'); return; }
    setBusy(true);
    try { await shareBackupFile(await createBackupFile(database)); showToast('Backup siap dibagikan.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Backup gagal dibuat.'); }
    finally { setBusy(false); }
  };
  const runRestore = async () => {
    if (!database) { showToast('Restore tersedia di aplikasi utama.'); return; }
    setBusy(true);
    try {
      const picked = await pickBackupContent();
      setBusy(false);
      if (!picked) return;
      Alert.alert('Timpa semua data?', 'Restore akan mengganti seluruh data Spen saat ini.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => { void (async () => { setBusy(true); try { await restoreDatabase(database, picked.content); showToast('Data berhasil dipulihkan.'); } catch (error) { showToast(error instanceof Error ? error.message : 'Restore gagal.'); } finally { setBusy(false); } })(); } },
      ]);
    } catch (error) { setBusy(false); showToast(error instanceof Error ? error.message : 'File backup tidak dapat dibaca.'); }
  };
  return <ThemedView style={styles.page}><View style={styles.content}>
    <View style={styles.header}><ThemedText type="code" themeColor="muted" style={styles.eyebrow}>PENGATURAN</ThemedText><ThemedText type="title">Settings</ThemedText></View>
    <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>TAMPILAN</ThemedText>
    <ThemedView style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}><SettingRow icon="☼" title="Tema gelap" detail="Sesuaikan suasana aplikasimu"><Pressable accessibilityRole="switch" accessibilityLabel="Tema gelap" onPress={() => setMode(dark ? 'light' : 'dark')} style={[styles.toggle, { backgroundColor: dark ? theme.pine : theme.line }]}><View style={[styles.toggleKnob, dark && { transform: [{ translateX: 15 }] }]} /></Pressable></SettingRow></ThemedView>
    <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>PENGATURAN</ThemedText>
    <ThemedView style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}><SettingRow icon="¤" title="Mata uang" detail="Dipakai untuk semua Wallet"><Pressable accessibilityRole="button" accessibilityLabel="Pilih mata uang" onPress={() => setCurrencyOpen((open) => !open)}><ThemedText type="smallBold" themeColor="pine">{currency}⌄</ThemedText></Pressable></SettingRow>{currencyOpen && <View style={[styles.currencyGrid, { borderTopColor: theme.line }]}>{currencyOptions.map((option) => <Pressable key={option} accessibilityRole="button" accessibilityLabel={`Pilih mata uang ${option}`} onPress={() => { void chooseCurrency(option); }} style={[styles.currency, { borderColor: currency === option ? theme.pine : theme.line, backgroundColor: currency === option ? theme.mint : theme.card }]}><ThemedText type="smallBold" themeColor={currency === option ? 'pine' : 'ink'}>{option}</ThemedText></Pressable>)}</View>}</ThemedView>
    <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>DATA</ThemedText>
    <ThemedView style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}><ActionRow icon="↓" title="Backup data" detail={busy ? 'Menyiapkan file…' : 'Simpan salinan JSON'} onPress={() => { void runBackup(); }} /><ActionRow icon="↑" title="Restore data" detail={busy ? 'Memproses file…' : 'Timpa dari file backup'} onPress={() => { void runRestore(); }} /></ThemedView>
    <View style={styles.footer}><ThemedText style={[styles.brand, { backgroundColor: theme.pine, color: theme.heroText }]}>S</ThemedText><ThemedText type="smallBold" themeColor="muted">Spen</ThemedText><ThemedText type="small" themeColor="muted">Versi 1.0</ThemedText></View>
    {toast && <View style={[styles.toast, { backgroundColor: theme.ink }]}><ThemedText type="small" style={{ color: theme.background }}>✓ {toast}</ThemedText></View>}
  </View></ThemedView>;
}

function SettingRow({ icon, title, detail, children }: { icon: string; title: string; detail: string; children: ReactNode }) { const theme = useTheme(); return <View style={[styles.row, { borderBottomColor: theme.line }]}><ThemedText style={[styles.icon, { backgroundColor: theme.mint, color: theme.pine }]}>{icon}</ThemedText><View style={styles.copy}><ThemedText type="smallBold">{title}</ThemedText><ThemedText type="small" themeColor="muted">{detail}</ThemedText></View>{children}</View>; }
function ActionRow({ icon, title, detail, onPress }: { icon: string; title: string; detail: string; onPress: () => void }) { const theme = useTheme(); return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={[styles.row, { borderBottomColor: theme.line }]}><ThemedText style={[styles.icon, { backgroundColor: theme.mint, color: theme.pine }]}>{icon}</ThemedText><View style={styles.copy}><ThemedText type="smallBold">{title}</ThemedText><ThemedText type="small" themeColor="muted">{detail}</ThemedText></View><ThemedText type="subtitle" themeColor="muted">›</ThemedText></Pressable>; }

const styles = StyleSheet.create({ page: { flex: 1 }, content: { maxWidth: 430, padding: 21, width: '100%' }, header: { marginBottom: 28, marginTop: 7 }, eyebrow: { ...Typography.eyebrow }, groupLabel: { marginBottom: 8, marginTop: 21 }, group: { borderRadius: 19, borderWidth: 1, overflow: 'hidden' }, row: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 11, padding: 13 }, icon: { alignItems: 'center', borderRadius: 10, fontFamily: Fonts.mono, fontSize: 12, height: 31, justifyContent: 'center', textAlign: 'center', width: 31 }, copy: { flex: 1 }, toggle: { borderRadius: Radius.pill, height: 22, padding: 3, width: 37 }, toggleKnob: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, height: 16, width: 16 }, currencyGrid: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 13 }, currency: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, footer: { alignItems: 'center', gap: 4, marginTop: 53 }, brand: { borderRadius: 10, fontFamily: Fonts.serif, fontSize: 17, height: 29, lineHeight: 29, textAlign: 'center', width: 29 }, toast: { alignSelf: 'center', borderRadius: 12, bottom: 12, paddingHorizontal: 14, paddingVertical: 11, position: 'absolute' } });
