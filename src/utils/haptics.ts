import * as Haptics from 'expo-haptics';

/**
 * Light tap - for button presses, selections
 */
export function lightTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium tap - for adding water, confirmations
 */
export function mediumTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Success feedback - for goal reached, achievements
 */
export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Warning feedback - for destructive actions
 */
export function warningFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Selection changed - for toggles, pickers
 */
export function selectionChanged() {
  Haptics.selectionAsync();
}
