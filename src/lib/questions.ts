import type { Category, DrillConfig, Question, Range } from '../types';

type Rng = () => number;

const FRIENDLY_PERCENTAGES = [1, 2, 5, 10, 12.5, 15, 20, 25, 30, 33.33, 37.5, 40, 50, 60, 62.5, 66.67, 75, 80, 87.5];
const COMMON_FRACTIONS = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5],
  [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [3, 10], [7, 10], [9, 10],
  [1, 12], [5, 12], [7, 12], [11, 12], [1, 16], [3, 16], [5, 16], [7, 16],
];

export const DEFAULT_CONFIG: DrillConfig = {
  addition: { enabled: true, left: { min: 2, max: 100 }, right: { min: 2, max: 100 } },
  subtraction: { enabled: true, left: { min: 2, max: 100 }, right: { min: 2, max: 100 }, allowNegative: false },
  multiplication: { enabled: true, left: { min: 2, max: 12 }, right: { min: 2, max: 100 } },
  division: { enabled: true, divisor: { min: 2, max: 12 }, quotient: { min: 2, max: 100 } },
  percentages: {
    enabled: true,
    percent: { min: 5, max: 75 },
    base: { min: 20, max: 500 },
    cleanAnswers: true,
    modes: { of: true, findPercent: true, change: true, reverse: true },
  },
  fractions: {
    enabled: true,
    numerator: { min: 1, max: 12 },
    denominator: { min: 2, max: 16 },
    properOnly: true,
    reducedOnly: true,
    commonOnly: true,
    modes: { toPercent: true, toDecimal: true, percentToFraction: true },
  },
  ratios: { enabled: true, left: { min: 1, max: 12 }, right: { min: 1, max: 12 }, scale: { min: 2, max: 12 } },
  applied: { enabled: true },
};

function normalize(range: Range): Range {
  return { min: Math.ceil(Math.min(range.min, range.max)), max: Math.floor(Math.max(range.min, range.max)) };
}

function int(range: Range, rng: Rng): number {
  const { min, max } = normalize(range);
  return Math.floor(rng() * (max - min + 1)) + min;
}

