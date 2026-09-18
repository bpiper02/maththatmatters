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
});
