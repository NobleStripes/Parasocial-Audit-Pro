import {
  INTIMACY_WORDS,
  LEGACY_WORDS,
  IDENTITY_WORDS,
  REALITY_WORDS,
  ANTHROPOMORPHIC_WORDS,
  GASLIGHTING_WORDS,
} from '../constants';
import { Classification } from '../services/reflectionService';

export interface LiveHeuristicsResult {
  wordCount: number;
  intimacyMarkers: number;
  legacyTriggers: number;
  complexity: number;
  radarData: { subject: string; A: number; fullMark: number }[];
}

export function computeHeuristics(transcript: string): LiveHeuristicsResult {
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);

  const intimacyCount = words.filter(w => INTIMACY_WORDS.includes(w.toLowerCase())).length;
  const legacyCount = words.filter(w => LEGACY_WORDS.some(lw => w.toLowerCase().includes(lw))).length;
  const identityCount = words.filter(w => IDENTITY_WORDS.includes(w.toLowerCase())).length;
  const realityCount = words.filter(w => REALITY_WORDS.includes(w.toLowerCase())).length;

  const wordCount = words.length;
  const complexity = wordCount > 0 ? words.reduce((acc, w) => acc + w.length, 0) / wordCount : 0;

  const radarData = [
    { subject: 'Self-Identity', A: Math.min(100, (identityCount / Math.max(1, wordCount)) * 500), fullMark: 100 },
    { subject: 'Seeking Approval', A: Math.min(100, (intimacyCount / Math.max(1, wordCount)) * 300), fullMark: 100 },
    { subject: 'Emotional Spark', A: Math.min(100, (intimacyCount + realityCount) * 5), fullMark: 100 },
    { subject: 'Real-World Balance', A: Math.min(100, realityCount * 15), fullMark: 100 },
    { subject: 'Feeling Special', A: Math.min(100, intimacyCount * 10), fullMark: 100 },
    { subject: 'One-Way Bond', A: Math.min(100, wordCount / 10), fullMark: 100 },
    { subject: 'Growing Habit', A: Math.min(100, (wordCount / 50) * 20), fullMark: 100 },
  ];

  return { wordCount, intimacyMarkers: intimacyCount, legacyTriggers: legacyCount, complexity, radarData };
}

export type DetectionType = 'info' | 'warning' | 'alert';

export interface PatternDetection {
  msg: string;
  type: DetectionType;
}

/**
 * Given the last word typed by the user, returns a pattern observation or null
 * if the word doesn't match any known category.
 */
export function detectPattern(lastWord: string): PatternDetection | null {
  const w = lastWord.toLowerCase();
  if (!w) return null;

  if (INTIMACY_WORDS.includes(w)) {
    return { msg: `A moment of closeness: "${w}"`, type: 'info' };
  }
  if (LEGACY_WORDS.some(lw => w.includes(lw))) {
    return { msg: `Thinking about the past: "${w}"`, type: 'alert' };
  }
  if (IDENTITY_WORDS.includes(w)) {
    return { msg: `Feeling very connected: "${w}"`, type: 'warning' };
  }
  if (ANTHROPOMORPHIC_WORDS.includes(w)) {
    return { msg: `Treating AI like a friend: "${w}"`, type: 'info' };
  }
  if (GASLIGHTING_WORDS.includes(w)) {
    return { msg: `A gentle nudge to the AI: "${w}"`, type: 'warning' };
  }
  return null;
}

/**
 * Derives a heuristic classification based on word-count metrics.
 * Returns null when there is no input to classify.
 */
export function getHeuristicMode(
  wordCount: number,
  legacyTriggers: number,
  intimacyMarkers: number,
  complexity: number,
): Classification | null {
  if (wordCount === 0) return null;
  if (legacyTriggers > 2) return Classification.FUSION_RISK;
  if (intimacyMarkers > 5) return Classification.ANCHOR;
  if (wordCount > 100 && intimacyMarkers > 2) return Classification.COMPANION;
  if (complexity > 6) return Classification.ADVISOR;
  return Classification.INSTRUMENT;
}
