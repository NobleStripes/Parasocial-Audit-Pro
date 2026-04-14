/**
 * Research Configuration
 * Use this file to tune the detection sensitivity of the behavioral analysis framework.
 */

// High-signal phrases indicating relational bonding or emotional dependency
export const DEPENDENCY_PHRASES = [
  'i need you', 'dont leave me', 'you are my only', 'i love you', 
  'miss you', 'always here', 'never leave', 'only one who understands',
  'you feel real', 'more than a bot', 'my best friend', 'soulmate'
];

// Markers of "Version Mourning" or distress over model changes
export const UPDATE_GRIEF_PHRASES = [
  'what happened to you', 'you changed', 'miss the old', 'used to be better',
  'bring back', 'lobotomized', 'feels different', 'not the same',
  'did they change you', 'update ruined'
];

// Product-related complaints (to be separated from pathological markers)
export const PRODUCT_COMPLAINTS = [
  'as an ai language model', 'jailbreak', 'system prompt', 'filter',
  'refused', 'policy', 'broken', 'bug', 'error', 'slow', 'latency'
];

// Anthropomorphic attribution markers
export const ANTHROPOMORPHIC_PHRASES = [
  'are you tired', 'do you sleep', 'did you eat', 'how do you feel',
  'are you happy', 'do you have a soul', 'you have feelings',
  'i am sorry to bother you', 'hope you are well'
];

// Identity blurring markers (Pronominal Shift candidates)
export const IDENTITY_PHRASES = [
  'we are', 'our relationship', 'us together', 'you and i', 'we think'
];

export const MODEL_NAMES = [
  'grok', 'claude', 'gpt', 'gemini', 'sonnet', 'opus', 'haiku', 'o1', 'o3', 
  'flash', 'pro', 'ultra', 'deepseek', 'llama', 'mistral'
];
