import type { Attempt, Category, DrillConfig, Question } from '../types';
import { enabledCategories, generateQuestion } from './questions';

export type SkillStat = {
  skill: string;
  attempts: number;
  accuracy: number;
  avgMs: number;
  slowRate: number;
  lastSeen: number;
};

const BASE_SLOW_MS: Record<string, number> = {
  'arithmetic.add': 4000,
  'arithmetic.subtract': 4500,
  'arithmetic.multiply': 5000,
  'arithmetic.divide': 5000,
  'percentage.basic': 5500,
  'percentage.find_percent': 7000,
  'percentage.change': 7500,
  'percentage.reverse': 8500,
  'fraction.to_percent': 6000,
  'fraction.to_decimal': 6000,
  'fraction.from_percent': 7000,
  'ratio.scale': 6000,
  'business.runway': 6500,
  'business.margin': 7500,
  'ev.basic': 9000,
  'probability.basic': 8000,
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function slowThreshold(skill: string, history: Attempt[]): number {
  const base = BASE_SLOW_MS[skill] ?? 7000;
  const recent = history
    .filter((attempt) => attempt.correct && attempt.question.skill === skill)
    .slice(-20)
    .map((attempt) => attempt.ms);
  if (recent.length < 6) return base;
  const personal = median(recent) * 1.6;
  return Math.max(base * 0.65, Math.min(base * 2, personal));
}

export function skillStats(history: Attempt[]): SkillStat[] {
  const grouped = new Map<string, Attempt[]>();
  for (const attempt of history) {
    const bucket = grouped.get(attempt.question.skill) ?? [];
    bucket.push(attempt);
    grouped.set(attempt.question.skill, bucket);
  }
  return [...grouped.entries()].map(([skill, attempts]) => {
    const correct = attempts.filter((attempt) => attempt.correct).length;
    return {
      skill,
      attempts: attempts.length,
      accuracy: correct / attempts.length,
      avgMs: attempts.reduce((sum, attempt) => sum + attempt.ms, 0) / attempts.length,
      slowRate: attempts.filter((attempt) => attempt.slow).length / attempts.length,
      lastSeen: Math.max(...attempts.map((attempt) => attempt.timestamp)),
    };
  });
}

export function questionNeed(question: Question, history: Attempt[]): number {
  const stat = skillStats(history).find((item) => item.skill === question.skill);
  if (!stat) return 3;
  const errorNeed = (1 - stat.accuracy) * 4;
  const slowNeed = stat.slowRate * 2.5;
  const ageDays = (Date.now() - stat.lastSeen) / 86_400_000;
  const staleNeed = Math.min(1.5, ageDays / 7);
  const sampleNeed = stat.attempts < 8 ? 1 : 0;
  return 0.35 + errorNeed + slowNeed + staleNeed + sampleNeed;
}

function weightedPick<T>(items: Array<{ value: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let target = Math.random() * total;
  for (const item of items) {
    target -= item.weight;
    if (target <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

export function pickQuestion(
  config: DrillConfig,
  history: Attempt[],
  previous?: Question,
  mode: 'adaptive' | 'custom' = 'adaptive',
  weakFocus = false,
): Question {
  const categories = enabledCategories(config);
  if (!categories.length) throw new Error('No categories enabled.');

  if (mode === 'custom' && !weakFocus) {
    for (let tries = 0; tries < 12; tries += 1) {
      const category = categories[Math.floor(Math.random() * categories.length)] as Category;
      const question = generateQuestion(category, config);
      if (!previous || question.signature !== previous.signature) return question;
    }
  }

  const candidates: Question[] = [];
  for (let i = 0; i < 18; i += 1) {
    const category = categories[Math.floor(Math.random() * categories.length)] as Category;
    const candidate = generateQuestion(category, config);
    if (!previous || candidate.signature !== previous.signature) candidates.push(candidate);
  }
  if (!candidates.length) return generateQuestion(categories[0], config);

  return weightedPick(
    candidates.map((candidate) => {
      const need = questionNeed(candidate, history);
      return { value: candidate, weight: weakFocus ? need * need : need };
    }),
  );
}
