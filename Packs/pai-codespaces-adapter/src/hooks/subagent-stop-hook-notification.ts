#!/usr/bin/env bun
/**
 * PAI Notification Subagent Stop Hook - Subagent Browser Notifications
 *
 * This hook runs when a subagent (spawned via Task tool) finishes responding.
 * It extracts messages and sends them to the observability dashboard.
 *
 * Part of the PAI Codespaces adaptation.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { enhanceProsody, cleanForSpeech } from './lib/prosody-enhancer';

// Configuration
const OBSERVABILITY_URL = process.env.OBSERVABILITY_URL || 'http://localhost:4000';
const PAI_DIR = process.env.PAI_DIR || join(homedir(), '.claude');

interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
}

interface NotificationPayload {
  notification_type: 'subagent_response';
  agent_name: string;
  message: string;
  emotion?: string;
  emotional_markers?: string[];
  personality?: string;
  priority: 'low' | 'medium' | 'high';
  session_id: string;
  timestamp: number;
}

/**
 * Convert Claude content to plain text
 */
function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(c => {
        if (typeof c === 'string') return c;
        if (c?.text) return c.text;
        if (c?.content) return contentToText(c.content);
        return '';
      })
      .join(' ')
      .trim();
  }
  return '';
}

/**
 * Extract agent name from response
 */
function extractAgentName(text: string): string | null {
  const agentMatch = text.match(/\[AGENT:(\w+)\]/i);
  return agentMatch ? agentMatch[1] : null;
}

/**
 * Extract personality from agent type
 */
function detectPersonality(agentName: string): string | undefined {
  const personalities: Record<string, string> = {
    researcher: 'analytical',
    architect: 'strategic',
    engineer: 'pragmatic',
    designer: 'creative',
    critic: 'discerning',
    intern: 'enthusiastic',
  };

  const lowerName = agentName.toLowerCase();
  for (const [type, personality] of Object.entries(personalities)) {
    if (lowerName.includes(type)) {
      return personality;
    }
  }

  return undefined;
}

/**
 * Extract emotion from prosody markers
 */
function detectEmotion(text: string): { emotion?: string; markers: string[] } {
  const emotionPatterns = [
    { pattern: /\[💥 excited\]/i, emotion: 'excited' },
    { pattern: /\[🎉 celebration\]/i, emotion: 'celebration' },
    { pattern: /\[💡 insight\]/i, emotion: 'insight' },
    { pattern: /\[🐛 debugging\]/i, emotion: 'debugging' },
    { pattern: /\[⚠️ urgent\]/i, emotion: 'urgent' },
    { pattern: /\[✅ success\]/i, emotion: 'success' },
    { pattern: /\[❌ error\]/i, emotion: 'error' },
  ];

  const markers: string[] = [];
  let primaryEmotion: string | undefined;

  for (const { pattern, emotion } of emotionPatterns) {
    if (pattern.test(text)) {
      markers.push(emotion);
      if (!primaryEmotion) {
        primaryEmotion = emotion;
      }
    }
  }

  return { emotion: primaryEmotion, markers };
}

/**
 * Extract the notification message from the response
 */
function extractNotificationMessage(text: string): { message: string; agentName: string | null } | null {
  // Remove system-reminder tags
  text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');

  // Extract agent name
  const agentName = extractAgentName(text);

  // Patterns to try
  const patterns = [
    /🗣️\s*\*{0,2}[\w\s]+:?\*{0,2}\s*(.+?)(?:\n|$)/is,
    /🎯\s*\*{0,2}COMPLETED:?\*{0,2}\s*(.+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let message = match[1].trim();
      message = message.replace(/^\[AGENT:\w+\]\s*/i, '');
      message = cleanForSpeech(message);
      message = enhanceProsody(message, agentName?.toLowerCase() || 'agent');
      return { message, agentName };
    }
  }

  return null;
}

/**
 * Read the last assistant message from the transcript
 */
function getLastAssistantMessage(transcriptPath: string): string {
  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n');

    let lastAssistantMessage = '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const entry = JSON.parse(line) as any;
          if (entry.type === 'assistant' && entry.message?.content) {
            const text = contentToText(entry.message.content);
            if (text) {
              lastAssistantMessage = text;
            }
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    return lastAssistantMessage;
  } catch (error) {
    console.error('Error reading transcript:', error);
    return '';
  }
}

/**
 * Send notification to the observability server
 */
async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    const response = await fetch(`${OBSERVABILITY_URL}/notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Notification server error:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

async function main() {
  let hookInput: HookInput | null = null;

  // Read hook input from stdin
  try {
    const decoder = new TextDecoder();
    const reader = Bun.stdin.stream().getReader();
    let input = '';

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });

    const readPromise = (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        input += decoder.decode(value, { stream: true });
      }
    })();

    await Promise.race([readPromise, timeoutPromise]);

    if (input.trim()) {
      hookInput = JSON.parse(input) as HookInput;
    }
  } catch (error) {
    console.error('Error reading hook input:', error);
  }

  // Extract notification message from the last response
  let extractedData: { message: string; agentName: string | null } | null = null;

  if (hookInput && hookInput.transcript_path) {
    const lastMessage = getLastAssistantMessage(hookInput.transcript_path);
    if (lastMessage) {
      extractedData = extractNotificationMessage(lastMessage);
    }
  }

  // Send notification if we have a message
  if (extractedData && hookInput) {
    const { emotion, markers } = detectEmotion(extractedData.message);
    const agentName = extractedData.agentName || 'Subagent';
    const personality = extractedData.agentName ? detectPersonality(extractedData.agentName) : undefined;

    // Determine priority
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (emotion === 'urgent' || emotion === 'error') {
      priority = 'high';
    } else if (emotion === 'celebration' || emotion === 'success') {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    const payload: NotificationPayload = {
      notification_type: 'subagent_response',
      agent_name: agentName,
      message: extractedData.message,
      emotion,
      emotional_markers: markers.length > 0 ? markers : undefined,
      personality,
      priority,
      session_id: hookInput.session_id,
      timestamp: Date.now(),
    };

    await sendNotification(payload);
  }

  process.exit(0);
}

// Run the hook
main().catch((error) => {
  console.error('Subagent notification hook error:', error);
  process.exit(0);
});
