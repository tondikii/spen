import { StyleSheet } from 'react-native';

/** Sheet-modal styles shared by the plan payment, item and goal forms. */
export const planSheetStyles = StyleSheet.create({
  sheetScroll: { flexGrow: 1 },
  goalSheetContent: { gap: 8, paddingBottom: 4 },
  goalSheet: {
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    gap: 8,
    maxHeight: '90%',
    padding: 21,
  },
  goalInput: { borderBottomWidth: 1, fontSize: 16, minHeight: 44, paddingHorizontal: 8 },
  saveGoal: { alignItems: 'center', borderRadius: 13, marginTop: 8, padding: 13 },
});
