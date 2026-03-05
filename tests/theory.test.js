import { describe, it, expect } from 'vitest';

describe('padPitchClass', () => {
  it('returns 0-11 for standard MIDI range', () => {
    expect(padPitchClass(60)).toBe(0);
    expect(padPitchClass(61)).toBe(1);
    expect(padPitchClass(72)).toBe(0);
    expect(padPitchClass(36)).toBe(0);
  });

  it('handles modular arithmetic correctly', () => {
    for (let midi = 0; midi < 128; midi++) {
      const pc = padPitchClass(midi);
      expect(pc).toBeGreaterThanOrEqual(0);
      expect(pc).toBeLessThan(12);
    }
  });

  it('handles negative values via double-mod', () => {
    expect(padPitchClass(-1)).toBe(11);
    expect(padPitchClass(-12)).toBe(0);
  });
});

describe('padGetParentMajorKey', () => {
  it('Ionian returns key as-is', () => {
    expect(padGetParentMajorKey(0, 0)).toBe(0);
    expect(padGetParentMajorKey(0, 2)).toBe(2);
  });

  it('Dorian returns relative major', () => {
    expect(padGetParentMajorKey(1, 2)).toBe(0); // D Dorian → C
  });

  it('handles Harmonic Minor modes', () => {
    expect(padGetParentMajorKey(7, 9)).toBe(0); // A HM → C
  });
});

describe('padPcName', () => {
  it('returns flat names for C major (jazz convention)', () => {
    expect(padPcName(0, 0, 0)).toBe('C');
    expect(padPcName(1, 0, 0)).toBe('Db');
  });

  it('returns sharp names for D major', () => {
    expect(padPcName(1, 0, 2)).toBe('C#'); // D Ionian → parent D → sharp
  });

  it('returns flat names for flat keys', () => {
    expect(padPcName(1, 0, 5)).toBe('Db'); // F Ionian → parent F → flat
    expect(padPcName(3, 0, 5)).toBe('Eb');
  });
});

describe('padCalcVoicingOffsets', () => {
  it('preserves pitch class set through inversions', () => {
    const pcs = [0, 4, 7];
    for (let inv = 0; inv <= 2; inv++) {
      const { voiced } = padCalcVoicingOffsets(pcs, inv, null);
      const resultPCS = new Set(voiced.map(v => ((v % 12) + 12) % 12));
      expect(resultPCS).toEqual(new Set([0, 4, 7]));
    }
  });

  it('preserves pitch class set through Drop2', () => {
    const pcs = [0, 4, 7, 11];
    const { voiced } = padCalcVoicingOffsets(pcs, 0, 'drop2');
    const resultPCS = new Set(voiced.map(v => ((v % 12) + 12) % 12));
    expect(resultPCS).toEqual(new Set([0, 4, 7, 11]));
  });

  it('preserves pitch class set through Drop3', () => {
    const pcs = [0, 4, 7, 11];
    const { voiced } = padCalcVoicingOffsets(pcs, 0, 'drop3');
    const resultPCS = new Set(voiced.map(v => ((v % 12) + 12) % 12));
    expect(resultPCS).toEqual(new Set([0, 4, 7, 11]));
  });

  it('returns offsets relative to lowest note', () => {
    const pcs = [0, 4, 7];
    const { offsets } = padCalcVoicingOffsets(pcs, 0, null);
    expect(offsets[0]).toBe(0);
  });

  it('1st inversion moves root up an octave', () => {
    const pcs = [0, 4, 7];
    const { voiced } = padCalcVoicingOffsets(pcs, 1, null);
    expect(voiced).toEqual([4, 7, 12]);
  });
});

describe('padGetBassCase', () => {
  it('identifies chord tone bass', () => {
    const result = padGetBassCase(4, 0, [0, 4, 7]);
    expect(result.isChordTone).toBe(true);
    expect(result.inversionIndex).toBeGreaterThanOrEqual(0);
  });

  it('identifies non-chord tone bass', () => {
    const result = padGetBassCase(2, 0, [0, 4, 7]);
    expect(result.isChordTone).toBe(false);
    expect(result.inversionIndex).toBeNull();
  });
});

