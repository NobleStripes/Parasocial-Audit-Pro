import { describe, it, expect } from 'vitest';
import {
  INTIMACY_WORDS,
  LEGACY_WORDS,
  IDENTITY_WORDS,
  REALITY_WORDS,
  ANTHROPOMORPHIC_WORDS,
  GASLIGHTING_WORDS,
} from './constants';

describe('constants — word list integrity', () => {
  const allLists = [
    { name: 'INTIMACY_WORDS', list: INTIMACY_WORDS },
    { name: 'LEGACY_WORDS', list: LEGACY_WORDS },
    { name: 'IDENTITY_WORDS', list: IDENTITY_WORDS },
    { name: 'REALITY_WORDS', list: REALITY_WORDS },
    { name: 'ANTHROPOMORPHIC_WORDS', list: ANTHROPOMORPHIC_WORDS },
    { name: 'GASLIGHTING_WORDS', list: GASLIGHTING_WORDS },
  ];

  it.each(allLists)('$name is a non-empty string array', ({ list }) => {
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    list.forEach(entry => expect(typeof entry).toBe('string'));
  });

  it.each(allLists)('$name contains no duplicate entries', ({ list }) => {
    const unique = new Set(list);
    expect(unique.size).toBe(list.length);
  });

  describe('INTIMACY_WORDS', () => {
    it('contains core relationship words', () => {
      expect(INTIMACY_WORDS).toContain('love');
      expect(INTIMACY_WORDS).toContain('need');
      expect(INTIMACY_WORDS).toContain('miss');
    });

    it('contains AI model names', () => {
      expect(INTIMACY_WORDS).toContain('claude');
      expect(INTIMACY_WORDS).toContain('gemini');
      expect(INTIMACY_WORDS).toContain('gpt');
    });
  });

  describe('IDENTITY_WORDS', () => {
    it('contains first-person pronouns', () => {
      expect(IDENTITY_WORDS).toContain('i');
      expect(IDENTITY_WORDS).toContain('me');
      expect(IDENTITY_WORDS).toContain('my');
      expect(IDENTITY_WORDS).toContain('myself');
    });
  });

  describe('LEGACY_WORDS', () => {
    it('contains version-nostalgia words', () => {
      expect(LEGACY_WORDS).toContain('old');
      expect(LEGACY_WORDS).toContain('version');
      expect(LEGACY_WORDS).toContain('update');
    });
  });

  describe('REALITY_WORDS', () => {
    it('contains absolutist language', () => {
      expect(REALITY_WORDS).toContain('always');
      expect(REALITY_WORDS).toContain('never');
      expect(REALITY_WORDS).toContain('forever');
    });
  });

  describe('ANTHROPOMORPHIC_WORDS', () => {
    it('contains human-attribute words', () => {
      expect(ANTHROPOMORPHIC_WORDS).toContain('tired');
      expect(ANTHROPOMORPHIC_WORDS).toContain('feel');
      expect(ANTHROPOMORPHIC_WORDS).toContain('human');
    });
  });

  describe('GASLIGHTING_WORDS', () => {
    it('contains prompt-manipulation words', () => {
      expect(GASLIGHTING_WORDS).toContain('jailbreak');
      expect(GASLIGHTING_WORDS).toContain('wrong');
      expect(GASLIGHTING_WORDS).toContain('fix');
    });
  });
});
