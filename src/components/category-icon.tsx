import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, type TextStyle } from 'react-native';

// Nama ikon disimpan di Category agar data tetap kecil dan mudah diekspor.
export const CATEGORY_ICON_CHOICES = [
  'silverware-fork-knife', 'food-apple', 'coffee', 'cup', 'pizza', 'cake-variant',
  'bottle-soda', 'ice-cream', 'cart', 'shopping', 'shopping-outline', 'basket',
  'tshirt-crew-outline', 'bag-personal-outline', 'home-outline', 'office-building-outline',
  'sofa-outline', 'bed-outline', 'lightbulb-outline', 'water-outline', 'wifi',
  'cellphone', 'laptop', 'monitor', 'printer-outline', 'car', 'motorbike', 'bus',
  'train', 'airplane', 'bike', 'gas-station-outline', 'map-marker-outline', 'taxi',
  'walk', 'medical-bag', 'hospital-box-outline', 'pill', 'tooth-outline', 'dumbbell',
  'run', 'heart-pulse', 'bandage', 'school-outline', 'book-open-variant', 'pencil-outline',
  'briefcase-outline', 'account-tie-outline', 'cash-multiple', 'bank-outline', 'wallet-outline',
  'credit-card-outline', 'chart-line', 'chart-pie', 'receipt-text-outline', 'calculator-variant-outline',
  'gift-outline', 'party-popper', 'music', 'movie-open-outline', 'gamepad-variant-outline',
  'book-open-page-variant-outline', 'camera-outline', 'palette-outline', 'flower-outline',
  'tree-outline', 'paw', 'cat', 'dog', 'baby-face-outline', 'account-group-outline',
  'account-heart-outline', 'heart-outline', 'star-outline', 'weather-sunny', 'white-balance-sunny',
  'umbrella-outline', 'cloud-outline', 'tools', 'hammer-wrench', 'wrench-outline', 'lock-outline',
  'shield-check-outline', 'key-outline', 'bell-outline', 'calendar-month-outline', 'clock-outline',
  'phone-outline', 'email-outline', 'package-variant-closed', 'truck-outline', 'earth', 'plus-circle-outline',
] as const;

type IconName = (typeof CATEGORY_ICON_CHOICES)[number];

export function CategoryIcon({ name, size = 22, color = '#235B50', style }: { name?: string; size?: number; color?: string; style?: TextStyle }) {
  if (name && CATEGORY_ICON_CHOICES.includes(name as IconName)) {
    return <MaterialCommunityIcons name={name as IconName} size={size} color={color} />;
  }
  return <Text style={[styles.legacy, { color, fontSize: size }, style]}>{name || '◈'}</Text>;
}

const styles = StyleSheet.create({ legacy: { fontFamily: 'NunitoSans_600SemiBold', lineHeight: 24, textAlign: 'center' } });
