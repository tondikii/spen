import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpenLogo } from '@/components/brand-assets';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { useAppTheme } from '@/components/theme-provider';
import { BottomTabInset, Fonts, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createBackupFile, pickBackupContent, restoreDatabase, shareBackupFile } from '@/services/backup-service';
import { currencyOptions, getSelectedCurrency, setDatabaseCurrency, setSelectedCurrency } from '@/services/settings-service';
import type { CurrencyCode } from '@/types/domain';
import { getPublicDocumentUrl } from '@/lib/public-documents';

const currencySymbols: Record<CurrencyCode, string> = { IDR: 'Rp', USD: '$', SGD: 'S$', MYR: 'RM', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', SAR: '﷼', AED: 'د.إ' };

export default function SettingsScreen({ database, onFaqPress }: { database?: SQLiteDatabase; onFaqPress?: () => void } = {}) {
  const theme = useTheme();
  const { mode, setMode } = useAppTheme();
  const [currency, setCurrency] = useState<CurrencyCode>(getSelectedCurrency());
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreFile, setRestoreFile] = useState<{ content: string; name: string } | null>(null);
  const dark = mode === 'dark';
  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(''), 2600); };

  const chooseCurrency = async (option: CurrencyCode) => {
    try { setCurrency(database ? await setDatabaseCurrency(database, option) : setSelectedCurrency(option)); setCurrencyOpen(false); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Mata uang gagal disimpan.'); }
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
      const picked = await pickBackupContent(); setBusy(false); if (!picked) return;
      setRestoreFile(picked);
    } catch (error) { setBusy(false); showToast(error instanceof Error ? error.message : 'File backup tidak dapat dibaca.'); }
  };
  const openLink = async (url: string) => { try { await Linking.openURL(url); } catch { showToast('Halaman belum bisa dibuka.'); } };

  return <ThemedView style={styles.page}><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><ThemedText type="code" themeColor="muted" style={styles.eyebrow}>PENGATURAN</ThemedText><ThemedText type="title">Pengaturan</ThemedText></View>
    <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>TAMPILAN</ThemedText>
    <ThemedView style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}><SettingRow icon="☼" title="Tema gelap" detail="Sesuaikan suasana aplikasimu"><Pressable accessibilityRole="switch" accessibilityLabel="Tema gelap" onPress={() => setMode(dark ? 'light' : 'dark')} style={[styles.toggle, { backgroundColor: dark ? theme.pine : theme.line }]}><View style={[styles.toggleKnob, dark && { transform: [{ translateX: 15 }] }]} /></Pressable></SettingRow></ThemedView>
    <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>PREFERENSI</ThemedText>
    <ThemedView style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}><SettingRow icon="¤" title="Mata uang" detail="Dipakai untuk semua Wallet"><Pressable accessibilityRole="button" accessibilityLabel="Pilih mata uang" onPress={() => setCurrencyOpen((open) => !open)} style={[styles.dropdown, { borderColor: theme.line }]}><ThemedText type="smallBold" themeColor="pine">{currency}⌄</ThemedText></Pressable></SettingRow>{currencyOpen && <View style={[styles.currencyGrid, { borderTopColor: theme.line }]}>{currencyOptions.map((option) => <Pressable key={option} accessibilityRole="button" accessibilityLabel={`Pilih mata uang ${option}`} onPress={() => { void chooseCurrency(option); }} style={[styles.currency, { borderColor: currency === option ? theme.pine : theme.line, backgroundColor: currency === option ? theme.mint : theme.card }]}><ThemedText style={styles.currencySymbol} themeColor={currency === option ? 'pine' : 'muted'}>{currencySymbols[option]}</ThemedText><ThemedText type="smallBold" themeColor={currency === option ? 'pine' : 'ink'}>{option}</ThemedText></Pressable>)}</View>}</ThemedView>
    <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>DATA</ThemedText>
    <ThemedView style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}><ActionRow icon="↓" title="Backup data" detail={busy ? 'Menyiapkan file…' : 'Simpan salinan data'} onPress={() => { void runBackup(); }} /><ActionRow icon="↑" title="Restore data" detail={busy ? 'Memproses file…' : 'Timpa dari file backup'} onPress={() => { void runRestore(); }} /></ThemedView>
    <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>BANTUAN</ThemedText>
    <ThemedView style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}><ActionRow icon="?" title="FAQ" detail="Jawaban singkat tentang Spen" onPress={onFaqPress ?? (() => undefined)} /><ActionRow icon="!" title="Aduan masalah" detail="Beri tahu kalau ada yang tidak beres" onPress={() => { void openLink('mailto:tondikiag30@gmail.com?subject=Aduan%20masalah%20Spen'); }} /><ActionRow icon="›" title="Syarat & Ketentuan" detail="Baca ketentuan penggunaan" onPress={() => { void openLink(getPublicDocumentUrl('/terms')); }} /><ActionRow icon="›" title="Kebijakan Privasi" detail="Baca cara data dipakai" onPress={() => { void openLink(getPublicDocumentUrl('/privacy')); }} /></ThemedView>
    <View style={styles.footer}><SpenLogo size={42} /><ThemedText type="smallBold" themeColor="muted">Spen</ThemedText><ThemedText type="small" themeColor="muted">Versi {Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0'}</ThemedText></View>
    <ConfirmationModal visible={restoreFile !== null} title="Timpa semua data?" message="Restore akan mengganti seluruh data Spen saat ini." confirmLabel="Restore" destructive onCancel={() => setRestoreFile(null)} onConfirm={async () => {
      if (!database || !restoreFile) return;
      const file = restoreFile;
      setRestoreFile(null); setBusy(true);
      try { await restoreDatabase(database, file.content); showToast('Data berhasil dipulihkan.'); }
      catch (error) { showToast(error instanceof Error ? error.message : 'Restore gagal.'); }
      finally { setBusy(false); }
    }} />
  </ScrollView>{toast && <View style={[styles.toast, { backgroundColor: theme.ink }]}><ThemedText type="small" style={{ color: theme.background }}>✓ {toast}</ThemedText></View>}</SafeAreaView></ThemedView>;
}