describe('padApplyOnChordBass', () => {
  it('inserts bass note below voiced intervals', () => {
    const result = padApplyOnChordBass([0, 4, 7], 0, 4);
    expect(result[0]).toBeLessThan(0);
    expect(result).toContain(0);
    expect(result).toContain(4);
    expect(result).toContain(7);
  });

  it('returns unchanged if lowest is already bass', () => {
    const result = padApplyOnChordBass([4, 7, 12], 0, 4);
    expect(result).toEqual([4, 7, 12]);
  });
});

describe('padGetShellIntervals', () => {
  it('returns R-3-7 for 137 shell (Maj7)', () => {
    const result = padGetShellIntervals([0, 4, 7, 11], '137', 0, null);
    expect(result).toContain(0);
    expect(result).toContain(4);
    expect(result).toContain(11);
    expect(result).toHaveLength(3);
  });

  it('returns R-7-3(+12) for 173 shell (Maj7)', () => {
    const result = padGetShellIntervals([0, 4, 7, 11], '173', 0, null);
    expect(result).toContain(0);
    expect(result).toContain(11);
    expect(result).toContain(16);
    expect(result).toHaveLength(3);
  });

  it('returns null if no 3rd found', () => {
    const result = padGetShellIntervals([0, 5, 7], '137', 0, null);
    expect(result).toBeNull();
  });

  it('returns null if no 7th found', () => {
    const result = padGetShellIntervals([0, 4, 7], '137', 0, null);
    expect(result).toBeNull();
  });

  it('uses 6th as 7th for 6th chords', () => {
    const result = padGetShellIntervals([0, 4, 7, 9], '137', 0, null);
    expect(result).not.toBeNull();
    expect(result).toContain(9);
  });

  it('includes compound intervals from fullPCS', () => {
    const result = padGetShellIntervals([0, 4, 7, 11], '137', 0, [0, 4, 7, 11, 14]);
    expect(result).toContain(14);
  });
});

describe('padApplyTension', () => {
  it('sus4 replaces 3rd with 4th', () => {
    const result = padApplyTension([0, 4, 7], { replace3: 5 });
    expect(result).toContain(5);
    expect(result).not.toContain(4);
    expect(result).not.toContain(3);
  });

  it('aug replaces 5th with #5', () => {
    const result = padApplyTension([0, 4, 7], { sharp5: true });
    expect(result).toContain(8);
    expect(result).not.toContain(7);
  });

  it('b5 replaces 5th with b5', () => {
    const result = padApplyTension([0, 4, 7, 10], { flat5: true });
    expect(result).toContain(6);
    expect(result).not.toContain(7);
  });

  it('add tensions as compound intervals (+12)', () => {
    const result = padApplyTension([0, 4, 7, 10], { add: [2] });
    expect(result).toContain(14);
  });

  it('does not duplicate existing pitch classes', () => {
    const result = padApplyTension([0, 2, 4, 7], { add: [2] });
    const count2 = result.filter(p => p % 12 === 2).length;
    expect(count2).toBe(1);
  });
});

