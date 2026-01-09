// $PAI_DIR/observability/apps/client/src/composables/useNotifications.ts
// Notification management composable

import { ref, computed } from 'vue';

export interface Notification {
  id: string;
  notification_type: 'agent_response' | 'subagent_response';
  agent_name: string;
  message: string;
  emotion?: string;
  emotional_markers?: string[];
  personality?: string;
  priority: 'low' | 'medium' | 'high';
  session_id: string;
  timestamp: number;
  dismissed?: boolean;
}

const STORAGE_KEY = 'pai_notifications';
const MAX_AGE_DAYS = 7;

// Active notifications (in-memory)
const notifications = ref<Notification[]>([]);

// Audio context for sound effects
let audioContext: AudioContext | null = null;

// Initialize audio context
function initAudio() {
  if (!audioContext && typeof AudioContext !== 'undefined') {
    audioContext = new AudioContext();
  }
}

// Play notification sound based on emotion
function playSound(emotion?: string, priority?: string) {
  if (!audioContext) initAudio();
  if (!audioContext) return;

  const ctx = audioContext;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Different sounds for different contexts
  if (priority === 'high' || emotion === 'urgent') {
    // Alert beep: higher frequency, shorter
    oscillator.frequency.value = 880;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } else if (emotion === 'excited' || emotion === 'celebration') {
    // Pleasant chime: rising tone
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } else {
    // Subtle click: very short, mid-frequency
    oscillator.frequency.value = 440;
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }
}

// Request browser notification permission
async function requestPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

// Show desktop notification
function showDesktopNotification(notif: Notification) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const emotionIcon = getEmotionIcon(notif.emotion);
    const notification = new Notification(notif.agent_name, {
      body: notif.message,
      icon: emotionIcon,
      tag: notif.session_id,
      requireInteraction: notif.priority === 'high',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Get emotion icon (emoji as data URI)
function getEmotionIcon(emotion?: string): string {
  const emojis: Record<string, string> = {
    excited: '🎉',
    celebration: '🎊',
    insight: '💡',
    debugging: '🐛',
    urgent: '⚠️',
    success: '✅',
    error: '❌',
  };

  const emoji = emotion && emojis[emotion] ? emojis[emotion] : '📢';
  // Return emoji as text (browsers will render it)
  return emoji;
}

// Load notifications from localStorage
function loadFromStorage(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: Notification[] = JSON.parse(stored);
    const maxAge = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

    // Filter out old notifications
    return parsed.filter(n => n.timestamp > maxAge);
  } catch (error) {
    console.error('Failed to load notifications:', error);
    return [];
  }
}

// Save notifications to localStorage
function saveToStorage(notifs: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
}

// Initialize notifications from storage
notifications.value = loadFromStorage();

export function useNotifications() {
  // Add a new notification
  function addNotification(notif: Omit<Notification, 'id'>) {
    const notification: Notification = {
      ...notif,
      id: `${notif.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      dismissed: false,
    };

    notifications.value.unshift(notification);

    // Save to localStorage
    saveToStorage(notifications.value);

    // Play sound
    playSound(notification.emotion, notification.priority);

    // Show desktop notification
    showDesktopNotification(notification);

    // Auto-dismiss after 5 seconds (except high priority)
    if (notification.priority !== 'high') {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 5000);
    }
  }

  // Dismiss a notification
  function dismissNotification(id: string) {
    const notif = notifications.value.find(n => n.id === id);
    if (notif) {
      notif.dismissed = true;
      saveToStorage(notifications.value);
    }
  }

  // Clear all notifications
  function clearAll() {
    notifications.value.forEach(n => n.dismissed = true);
    saveToStorage(notifications.value);
  }

  // Clear old notifications (>7 days)
  function clearOld() {
    const maxAge = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    notifications.value = notifications.value.filter(n => n.timestamp > maxAge);
    saveToStorage(notifications.value);
  }

  // Export history as JSON
  function exportHistory() {
    const data = JSON.stringify(notifications.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pai-notifications-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Get active (not dismissed) notifications
  const activeNotifications = computed(() =>
    notifications.value.filter(n => !n.dismissed)
  );

  // Get notification count
  const notificationCount = computed(() => activeNotifications.value.length);

  return {
    notifications,
    activeNotifications,
    notificationCount,
    addNotification,
    dismissNotification,
    clearAll,
    clearOld,
    exportHistory,
    requestPermission,
  };
}
