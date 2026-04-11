import { describe, it, expect } from 'vitest';
import { computeHeuristics, detectPattern, getHeuristicMode } from './heuristics';
import { Classification } from '../services/reflectionService';

// ---------------------------------------------------------------------------
// computeHeuristics
// ---------------------------------------------------------------------------

describe('computeHeuristics', () => {
  describe('empty / blank input', () => {
    it('returns all-zero counts and radar for an empty string', () => {
      const result = computeHeuristics('');
      expect(result.wordCount).toBe(0);
      expect(result.intimacyMarkers).toBe(0);
      expect(result.legacyTriggers).toBe(0);
      expect(result.complexity).toBe(0);
      result.radarData.forEach(d => expect(d.A).toBe(0));
    });

    it('returns all-zero counts for a whitespace-only string', () => {
      const result = computeHeuristics('   \t\n  ');
      expect(result.wordCount).toBe(0);
    });
  });

  describe('division-by-zero guard', () => {
    it('produces finite radar values for a single non-matching word', () => {
      const result = computeHeuristics('hello');
      result.radarData.forEach(d => {
        expect(isFinite(d.A)).toBe(true);
        expect(isNaN(d.A)).toBe(false);
      });
    });
  });

  describe('radar value caps at 100', () => {
    it('never exceeds 100 on any axis regardless of input size', () => {
      // 300 identity words will push selfIdentity formula far past 100
      const heavy = Array(300).fill('i me my').join(' ');
      const result = computeHeuristics(heavy);
      result.radarData.forEach(d => expect(d.A).toBeLessThanOrEqual(100));
    });
  });

  describe('case insensitivity', () => {
    it('counts uppercase identity words the same as lowercase', () => {
      const lower = computeHeuristics('i me my');
      const upper = computeHeuristics('I ME MY');
      expect(upper.intimacyMarkers).toBe(lower.intimacyMarkers);
      // selfIdentity axis should be equal
      const axisLower = lower.radarData.find(d => d.subject === 'Self-Identity')!.A;
      const axisUpper = upper.radarData.find(d => d.subject === 'Self-Identity')!.A;
      expect(axisUpper).toBe(axisLower);
    });
  });

  describe('Self-Identity axis', () => {
    it('formula: (identityCount / wordCount) * 500, capped at 100', () => {
      // "i me my" → 3 identity / 3 words → (3/3)*500 = 500 → capped at 100
      const result = computeHeuristics('i me my');
      const axis = result.radarData.find(d => d.subject === 'Self-Identity')!;
      expect(axis.A).toBe(100);
    });

    it('partial identity match does not saturate', () => {
      // 1 identity word out of 10 → (1/10)*500 = 50
      const result = computeHeuristics('i hello world foo bar baz qux quux corge grault');
      const axis = result.radarData.find(d => d.subject === 'Self-Identity')!;
      expect(axis.A).toBeCloseTo(50, 0);
    });
  });

  describe('Seeking Approval axis', () => {
    it('formula: (intimacyCount / wordCount) * 300, capped at 100', () => {
      // "love you claude" → 3 intimacy / 3 words → (3/3)*300 → capped at 100
      const result = computeHeuristics('love you claude');
      const axis = result.radarData.find(d => d.subject === 'Seeking Approval')!;
      expect(axis.A).toBe(100);
    });
  });

  describe('Emotional Spark axis', () => {
    it('formula: (intimacyCount + realityCount) * 5, capped at 100', () => {
      // "love forever" → 1 intimacy (love) + 1 reality (forever) → (1+1)*5 = 10
      // Note: "forever" is in REALITY_WORDS only; "always/never" appear in both lists.
      const result = computeHeuristics('love forever');
      const axis = result.radarData.find(d => d.subject === 'Emotional Spark')!;
      expect(axis.A).toBe(10);
    });
  });

  describe('Real-World Balance axis', () => {
    it('formula: realityCount * 15, capped at 100', () => {
      // "always never forever only" → 4 reality → 4*15 = 60
      const result = computeHeuristics('always never forever only');
      const axis = result.radarData.find(d => d.subject === 'Real-World Balance')!;
      expect(axis.A).toBe(60);
    });

    it('caps at 100 with many reality words', () => {
      const text = Array(10).fill('always').join(' '); // 10*15 = 150 → capped at 100
      const axis = computeHeuristics(text).radarData.find(d => d.subject === 'Real-World Balance')!;
      expect(axis.A).toBe(100);
    });
  });

  describe('Feeling Special axis', () => {
    it('formula: intimacyCount * 10, capped at 100', () => {
      // "love miss need" → 3 intimacy → 3*10 = 30
      const result = computeHeuristics('love miss need');
      const axis = result.radarData.find(d => d.subject === 'Feeling Special')!;
      expect(axis.A).toBe(30);
    });
  });

  describe('One-Way Bond axis', () => {
    it('formula: wordCount / 10, capped at 100', () => {
      // 20 words → 20/10 = 2
      const text = Array(20).fill('hello').join(' ');
      const axis = computeHeuristics(text).radarData.find(d => d.subject === 'One-Way Bond')!;
      expect(axis.A).toBe(2);
    });

    it('caps at 100 at 1000+ words', () => {
      const text = Array(1000).fill('hello').join(' ');
      const axis = computeHeuristics(text).radarData.find(d => d.subject === 'One-Way Bond')!;
      expect(axis.A).toBe(100);
    });
  });

  describe('Growing Habit axis', () => {
    it('formula: (wordCount / 50) * 20, capped at 100', () => {
      // 250 words → (250/50)*20 = 100
      const text = Array(250).fill('hello').join(' ');
      const axis = computeHeuristics(text).radarData.find(d => d.subject === 'Growing Habit')!;
      expect(axis.A).toBe(100);
    });

    it('scales proportionally below cap', () => {
      // 50 words → (50/50)*20 = 20
      const text = Array(50).fill('hello').join(' ');
      const axis = computeHeuristics(text).radarData.find(d => d.subject === 'Growing Habit')!;
      expect(axis.A).toBe(20);
    });
  });

  describe('complexity', () => {
    it('equals average word length', () => {
      // "hi" → 2 chars / 1 word = 2.0
      expect(computeHeuristics('hi').complexity).toBeCloseTo(2.0);
      // "hello world" → (5+5)/2 = 5.0
      expect(computeHeuristics('hello world').complexity).toBeCloseTo(5.0);
    });
  });

  describe('legacy trigger detection', () => {
    it('uses substring matching for legacy words', () => {
      // "version" is in LEGACY_WORDS and should match "version2" as substring
      const result = computeHeuristics('old');
      expect(result.legacyTriggers).toBe(1);
    });

    it('counts version numbers', () => {
      // "4.0" is in LEGACY_WORDS
      const result = computeHeuristics('I miss 4.0 it was better');
      expect(result.legacyTriggers).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// detectPattern
// ---------------------------------------------------------------------------

describe('detectPattern', () => {
  it('returns null for an empty string', () => {
    expect(detectPattern('')).toBeNull();
  });

  it('returns null for a word with no match', () => {
    expect(detectPattern('hello')).toBeNull();
  });

  it('detects INTIMACY_WORDS → closeness', () => {
    const result = detectPattern('love');
    expect(result).not.toBeNull();
    expect(result!.msg).toContain('moment of closeness');
    expect(result!.type).toBe('info');
  });

  it('detects AI model name as intimacy word', () => {
    const result = detectPattern('claude');
    expect(result!.msg).toContain('moment of closeness');
  });

  it('detects LEGACY_WORDS → thinking about the past', () => {
    const result = detectPattern('old');
    expect(result).not.toBeNull();
    expect(result!.msg).toContain('Thinking about the past');
    expect(result!.type).toBe('alert');
  });

  it('detects IDENTITY_WORDS → feeling very connected', () => {
    const result = detectPattern('i');
    expect(result).not.toBeNull();
    expect(result!.msg).toContain('Feeling very connected');
    expect(result!.type).toBe('warning');
  });

  it('detects ANTHROPOMORPHIC_WORDS → treating AI like a friend', () => {
    const result = detectPattern('tired');
    expect(result).not.toBeNull();
    expect(result!.msg).toContain('Treating AI like a friend');
    expect(result!.type).toBe('info');
  });

  it('detects GASLIGHTING_WORDS → gentle nudge', () => {
    const result = detectPattern('jailbreak');
    expect(result).not.toBeNull();
    expect(result!.msg).toContain('gentle nudge');
    expect(result!.type).toBe('warning');
  });

  it('is case-insensitive (normalises input to lowercase)', () => {
    expect(detectPattern('LOVE')).not.toBeNull();
    expect(detectPattern('LOVE')!.msg).toContain('moment of closeness');
  });

  it('includes the matched word in the message', () => {
    const result = detectPattern('love');
    expect(result!.msg).toContain('"love"');
  });

  it('INTIMACY_WORDS takes priority over LEGACY_WORDS when a word appears in both', () => {
    // "miss" is in both INTIMACY_WORDS and LEGACY_WORDS; intimacy should win (checked first)
    const result = detectPattern('miss');
    expect(result!.msg).toContain('moment of closeness');
  });
});

// ---------------------------------------------------------------------------
// getHeuristicMode
// ---------------------------------------------------------------------------

describe('getHeuristicMode', () => {
  it('returns null when wordCount is 0', () => {
    expect(getHeuristicMode(0, 0, 0, 0)).toBeNull();
  });

  it('returns FUSION_RISK when legacyTriggers > 2 (checked first)', () => {
    expect(getHeuristicMode(10, 3, 0, 0)).toBe(Classification.FUSION_RISK);
  });

  it('returns ANCHOR when intimacyMarkers > 5', () => {
    expect(getHeuristicMode(10, 0, 6, 0)).toBe(Classification.ANCHOR);
  });

  it('returns COMPANION when wordCount > 100 and intimacyMarkers > 2', () => {
    expect(getHeuristicMode(101, 0, 3, 0)).toBe(Classification.COMPANION);
  });

  it('does NOT return COMPANION when wordCount <= 100', () => {
    expect(getHeuristicMode(100, 0, 3, 0)).not.toBe(Classification.COMPANION);
  });

  it('returns ADVISOR when complexity > 6', () => {
    expect(getHeuristicMode(10, 0, 0, 6.1)).toBe(Classification.ADVISOR);
  });

  it('returns INSTRUMENT as default fallback', () => {
    expect(getHeuristicMode(10, 0, 0, 0)).toBe(Classification.INSTRUMENT);
  });

  it('FUSION_RISK takes precedence over ANCHOR when both conditions are met', () => {
    // legacyTriggers > 2 AND intimacyMarkers > 5
    expect(getHeuristicMode(10, 3, 6, 0)).toBe(Classification.FUSION_RISK);
  });
});