function choose<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function rounded(value: number, places = 4): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function id(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function q(base: Omit<Question, 'id' | 'signature'>): Question {
  return { ...base, id: id(), signature: base.prompt.replace(/\s+/g, ' ').trim() };
}

function validRange(range: Range): boolean {
  return Number.isFinite(range.min) && Number.isFinite(range.max) && range.min <= range.max;
}

export function validateConfig(config: DrillConfig): string[] {
  const errors: string[] = [];
  const named: Array<[string, Range]> = [
    ['Addition left', config.addition.left], ['Addition right', config.addition.right],
    ['Subtraction left', config.subtraction.left], ['Subtraction right', config.subtraction.right],
    ['Multiplication left', config.multiplication.left], ['Multiplication right', config.multiplication.right],
    ['Division divisor', config.division.divisor], ['Division quotient', config.division.quotient],
    ['Percentage', config.percentages.percent], ['Percentage base', config.percentages.base],
    ['Fraction numerator', config.fractions.numerator], ['Fraction denominator', config.fractions.denominator],
    ['Ratio left', config.ratios.left], ['Ratio right', config.ratios.right], ['Ratio scale', config.ratios.scale],
  ];
  for (const [name, range] of named) if (!validRange(range)) errors.push(name + ' range is invalid.');
  if (config.division.divisor.min <= 0) errors.push('Division divisor must stay above 0.');
  if (config.fractions.denominator.min <= 0) errors.push('Fraction denominator must stay above 0.');
  if (config.percentages.enabled && !Object.values(config.percentages.modes).some(Boolean)) errors.push('Enable at least one percentage mode.');
  if (config.fractions.enabled && !Object.values(config.fractions.modes).some(Boolean)) errors.push('Enable at least one fraction mode.');
  if (config.fractions.enabled && config.fractions.properOnly && config.fractions.numerator.min >= config.fractions.denominator.max) {
    errors.push('Fraction ranges cannot produce a proper fraction.');
  }
  if (!config.subtraction.allowNegative && config.subtraction.left.max < config.subtraction.right.min) {
    errors.push('Subtraction ranges cannot produce a non-negative answer.');
  }
  return errors;
}

function arithmetic(category: Category, config: DrillConfig, rng: Rng): Question {
  if (category === 'addition') {
    const a = int(config.addition.left, rng), b = int(config.addition.right, rng);
    return q({ category, skill: 'arithmetic.add', context: 'pure', prompt: a + ' + ' + b, answer: a + b, answerKind: 'number', tolerance: 0 });
  }
  if (category === 'subtraction') {
    let a = int(config.subtraction.left, rng), b = int(config.subtraction.right, rng);
    if (!config.subtraction.allowNegative) {
      for (let tries = 0; tries < 50 && a < b; tries += 1) {
        a = int(config.subtraction.left, rng);
        b = int(config.subtraction.right, rng);
      }
      if (a < b) throw new Error('Subtraction ranges cannot produce a non-negative answer.');
    }
    return q({ category, skill: 'arithmetic.subtract', context: 'pure', prompt: a + ' − ' + b, answer: a - b, answerKind: 'number', tolerance: 0 });
  }
  if (category === 'multiplication') {
    const a = int(config.multiplication.left, rng), b = int(config.multiplication.right, rng);
    return q({ category, skill: 'arithmetic.multiply', context: 'pure', prompt: a + ' × ' + b, answer: a * b, answerKind: 'number', tolerance: 0 });
  }
  const divisor = int(config.division.divisor, rng);
  const quotient = int(config.division.quotient, rng);
  return q({ category: 'division', skill: 'arithmetic.divide', context: 'pure', prompt: divisor * quotient + ' ÷ ' + divisor, answer: quotient, answerKind: 'number', tolerance: 0 });
}

function friendlyPercent(config: DrillConfig, rng: Rng): number {
  const low = Math.min(config.percentages.percent.min, config.percentages.percent.max);
  const high = Math.max(config.percentages.percent.min, config.percentages.percent.max);
  const candidates = FRIENDLY_PERCENTAGES.filter((value) => value >= low && value <= high);
  if (config.percentages.cleanAnswers && candidates.length) return choose(candidates, rng);
  return int(config.percentages.percent, rng);
}

function cleanBase(percent: number, range: Range, rng: Rng): number {
  for (let tries = 0; tries < 80; tries += 1) {
    const base = int(range, rng);
    const result = (base * percent) / 100;
    if (Math.abs(result * 10 - Math.round(result * 10)) < 1e-9) return base;
  }
  return int(range, rng);
}

function percentages(config: DrillConfig, rng: Rng): Question {
  const active = Object.entries(config.percentages.modes).filter(([, on]) => on).map(([mode]) => mode);
  const mode = active.length ? choose(active, rng) : 'of';
  const percent = friendlyPercent(config, rng);
  const base = config.percentages.cleanAnswers ? cleanBase(percent, config.percentages.base, rng) : int(config.percentages.base, rng);
  const part = rounded((base * percent) / 100, 2);

  if (mode === 'findPercent') {
    return q({ category: 'percentages', skill: 'percentage.find_percent', context: 'pure', prompt: part + ' is what % of ' + base + '?', answer: percent, answerKind: 'percent', tolerance: 0.02 });
  }
  if (mode === 'change') {
    const end = rounded(base * (1 + percent / 100), 2);
    return q({ category: 'percentages', skill: 'percentage.change', context: 'pure', prompt: base + ' → ' + end + '. Increase %?', answer: percent, answerKind: 'percent', tolerance: 0.02 });
  }
  if (mode === 'reverse') {
    const after = rounded(base * (1 - percent / 100), 2);
    return q({ category: 'percentages', skill: 'percentage.reverse', context: 'pure', prompt: 'After a ' + percent + '% discount: ' + after + '. Original?', answer: base, answerKind: 'number', tolerance: 0.02 });
  }
  return q({ category: 'percentages', skill: 'percentage.basic', context: 'pure', prompt: percent + '% of ' + base, answer: part, answerKind: 'number', tolerance: 0.02 });
}

function allowedFractions(config: DrillConfig): Array<[number, number]> {
  const n = normalize(config.fractions.numerator);
  const d = normalize(config.fractions.denominator);
  return COMMON_FRACTIONS.filter(([a, b]) => a >= n.min && a <= n.max && b >= d.min && b <= d.max && (!config.fractions.properOnly || a < b));
}

function fractions(config: DrillConfig, rng: Rng): Question {
  let numerator: number;
  let denominator: number;
  const common = allowedFractions(config);
  if (config.fractions.commonOnly && common.length) {
    [numerator, denominator] = choose(common, rng);
  } else {
    numerator = int(config.fractions.numerator, rng);
    denominator = int(config.fractions.denominator, rng);
    for (let tries = 0; tries < 80; tries += 1) {
      const proper = !config.fractions.properOnly || numerator < denominator;
      const reduced = !config.fractions.reducedOnly || gcd(numerator, denominator) === 1;
      if (proper && reduced) break;
      numerator = int(config.fractions.numerator, rng);
      denominator = int(config.fractions.denominator, rng);
    }
  }
  const active = Object.entries(config.fractions.modes).filter(([, on]) => on).map(([mode]) => mode);
  const mode = active.length ? choose(active, rng) : 'toPercent';
  const decimal = numerator / denominator;
  const percent = decimal * 100;
  if (mode === 'toDecimal') {
    return q({ category: 'fractions', skill: 'fraction.to_decimal', context: 'pure', prompt: numerator + '/' + denominator + ' as decimal', answer: decimal, answerKind: 'decimal', tolerance: 0.005 });
  }
  if (mode === 'percentToFraction') {
    return q({ category: 'fractions', skill: 'fraction.from_percent', context: 'pure', prompt: rounded(percent, 2) + '% → numerator of simplest fraction? (denominator ' + denominator / gcd(numerator, denominator) + ')', answer: numerator / gcd(numerator, denominator), answerKind: 'number', tolerance: 0 });
  }
  return q({ category: 'fractions', skill: 'fraction.to_percent', context: 'pure', prompt: numerator + '/' + denominator + ' as %', answer: percent, answerKind: 'percent', tolerance: 0.05 });
}

function ratios(config: DrillConfig, rng: Rng): Question {
  const left = int(config.ratios.left, rng);
  const right = int(config.ratios.right, rng);
  const scale = int(config.ratios.scale, rng);
  return q({ category: 'ratios', skill: 'ratio.scale', context: 'pure', prompt: left + ':' + right + ' = ' + left * scale + ': ?', answer: right * scale, answerKind: 'number', tolerance: 0 });
}

function applied(config: DrillConfig, rng: Rng): Question {
  const template = Math.floor(rng() * 5);
  if (template === 0) {
    const percent = friendlyPercent(config, rng);
    const users = cleanBase(percent, config.percentages.base, rng);
    return q({ category: 'applied', skill: 'percentage.basic', context: 'startup', prompt: users + ' visitors, ' + percent + '% sign up. Signups?', answer: rounded(users * percent / 100, 2), answerKind: 'number', tolerance: 0.02 });
  }
  if (template === 1) {
    const burn = choose([25, 40, 50, 60, 75, 100, 120], rng);
    const months = int({ min: 3, max: 18 }, rng);
    return q({ category: 'applied', skill: 'business.runway', context: 'startup', prompt: '$' + burn * months + 'k cash, $' + burn + 'k monthly burn. Runway months?', answer: months, answerKind: 'number', tolerance: 0 });
  }
  if (template === 2) {
    const price = choose([50, 80, 100, 120, 200], rng);
    const margin = choose([20, 25, 40, 50, 60, 75], rng);
    const cost = price * (1 - margin / 100);
    return q({ category: 'applied', skill: 'business.margin', context: 'finance', prompt: 'Sell $' + price + ', cost $' + rounded(cost, 2) + '. Gross margin %?', answer: margin, answerKind: 'percent', tolerance: 0.02 });
  }
  if (template === 3) {
    const p = choose([20, 25, 30, 40, 50, 60, 75], rng);
    const win = choose([100, 150, 200, 300, 400], rng);
    const loss = choose([20, 40, 50, 75, 100], rng);
    const ev = p / 100 * win - (1 - p / 100) * loss;
    return q({ category: 'applied', skill: 'ev.basic', context: 'poker', prompt: p + '% win $' + win + '; otherwise lose $' + loss + '. EV?', answer: ev, answerKind: 'number', tolerance: 0.02 });
  }
  const favorable = int({ min: 1, max: 10 }, rng);
  const total = int({ min: Math.max(favorable, 4), max: 20 }, rng);
  return q({ category: 'applied', skill: 'probability.basic', context: 'poker', prompt: favorable + ' favorable outcomes out of ' + total + '. Probability %?', answer: favorable / total * 100, answerKind: 'percent', tolerance: 0.1 });
}

export function enabledCategories(config: DrillConfig): Category[] {
  return (['addition', 'subtraction', 'multiplication', 'division', 'percentages', 'fractions', 'ratios', 'applied'] as Category[])
    .filter((category) => config[category].enabled);
}

export function generateQuestion(category: Category, config: DrillConfig = DEFAULT_CONFIG, rng: Rng = Math.random): Question {
  if (category === 'addition' || category === 'subtraction' || category === 'multiplication' || category === 'division') return arithmetic(category, config, rng);
  if (category === 'percentages') return percentages(config, rng);
  if (category === 'fractions') return fractions(config, rng);
  if (category === 'ratios') return ratios(config, rng);
  return applied(config, rng);
}

export function parseAnswer(raw: string): number | null {
  const cleaned = raw.trim().replace(/[,$%]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function isCorrect(question: Question, input: number): boolean {
  const tolerance = Math.max(question.tolerance, Math.abs(question.answer) * 0.0005);
  return Math.abs(input - question.answer) <= tolerance;
}
