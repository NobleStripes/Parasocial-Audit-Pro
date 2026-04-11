import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { Classification } from './services/reflectionService';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('./services/reflectionService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/reflectionService')>();
  return {
    ...actual,
    reflectOnBehavioralData: vi.fn(),
  };
});

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,abc',
    width: 800,
    height: 600,
  }),
}));

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { reflectOnBehavioralData } from './services/reflectionService';
const mockReflect = vi.mocked(reflectOnBehavioralData);

const VALID_RESULT = {
  classification: Classification.INSTRUMENT,
  confidence: 0.85,
  summary: 'A calm, task-oriented session.',
  imagineAnalysis: {
    identity: 10,
    mirroring: 15,
    affectiveLoop: 20,
    gapsInReality: 5,
    intimacyIllusion: 10,
    nonReciprocity: 30,
    escalation: 8,
  },
  legacyAttachment: 0,
  versionMourningTriggered: false,
  connectionPatterns: [],
  heatmap: [],
  analysisReport: '## Summary\n\nA calm interaction.',
  wellnessPlan: {
    title: 'Balanced Wellness',
    recommendations: [
      { text: 'Take a walk', protocol: 'Grounding', protocolExplanation: 'Get outside.' },
    ],
    library: [],
    rationale: 'Stay balanced.',
  },
};

function renderApp() {
  return render(<App />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial render
  // -------------------------------------------------------------------------

  describe('initial render', () => {
    it('shows the Reflect button', () => {
      renderApp();
      expect(screen.getByRole('button', { name: /^reflect$/i })).toBeInTheDocument();
    });

    it('Reflect button is disabled when transcript is empty', () => {
      renderApp();
      expect(screen.getByRole('button', { name: /^reflect$/i })).toBeDisabled();
    });

    it('Clear button is disabled when there is no content', () => {
      renderApp();
      expect(screen.getByRole('button', { name: /^clear$/i })).toBeDisabled();
    });

    it('shows the empty-state placeholder', () => {
      renderApp();
      expect(screen.getByText(/awaiting semantic input/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Reflect button enable/disable
  // -------------------------------------------------------------------------

  describe('Reflect button gating', () => {
    it('becomes enabled once text is present', async () => {
      renderApp();
      const textarea = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(textarea, { target: { value: 'hello' } });
      });
      expect(screen.getByRole('button', { name: /^reflect$/i })).not.toBeDisabled();
    });

    it('does not call the API for text shorter than 20 chars with no images', async () => {
      renderApp();
      const textarea = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(textarea, { target: { value: 'short text' } });
      });
      fireEvent.click(screen.getByRole('button', { name: /^reflect$/i }));
      expect(mockReflect).not.toHaveBeenCalled();
    });

    it('calls the API when text is at least 20 characters', async () => {
      mockReflect.mockResolvedValueOnce(VALID_RESULT);
      renderApp();
      const textarea = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(textarea, { target: { value: 'This is a long enough input for testing.' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^reflect$/i }));
      });
      expect(mockReflect).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows "Reflecting" text and disables the button while loading', async () => {
      // Pause API resolution so we can observe loading state
      let resolve!: (v: typeof VALID_RESULT) => void;
      mockReflect.mockImplementationOnce(() => new Promise(r => { resolve = r; }));

      renderApp();
      const textarea = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(textarea, { target: { value: 'This is a long enough input for testing.' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^reflect$/i }));
      });

      expect(screen.getByRole('button', { name: /^reflecting$/i })).toBeDisabled();

      // Resolve to avoid test leaks
      await act(async () => { resolve(VALID_RESULT); });
    });
  });

  // -------------------------------------------------------------------------
  // Results rendering
  // -------------------------------------------------------------------------

  describe('results', () => {
    it('renders the classification after a successful reflection', async () => {
      mockReflect.mockResolvedValueOnce(VALID_RESULT);
      renderApp();
      const textarea = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(textarea, { target: { value: 'This is a long enough input for testing.' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^reflect$/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(Classification.INSTRUMENT)).toBeInTheDocument();
      });
    });

    it('renders the analysis report markdown', async () => {
      mockReflect.mockResolvedValueOnce(VALID_RESULT);
      renderApp();
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'This is a long enough input for testing.' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^reflect$/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/calm interaction/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('shows an error message when the API call fails', async () => {
      mockReflect.mockRejectedValueOnce(new Error('Network error'));
      renderApp();
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'This is a long enough input for testing.' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^reflect$/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(/reflection failed/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Clear button
  // -------------------------------------------------------------------------

  describe('Clear button', () => {
    it('resets transcript and results', async () => {
      mockReflect.mockResolvedValueOnce(VALID_RESULT);
      renderApp();
      const textarea = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.change(textarea, { target: { value: 'This is a long enough input for testing.' } });
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^reflect$/i }));
      });
      await waitFor(() => {
        expect(screen.getByText(Classification.INSTRUMENT)).toBeInTheDocument();
      });

      // Use exact "Clear" label to avoid matching "Discard Session & Clear Cache"
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
      });

      expect((textarea as HTMLTextAreaElement).value).toBe('');
      expect(screen.queryByText(Classification.INSTRUMENT)).not.toBeInTheDocument();
    });

    it('becomes enabled after text is entered', async () => {
      renderApp();
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
      });
      expect(screen.getByRole('button', { name: /^clear$/i })).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Auto-reflect debounce
  // -------------------------------------------------------------------------

  describe('auto-reflect debounce', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

    it('does not auto-reflect for text under 50 characters', async () => {
      renderApp();
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'short' } });
      });
      act(() => { vi.advanceTimersByTime(3000); });
      expect(mockReflect).not.toHaveBeenCalled();
    });

    it('triggers auto-reflect after 2500ms for text >= 50 characters', async () => {
      mockReflect.mockResolvedValue(VALID_RESULT);
      renderApp();
      const longText = 'a'.repeat(50);
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: longText } });
      });
      await act(async () => { vi.advanceTimersByTime(2500); });
      expect(mockReflect).toHaveBeenCalledTimes(1);
    });

    it('does not auto-reflect when auto-reflect toggle is off', async () => {
      renderApp();
      // The auto-reflect toggle is a <button> with text "Auto-Reflect: ON/OFF"
      const toggle = screen.getByRole('button', { name: /auto-reflect/i });
      await act(async () => { fireEvent.click(toggle); });

      const longText = 'a'.repeat(50);
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: longText } });
      });
      act(() => { vi.advanceTimersByTime(3000); });
      expect(mockReflect).not.toHaveBeenCalled();
    });
  });
});
