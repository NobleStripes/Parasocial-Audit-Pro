import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn — Tailwind class merging utility', () => {
  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns a single class unchanged', () => {
    expect(cn('px-4')).toBe('px-4');
  });

  it('merges multiple class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('resolves conflicting Tailwind utility classes (last one wins)', () => {
    // tailwind-merge should keep px-4 and drop px-2
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes — falsy values are omitted', () => {
    expect(cn('a', false && 'b')).toBe('a');
    expect(cn('a', undefined)).toBe('a');
    expect(cn('a', null)).toBe('a');
  });

  it('handles conditional classes — truthy values are included', () => {
    expect(cn('a', true && 'b')).toBe('a b');
  });

  it('handles object syntax from clsx', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('handles array syntax from clsx', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
  });
});
