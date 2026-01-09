// $PAI_DIR/hooks/lib/observability.ts
// Shared observability utilities for PAI hooks

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function getSourceApp(): string {
  return process.env.PAI_SOURCE_APP || process.env.DA || 'PAI';
}

export async function sendEventToObservability(event: Record<string, any>): Promise<void> {
  // Optional: Send events to observability dashboard
  // This is a stub implementation - can be extended to send to external services

  // For now, just log to stderr if in debug mode
  if (process.env.PAI_DEBUG === 'true') {
    console.error('[Observability]', JSON.stringify(event, null, 2));
  }

  // Future: Send to logging service, analytics, etc.
  // Example: await fetch('https://observability.example.com/events', { method: 'POST', body: JSON.stringify(event) });
}