function SettingRow({ icon, title, detail, children }: { icon: string; title: string; detail: string; children: ReactNode }) { const theme = useTheme(); return <View style={[styles.row, { borderBottomColor: theme.line }]}><ThemedText style={[styles.icon, { backgroundColor: theme.mint, color: theme.pine }]}>{icon}</ThemedText><View style={styles.copy}><ThemedText type="smallBold" style={styles.rowTitle}>{title}</ThemedText><ThemedText type="small" themeColor="muted" style={styles.rowDetail}>{detail}</ThemedText></View>{children}</View>; }
function ActionRow({ icon, title, detail, onPress }: { icon: string; title: string; detail: string; onPress: () => void }) { const theme = useTheme(); return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: theme.line }, pressed && styles.pressed]}><ThemedText style={[styles.icon, { backgroundColor: theme.mint, color: theme.pine }]}>{icon}</ThemedText><View style={styles.copy}><ThemedText type="smallBold" style={styles.rowTitle}>{title}</ThemedText><ThemedText type="small" themeColor="muted" style={styles.rowDetail}>{detail}</ThemedText></View><ThemedText style={styles.chevron} themeColor="muted">›</ThemedText></Pressable>; }
const styles = StyleSheet.create({
  page: { flex: 1 }, safeArea: { flex: 1 }, content: { alignSelf: 'center', maxWidth: 430, paddingBottom: BottomTabInset + 24, paddingHorizontal: 21, paddingTop: 24, width: '100%' }, header: { marginBottom: 26, marginTop: 4 }, eyebrow: { marginBottom: 4, ...Typography.eyebrow }, groupLabel: { marginBottom: 8, marginTop: 18 }, group: { borderRadius: 19, borderWidth: 1, overflow: 'hidden' }, row: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 64, paddingHorizontal: 14, paddingVertical: 12 }, icon: { alignItems: 'center', borderRadius: 10, fontFamily: Fonts.mono, fontSize: 12, height: 31, justifyContent: 'center', textAlign: 'center', width: 31 }, copy: { flex: 1 }, rowTitle: { fontSize: 12, lineHeight: 16 }, rowDetail: { fontSize: 10, lineHeight: 14 }, chevron: { fontSize: 22, lineHeight: 26 }, toggle: { borderRadius: Radius.pill, height: 22, padding: 3, width: 37 }, toggleKnob: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, height: 16, width: 16 }, dropdown: { alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 }, currencyGrid: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 13 }, currency: { alignItems: 'center', borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 8 }, currencySymbol: { fontFamily: Fonts.mono, fontSize: 11 }, footer: { alignItems: 'center', gap: 4, marginTop: 53 }, toast: { alignSelf: 'center', borderRadius: 12, bottom: 12, paddingHorizontal: 14, paddingVertical: 11, position: 'absolute' }, pressed: { opacity: 0.7 },
});