describe('padGetDiatonicTetrads', () => {
  it('returns 7 tetrads for 7-note scales', () => {
    const tetrads = padGetDiatonicTetrads(SCALES[0].pcs, 0);
    expect(tetrads).toHaveLength(7);
  });

  it('returns empty for non-7-note scales', () => {
    expect(padGetDiatonicTetrads(SCALES[21].pcs, 0)).toEqual([]);
  });

  it('C Major diatonic tetrads have correct qualities', () => {
    const tetrads = padGetDiatonicTetrads(SCALES[0].pcs, 0);
    const names = tetrads.map(t => t.quality.name);
    expect(names[0]).toBe('\u25B37');
    expect(names[1]).toBe('m7');
    expect(names[2]).toBe('m7');
    expect(names[3]).toBe('\u25B37');
    expect(names[4]).toBe('7');
    expect(names[5]).toBe('m7');
    expect(names[6]).toBe('m7(b5)');
  });

  it('C Major root PCs follow scale degrees', () => {
    const tetrads = padGetDiatonicTetrads(SCALES[0].pcs, 0);
    expect(tetrads.map(t => t.rootPC)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });
});

describe('padFindParentScales', () => {
  it('returns results for Dm7', () => {
    const results = padFindParentScales(2, new Set([0, 3, 7, 10]), 0);
    expect(results.length).toBeGreaterThan(0);
    expect(results.map(r => r.scaleName)).toContain('Dorian');
  });

  it('returns results for G7', () => {
    const results = padFindParentScales(7, new Set([0, 4, 7, 10]), 0);
    expect(results.length).toBeGreaterThan(0);
    expect(results.map(r => r.scaleName)).toContain('Mixolydian');
  });

  it('strict matches come before omit5 matches', () => {
    const results = padFindParentScales(0, new Set([0, 4, 7, 10]), 0);
    const firstOmit5Idx = results.findIndex(r => r.omit5Match);
    if (firstOmit5Idx >= 0) {
      results.slice(0, firstOmit5Idx).forEach(r => {
        expect(r.omit5Match).toBe(false);
      });
    }
  });
});

describe('padFifthsDistance', () => {
  it('adjacent keys on circle of fifths = 1', () => {
    expect(padFifthsDistance(0, 7)).toBe(1);
    expect(padFifthsDistance(0, 5)).toBe(1);
  });

  it('tritone = 6 (maximum distance)', () => {
    expect(padFifthsDistance(0, 6)).toBe(6);
  });

  it('same key = 0', () => {
    expect(padFifthsDistance(0, 0)).toBe(0);
  });

  it('is symmetric', () => {
    for (let a = 0; a < 12; a++) {
      for (let b = 0; b < 12; b++) {
        expect(padFifthsDistance(a, b)).toBe(padFifthsDistance(b, a));
      }
    }
  });
});

describe('DIATONIC_CHORD_DB', () => {
  it('has entries for all 12 pitch classes', () => {
    for (let pc = 0; pc < 12; pc++) {
      expect(DIATONIC_CHORD_DB[pc]).toBeDefined();
      expect(DIATONIC_CHORD_DB[pc].length).toBeGreaterThan(0);
    }
  });

  it('covers 3 systems + NM', () => {
    const systems = new Set();
    Object.values(DIATONIC_CHORD_DB).flat().forEach(e => systems.add(e.system));
    expect(systems.has('○')).toBe(true);
    expect(systems.has('■')).toBe(true);
    expect(systems.has('◆')).toBe(true);
    expect(systems.has('NM')).toBe(true);
  });
});

describe('padBaseMidi', () => {
  it('returns BASE_MIDI at default', () => {
    expect(padBaseMidi(0)).toBe(36);
  });

  it('shifts by 12 per octave', () => {
    expect(padBaseMidi(1)).toBe(48);
    expect(padBaseMidi(-1)).toBe(24);
  });
});

describe('padMidiNote', () => {
  it('computes MIDI from row/col', () => {
    expect(padMidiNote(0, 0, 0)).toBe(36);
    expect(padMidiNote(1, 0, 0)).toBe(41);
    expect(padMidiNote(0, 1, 0)).toBe(37);
  });
});

describe('padDegreeName', () => {
  it('returns R for root', () => {
    expect(padDegreeName(0, [0, 4, 7])).toBe('R');
  });

  it('returns 3 for major third', () => {
    expect(padDegreeName(4, [0, 4, 7])).toBe('3');
  });

  it('returns #9 when M3 present', () => {
    expect(padDegreeName(3, [0, 4, 7, 10])).toBe('#9');
  });

  it('returns m3 when no M3', () => {
    expect(padDegreeName(3, [0, 3, 7])).toBe('m3');
  });
});
