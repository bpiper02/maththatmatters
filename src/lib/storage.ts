import type { Attempt, DrillConfig, SessionRecord } from '../types';

const HISTORY_KEY = 'mtm:history:v1';
const CONFIG_KEY = 'mtm:drill-config:v1';

export function loadSessions(): SessionRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(session: SessionRecord): SessionRecord[] {
  const current = loadSessions();
  const next = [...current, session].slice(-200);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function allAttempts(sessions: SessionRecord[]): Attempt[] {
  return sessions.flatMap((session) => session.attempts);
}

export function saveDrillConfig(config: DrillConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadDrillConfig(fallback: DrillConfig): DrillConfig {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONFIG_KEY) ?? 'null');
    return parsed && typeof parsed === 'object' ? parsed as DrillConfig : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}
