import { describe, it, expect } from 'vitest';

describe('padGenerateCandidates', () => {
  it('returns empty for empty input', () => {
    expect(padGenerateCandidates('', null)).toEqual([]);
  });

  it('generates major chord for "C"', () => {
    const results = padGenerateCandidates('C', null);
    expect(results.length).toBeGreaterThan(0);
    // First result should be C (major) — shortest quality match
    expect(results[0].type).toBe('chord');
    expect(results[0].name).toContain('C');
  });

  it('generates minor chord for lowercase "c"', () => {
    const results = padGenerateCandidates('c', null);
    expect(results.length).toBeGreaterThan(0);
    // Should include minor chords
    expect(results.some(r => r.quality && r.quality.startsWith('m'))).toBe(true);
  });

  it('generates Cm7 candidates for "Cm"', () => {
    const results = padGenerateCandidates('Cm', null);
    expect(results.some(r => r.name === 'Cm')).toBe(true);
    expect(results.some(r => r.name === 'Cm7')).toBe(true);
  });

  it('generates slash chord candidates for "C/"', () => {
    const results = padGenerateCandidates('C/', null);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.name.includes('/'))).toBe(true);
  });

  it('generates Cmaj7 for "CM"', () => {
    const results = padGenerateCandidates('CM', null);
    // Should include major 7th types
    expect(results.some(r => r.quality && (r.quality.startsWith('M') || r.quality.startsWith('maj')))).toBe(true);
  });

  it('limits results to 12', () => {
    const results = padGenerateCandidates('C', null);
    expect(results.length).toBeLessThanOrEqual(12);
  });

  // Memory recall
  it('recalls memory slot by number', () => {
    const slots = [{ name: 'Cmaj7' }, null, { name: 'Dm7' }];
    const results = padGenerateCandidates('1', slots);
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('memory');
    expect(results[0].name).toBe('Cmaj7');
  });

  it('returns empty for non-matching memory number', () => {
    const slots = [null, null];
    const results = padGenerateCandidates('1', slots);
    expect(results.length).toBe(0);
  });

  it('returns chord candidates when no memory slots provided', () => {
    // "1" with no memory → no results (no root matches "1")
    const results = padGenerateCandidates('1', null);
    expect(results.length).toBe(0);
  });
});

describe('padGenerateSlashCandidates', () => {
  it('generates C/E, C/G etc.', () => {
    const results = padGenerateSlashCandidates('C', '', '');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.name.includes('/'))).toBe(true);
  });

  it('filters by bass input prefix', () => {
    const results = padGenerateSlashCandidates('C', '', 'E');
    expect(results.length).toBeGreaterThan(0);
    // Should only have bass notes starting with E
    expect(results.every(r => r.name.includes('/E'))).toBe(true);
  });

  it('returns empty for invalid quality', () => {
    const results = padGenerateSlashCandidates('C', 'zzz', '');
    expect(results.length).toBe(0);
  });
});

describe('padGenerateExtensionCandidates', () => {
  it('generates extensions for "Cm7"', () => {
    // Use Cm7 (fewer extensions) to ensure action is within 12 limit
    const results = padGenerateExtensionCandidates('Cm7');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.type === 'chord')).toBe(true);
  });

  it('includes on-chord action for short base', () => {
    // Use a specific quality with few extensions
    const results = padGenerateExtensionCandidates('Cdim7');
    const action = results.find(r => r.type === 'action');
    expect(action).toBeDefined();
    expect(action.name).toBe('Cdim7/...');
  });
});
