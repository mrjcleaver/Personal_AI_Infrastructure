<template>
  <div class="notification-container">
    <TransitionGroup name="toast" tag="div" class="toast-stack">
      <div
        v-for="notification in activeNotifications"
        :key="notification.id"
        :class="['toast', `toast-${notification.priority}`, `toast-emotion-${notification.emotion || 'default'}`]"
        @click="dismissNotification(notification.id)"
      >
        <div class="toast-header">
          <span class="toast-icon">{{ getEmotionEmoji(notification.emotion) }}</span>
          <span class="toast-agent">{{ notification.agent_name }}</span>
          <span class="toast-time">{{ getTimeAgo(notification.timestamp) }}</span>
          <button class="toast-close" @click.stop="dismissNotification(notification.id)">&times;</button>
        </div>
        <div class="toast-message">{{ notification.message }}</div>
        <div v-if="notification.session_id" class="toast-session">
          Session: {{ notification.session_id.substring(0, 8) }}...
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '../composables/useNotifications';

const { activeNotifications, dismissNotification } = useNotifications();

function getEmotionEmoji(emotion?: string): string {
  const emojis: Record<string, string> = {
    excited: '🎉',
    celebration: '🎊',
    insight: '💡',
    debugging: '🐛',
    urgent: '⚠️',
    success: '✅',
    error: '❌',
  };
  return emotion && emojis[emotion] ? emojis[emotion] : '📢';
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  pointer-events: all;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toast:hover {
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.toast-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.toast-icon {
  font-size: 18px;
}

.toast-agent {
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.toast-time {
  font-size: 11px;
  color: #888;
}

.toast-close {
  background: none;
  border: none;
  color: #666;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #fff;
}

.toast-message {
  color: #ccc;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 6px;
}

.toast-session {
  font-size: 10px;
  color: #666;
  font-family: monospace;
}

/* Priority-based styling */
.toast-high {
  border-left: 4px solid #ff4444;
}

.toast-medium {
  border-left: 4px solid #ff9800;
}

.toast-low {
  border-left: 4px solid #4caf50;
}

/* Emotion-based styling */
.toast-emotion-excited,
.toast-emotion-celebration {
  background: linear-gradient(135deg, #1e1e1e 0%, #2a1e2e 100%);
  border-color: #8b5cf6;
}

.toast-emotion-urgent,
.toast-emotion-error {
  background: linear-gradient(135deg, #1e1e1e 0%, #2e1e1e 100%);
  border-color: #ef4444;
}

.toast-emotion-success {
  background: linear-gradient(135deg, #1e1e1e 0%, #1e2e1e 100%);
  border-color: #10b981;
}

.toast-emotion-insight {
  background: linear-gradient(135deg, #1e1e1e 0%, #1e2a2e 100%);
  border-color: #3b82f6;
}

.toast-emotion-debugging {
  background: linear-gradient(135deg, #1e1e1e 0%, #2e2a1e 100%);
  border-color: #f59e0b;
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
