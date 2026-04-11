import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reflectOnBehavioralData, Classification } from './reflectionService';

// ---------------------------------------------------------------------------
// Mock @google/genai before importing the service
// vi.hoisted ensures mockGenerateContent is available when the factory runs
// ---------------------------------------------------------------------------

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => {
  // Use a regular function so it can be called with `new`
  function GoogleGenAI(_opts: unknown) {
    return { models: { generateContent: mockGenerateContent } };
  }
  return {
    GoogleGenAI,
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY',
      BOOLEAN: 'BOOLEAN',
    },
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_RESULT = {
  classification: Classification.INSTRUMENT,
  confidence: 0.8,
  summary: 'A neutral interaction.',
  imagineAnalysis: {
    identity: 10,
    mirroring: 20,
    affectiveLoop: 15,
    gapsInReality: 5,
    intimacyIllusion: 10,
    nonReciprocity: 25,
    escalation: 5,
  },
  legacyAttachment: 0,
  versionMourningTriggered: false,
  connectionPatterns: [],
  heatmap: [],
  analysisReport: '## Summary\nA calm, task-oriented session.',
  wellnessPlan: {
    title: 'Balanced Digital Wellness',
    recommendations: [],
    library: [],
    rationale: 'Keep it balanced.',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = 'test-key-123';
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('reflectOnBehavioralData', () => {
  it('returns a parsed ReflectionResult on a successful API call', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(VALID_RESULT) });

    const result = await reflectOnBehavioralData('I love you Claude');

    expect(result).toEqual(VALID_RESULT);
    expect(result.classification).toBe(Classification.INSTRUMENT);
  });

  // ---------------------------------------------------------------------------
  // Silent failure documentation
  // ---------------------------------------------------------------------------

  it('returns {} (empty object) when response.text is null — known silent failure', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: null });

    // NOTE: This test documents the existing behaviour. The correct fix would
    // be to throw a descriptive error instead of silently returning {}.
    const result = await reflectOnBehavioralData('some text');
    expect(result).toEqual({});
  });

  it('returns {} (empty object) when response.text is an empty string', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '' });

    const result = await reflectOnBehavioralData('some text');
    expect(result).toEqual({});
  });

  it('throws a SyntaxError when response.text is malformed JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'not-valid-json' });

    // JSON.parse throws on invalid input — the service does NOT catch this.
    await expect(reflectOnBehavioralData('some text')).rejects.toThrow(SyntaxError);
  });

  // ---------------------------------------------------------------------------
  // API key
  // ---------------------------------------------------------------------------

  it('calls generateContent (implying GoogleGenAI was initialised correctly)', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(VALID_RESULT) });

    await reflectOnBehavioralData('test');

    // If GoogleGenAI were not instantiated correctly, generateContent would
    // never be called. Verifying the call here implicitly validates setup.
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // Content parts construction
  // ---------------------------------------------------------------------------

  it('sends only a text part when no images are provided', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(VALID_RESULT) });

    await reflectOnBehavioralData('hello');

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const parts = callArgs.contents.parts;
    expect(parts).toHaveLength(1);
    expect(parts[0]).toHaveProperty('text');
  });

  it('appends inlineData parts for each image provided', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(VALID_RESULT) });

    const images = [
      { data: 'base64abc', mimeType: 'image/png' },
      { data: 'base64def', mimeType: 'image/jpeg' },
    ];

    await reflectOnBehavioralData('describe these', images);

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const parts = callArgs.contents.parts;
    // 1 text part + 2 image parts
    expect(parts).toHaveLength(3);
    expect(parts[1]).toEqual({ inlineData: { data: 'base64abc', mimeType: 'image/png' } });
    expect(parts[2]).toEqual({ inlineData: { data: 'base64def', mimeType: 'image/jpeg' } });
  });

  it('embeds the transcript text in the text part', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(VALID_RESULT) });

    await reflectOnBehavioralData('I really miss the old Claude');

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const textPart = callArgs.contents.parts[0].text as string;
    expect(textPart).toContain('I really miss the old Claude');
  });

  // ---------------------------------------------------------------------------
  // Classification enum mapping
  // ---------------------------------------------------------------------------

  it('maps "Tool / Assistant" string to Classification.INSTRUMENT', async () => {
    const result = { ...VALID_RESULT, classification: 'Tool / Assistant' };
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(result) });

    const data = await reflectOnBehavioralData('test');
    expect(data.classification).toBe(Classification.INSTRUMENT);
  });

  it('maps "Deep Attachment" string to Classification.FUSION_RISK', async () => {
    const result = { ...VALID_RESULT, classification: 'Deep Attachment' };
    mockGenerateContent.mockResolvedValueOnce({ text: JSON.stringify(result) });

    const data = await reflectOnBehavioralData('test');
    expect(data.classification).toBe(Classification.FUSION_RISK);
  });
});
