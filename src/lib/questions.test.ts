import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, generateQuestion, isCorrect, validateConfig } from './questions';

describe('question engine', () => {
  it('respects multiplication ranges', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateQuestion('multiplication', DEFAULT_CONFIG);
      const [a, b] = q.prompt.split(' × ').map(Number);
      expect(a).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(12);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(100);
    }
  });

  it('always emits exact whole-number division', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateQuestion('division', DEFAULT_CONFIG);
      expect(Number.isInteger(q.answer)).toBe(true);
    }
  });

  it('accepts reasonable rounded fraction answers', () => {
    const q = { ...generateQuestion('fractions', DEFAULT_CONFIG), answer: 33.3333, tolerance: 0.05 };
    expect(isCorrect(q, 33.33)).toBe(true);
  });

  it('rejects impossible non-negative subtraction settings', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.subtraction.left = { min: 1, max: 3 };
    config.subtraction.right = { min: 10, max: 20 };
    expect(validateConfig(config).some((error) => error.includes('Subtraction'))).toBe(true);
  });

  it('rejects reversed numeric ranges instead of silently swapping them', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.multiplication.left = { min: 12, max: 2 };
    expect(validateConfig(config).some((error) => error.includes('Multiplication left'))).toBe(true);
  });

  it('requires at least one enabled percentage mode', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.percentages.modes = { of: false, findPercent: false, change: false, reverse: false };
    expect(validateConfig(config)).toContain('Enable at least one percentage mode.');
  });

  it('rejects fraction ranges that cannot produce a proper fraction', () => {
    const config = structuredClone(DEFAULT_CONFIG);
    config.fractions.numerator = { min: 9, max: 12 };
    config.fractions.denominator = { min: 2, max: 8 };
    expect(validateConfig(config)).toContain('Fraction ranges cannot produce a proper fraction.');
  });
});
