import type { AppearanceConfig, Attempt, DrillConfig, SessionRecord } from '../types';

const HISTORY_KEY = 'mtm:history:v1';
const CONFIG_KEY = 'mtm:drill-config:v1';
const APPEARANCE_KEY = 'mtm:appearance:v1';

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  appLabel: 'Math That Matters',
  desktopColor: '#008080',
  accentColor: '#000080',
  windowWidth: 900,
  fontSize: 13,
  density: 'compact',
  drillAlign: 'center',
  showQuestionMeta: true,
  showLiveAccuracy: true,
  showStatusBar: true,
};

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

export function saveAppearance(config: AppearanceConfig): void {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(config));
}

export function loadAppearance(): AppearanceConfig {
  try {
    const parsed = JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? 'null');
    return parsed && typeof parsed === 'object'
      ? { ...DEFAULT_APPEARANCE, ...parsed }
      : structuredClone(DEFAULT_APPEARANCE);
  } catch {
    return structuredClone(DEFAULT_APPEARANCE);
  }
}
