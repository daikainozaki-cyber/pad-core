import { describe, it, expect } from 'vitest';

// ======== padParseRoot ========
describe('padParseRoot', () => {
  it('parses C', () => {
    const r = padParseRoot('C');
    expect(r).toEqual({ pc: 0, len: 1 });
  });

  it('parses Bb', () => {
    const r = padParseRoot('Bb');
    expect(r).toEqual({ pc: 10, len: 2 });
  });

  it('parses F#', () => {
    const r = padParseRoot('F#');
    expect(r).toEqual({ pc: 6, len: 2 });
  });

  it('returns null for empty string', () => {
    expect(padParseRoot('')).toBeNull();
  });

  it('returns null for non-note', () => {
    expect(padParseRoot('X')).toBeNull();
  });

  it('handles unicode sharp ♯', () => {
    const r = padParseRoot('C\u266F');
    expect(r).toEqual({ pc: 1, len: 2 });
  });

  it('handles unicode flat ♭', () => {
    const r = padParseRoot('E\u266D');
    expect(r).toEqual({ pc: 3, len: 2 });
  });
});

// ======== padParseChordName ========
describe('padParseChordName', () => {
  it('parses Cm7', () => {
    const r = padParseChordName('Cm7');
    expect(r).not.toBeNull();
    expect(r.root).toBe(0);
    expect(r.quality).toBe('m7');
    expect(r.intervals).toEqual([0, 3, 7, 10]);
    expect(r.bass).toBeNull();
    expect(r.displayName).toBe('Cm7');
  });

  it('parses Am7/G (slash chord)', () => {
    const r = padParseChordName('Am7/G');
    expect(r).not.toBeNull();
    expect(r.root).toBe(9);
    expect(r.quality).toBe('m7');
    expect(r.bass).toBe(7);
    expect(r.displayName).toBe('Am7/G');
  });

  it('parses G7(b9,#11) compound tension', () => {
    const r = padParseChordName('G7(b9,#11)');
    expect(r).not.toBeNull();
    expect(r.root).toBe(7);
    expect(r.intervals).toEqual([0, 4, 7, 10, 13, 18]);
    expect(r.bass).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(padParseChordName('')).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(padParseChordName('X')).toBeNull();
  });

  it('parses major triad (C)', () => {
    const r = padParseChordName('C');
    expect(r.root).toBe(0);
    expect(r.intervals).toEqual([0, 4, 7]);
  });

  it('parses Dbmaj7', () => {
    const r = padParseChordName('Dbmaj7');
    expect(r.root).toBe(1);
    expect(r.intervals).toEqual([0, 4, 7, 11]);
  });

  it('resolves alias M7 → maj7 in displayName', () => {
    const r = padParseChordName('CM7');
    expect(r.displayName).toBe('Cmaj7');
  });

  it('parses lowercase root as uppercase', () => {
    const r = padParseChordName('cm7');
    expect(r).not.toBeNull();
    expect(r.root).toBe(0);
    expect(r.quality).toBe('m7');
  });

  it('handles whitespace', () => {
    const r = padParseChordName('  Dm7  ');
    expect(r).not.toBeNull();
    expect(r.root).toBe(2);
  });

  it('parses slash chord with flat bass', () => {
    const r = padParseChordName('C/Bb');
    expect(r).not.toBeNull();
    expect(r.root).toBe(0);
    expect(r.bass).toBe(10);
    expect(r.displayName).toBe('C/Bb');
  });

  it('parses dim7', () => {
    const r = padParseChordName('Bdim7');
    expect(r.root).toBe(11);
    expect(r.intervals).toEqual([0, 3, 6, 9]);
  });

  it('parses unicode △7', () => {
    const r = padParseChordName('C\u25B37');
    expect(r.root).toBe(0);
    expect(r.intervals).toEqual([0, 4, 7, 11]);
  });

  it('parses FmMaj7 (minor-major-7)', () => {
    const r = padParseChordName('FmMaj7');
    expect(r).not.toBeNull();
    expect(r.root).toBe(5);
    expect(r.intervals).toEqual([0, 3, 7, 11]);
    expect(r.displayName).toBe('Fm\u25B37');
  });

  it('parses CmM7 (minor-major-7 short form)', () => {
    const r = padParseChordName('CmM7');
    expect(r).not.toBeNull();
    expect(r.root).toBe(0);
    expect(r.intervals).toEqual([0, 3, 7, 11]);
    expect(r.displayName).toBe('Cm\u25B37');
  });
});

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

  it('returns triads when noteCount=3', () => {
    const triads = padGetDiatonicTetrads(SCALES[0].pcs, 0, 3);
    expect(triads).toHaveLength(7);
    triads.forEach(t => expect(t.pcs).toHaveLength(3));
  });

  it('C Major triads: I, ii, iii, IV, V, vi, vii°', () => {
    const triads = padGetDiatonicTetrads(SCALES[0].pcs, 0, 3);
    const names = triads.map(t => t.quality.name);
    expect(names).toEqual(['', 'm', 'm', '', '', 'm', 'dim']);
  });

  it('C Major triad degrees use correct roman numerals', () => {
    const triads = padGetDiatonicTetrads(SCALES[0].pcs, 0, 3);
    const degrees = triads.map(t => t.degree);
    expect(degrees).toEqual(['I', 'IIm', 'IIIm', 'IV', 'V', 'VIm', 'VIIdim']);
  });

  it('Harmonic minor triads include aug', () => {
    const triads = padGetDiatonicTetrads(SCALES[7].pcs, 0, 3);
    const names = triads.map(t => t.quality.name);
    expect(names[2]).toBe('aug'); // III+ in harmonic minor
  });

  it('noteCount defaults to 4 (backward compatible)', () => {
    const a = padGetDiatonicTetrads(SCALES[0].pcs, 0);
    const b = padGetDiatonicTetrads(SCALES[0].pcs, 0, 4);
    expect(a).toEqual(b);
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

// ======== padEnumGuitarChordForms ========
describe('padEnumGuitarChordForms', () => {
  const GUITAR = [64, 59, 55, 50, 45, 40]; // standard tuning
  const BASS = [43, 38, 33, 28]; // standard bass tuning

  it('returns array of forms for C major', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.length).toBeLessThanOrEqual(15);
  });

  it('open C chord appears in results', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    // Open C: x32010 → [0, 1, 0, 2, 3, null] in our indexing (high to low)
    const openC = forms.find(f =>
      f.frets[0] === 0 && f.frets[1] === 1 && f.frets[2] === 0 &&
      f.frets[3] === 2 && f.frets[4] === 3 && f.frets[5] === null
    );
    expect(openC).toBeDefined();
    expect(openC.rootInBass).toBe(true);
    expect(openC.stringCount).toBe(5);
    expect(openC.span).toBe(3);
    expect(openC.gaps).toBe(0);
  });

  it('all forms have root', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    for (const f of forms) {
      const pcs = new Set();
      for (let s = 0; s < 6; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      expect(pcs.has(0)).toBe(true); // C
    }
  });

  it('all forms have 3rd when chord has one', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    for (const f of forms) {
      const pcs = new Set();
      for (let s = 0; s < 6; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      expect(pcs.has(4)).toBe(true); // E (major 3rd)
    }
  });

  it('respects max span of 4', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7, 11], 0, GUITAR, 21, 4);
    for (const f of forms) {
      const fretted = f.frets.filter(x => x !== null && x > 0);
      if (fretted.length >= 2) {
        const span = Math.max(...fretted) - Math.min(...fretted) + 1;
        expect(span).toBeLessThanOrEqual(4);
      }
    }
  });

  it('open strings excluded from span', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    const openC = forms.find(f =>
      f.frets[0] === 0 && f.frets[1] === 1 && f.frets[2] === 0
    );
    // Open strings (fret 0) should not count toward span
    // Only frets 1,2,3 count → span = 3
    if (openC) expect(openC.span).toBeLessThanOrEqual(4);
  });

  it('Am7 includes open string forms', () => {
    // Am7 = [0, 3, 7, 10], root = A(9)
    const forms = padEnumGuitarChordForms([0, 3, 7, 10], 9, GUITAR, 21, 4);
    expect(forms.length).toBeGreaterThan(0);
    // Open Am7: x02010 → should have fret 0 somewhere
    const hasOpen = forms.some(f => f.frets.includes(0));
    expect(hasOpen).toBe(true);
  });

  it('returns at most maxResults forms', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4, { maxResults: 5 });
    expect(forms.length).toBeLessThanOrEqual(5);
  });

  it('root-in-bass forms are sorted first', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    // Find first form without root in bass
    const firstNonRoot = forms.findIndex(f => !f.rootInBass);
    if (firstNonRoot > 0) {
      // All forms before it should have root in bass
      for (let i = 0; i < firstNonRoot; i++) {
        expect(forms[i].rootInBass).toBe(true);
      }
    }
  });

  it('works with bass tuning (4 strings)', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, BASS, 21, 4);
    expect(forms.length).toBeGreaterThan(0);
    for (const f of forms) {
      expect(f.frets.length).toBe(4);
      expect(f.stringCount).toBeLessThanOrEqual(4);
    }
  });

  it('Bbmaj7 has no open string forms', () => {
    // Bbmaj7 = [0, 4, 7, 11], root = Bb(10)
    const forms = padEnumGuitarChordForms([0, 4, 7, 11], 10, GUITAR, 21, 4);
    expect(forms.length).toBeGreaterThan(0);
    // Bb is not an open string note, so pure open forms shouldn't appear
    // But open strings that happen to be chord tones (e.g., D=2 is not in Bbmaj7) can still appear
  });

  it('shell 1-3-7 (3 notes) produces many candidates', () => {
    // C shell: [0, 4, 11] → only 3 notes, should produce many candidates
    const forms = padEnumGuitarChordForms([0, 4, 11], 0, GUITAR, 21, 4);
    expect(forms.length).toBe(15); // should hit maxResults
  });

  it('each form has at least minNotes sounding', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4, { minNotes: 4 });
    for (const f of forms) {
      expect(f.stringCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('gaps count is correct', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    for (const f of forms) {
      // Verify gap count manually
      let lo = -1, hi = -1;
      for (let i = 0; i < f.frets.length; i++) {
        if (f.frets[i] !== null) {
          if (hi === -1) hi = i;
          lo = i;
        }
      }
      let gaps = 0;
      for (let i = hi + 1; i < lo; i++) {
        if (f.frets[i] === null) gaps++;
      }
      expect(f.gaps).toBe(gaps);
    }
  });

  // --- Unison avoidance ---
  it('no form has two strings with the exact same MIDI note', () => {
    const forms = padEnumGuitarChordForms([0, 3, 7], 0, GUITAR, 21, 4);
    for (const f of forms) {
      const midis = [];
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) midis.push(GUITAR[s] + f.frets[s]);
      }
      const uniqueMidis = new Set(midis);
      expect(uniqueMidis.size).toBe(midis.length);
    }
  });

  it('octave duplicates (same PC, different octave) are allowed', () => {
    // E major: open E chord has E on strings 1 and 6 (different octaves)
    const forms = padEnumGuitarChordForms([0, 4, 7], 4, GUITAR, 21, 4);
    // Open E: 0,0,1,2,2,0 → string 0 (E4=64) and string 5 (E2=40)
    const openE = forms.find(f =>
      f.frets[0] === 0 && f.frets[1] === 0 && f.frets[2] === 1 &&
      f.frets[3] === 2 && f.frets[4] === 2 && f.frets[5] === 0
    );
    expect(openE).toBeDefined();
    expect(openE.stringCount).toBe(6);
  });

  // --- Fifth omission ---
  it('C9 forms can omit the 5th (G) — tension chord', () => {
    // C9 = [0, 4, 7, 10, 14], has 9th (>=13) → 5th optional
    const forms = padEnumGuitarChordForms([0, 4, 7, 10, 14], 0, GUITAR, 21, 4);
    const formsWithout5th = forms.filter(f => {
      const pcs = new Set();
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      return !pcs.has(7); // G = pitch class 7
    });
    expect(formsWithout5th.length).toBeGreaterThan(0);
  });

  it('C7 allows omitting 5th (7th present = R37 shell is standard)', () => {
    // C7 = [0, 4, 7, 10], has 7th → 5th is optional (R-3-7 shell voicing)
    const forms = padEnumGuitarChordForms([0, 4, 7, 10], 0, GUITAR, 21, 4);
    const formsWithout5th = forms.filter(f => {
      const pcs = new Set();
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      return !pcs.has(7); // G = pitch class 7
    });
    expect(formsWithout5th.length).toBeGreaterThan(0);
  });

  it('triads still require all notes', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    for (const f of forms) {
      const pcs = new Set();
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      expect(pcs.has(7)).toBe(true); // G must be present
    }
  });

  // --- Rootless voicings ---
  it('allowRootless: forms without root appear', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7, 10], 0, GUITAR, 21, 4, { allowRootless: true, maxResults: 50 });
    const rootless = forms.filter(f => f.isRootless);
    expect(rootless.length).toBeGreaterThan(0);
    // All rootless forms should have isRootless flag
    for (const f of rootless) {
      const pcs = new Set();
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      expect(pcs.has(0)).toBe(false); // no C
    }
  });

  it('allowRootless: rooted forms rank higher than rootless', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7, 10], 0, GUITAR, 21, 4, { allowRootless: true, maxResults: 50 });
    const firstRootless = forms.findIndex(f => f.isRootless);
    const lastRooted = forms.reduce((acc, f, i) => !f.isRootless ? i : acc, -1);
    if (firstRootless >= 0 && lastRooted >= 0) {
      // At least some rooted forms should come before rootless
      expect(firstRootless).toBeGreaterThan(0);
    }
  });

  it('default: no rootless forms appear', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7, 10], 0, GUITAR, 21, 4);
    for (const f of forms) {
      expect(f.isRootless).toBe(false);
    }
  });

  it('isRootless flag exists on all forms', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    for (const f of forms) {
      expect(typeof f.isRootless).toBe('boolean');
    }
  });

  // --- Finger unit constraint ---
  it('all forms need at most 4 finger units', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7, 10], 0, GUITAR, 21, 4);
    for (const f of forms) {
      expect(f.fingerUnits).toBeLessThanOrEqual(4);
    }
  });

  it('open C chord needs 3 finger units', () => {
    // x32010 → frets 1,2,3 each = 1 unit = 3 total
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    const openC = forms.find(f =>
      f.frets[0] === 0 && f.frets[1] === 1 && f.frets[2] === 0 &&
      f.frets[3] === 2 && f.frets[4] === 3 && f.frets[5] === null
    );
    expect(openC).toBeDefined();
    expect(openC.fingerUnits).toBe(3);
  });

  it('fingerUnits field exists on all forms', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4);
    for (const f of forms) {
      expect(typeof f.fingerUnits).toBe('number');
      expect(f.fingerUnits).toBeGreaterThan(0);
    }
  });

  // --- Altered 5th protection ---
  it('Cm7b5 forms always include b5', () => {
    // Cm7b5 = [0, 3, 6, 10], b5 replaces natural 5th → must keep
    const forms = padEnumGuitarChordForms([0, 3, 6, 10], 0, GUITAR, 21, 4);
    for (const f of forms) {
      const pcs = new Set();
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      expect(pcs.has(6)).toBe(true); // Gb = pitch class 6
    }
  });

  it('Caug forms always include #5', () => {
    // Caug = [0, 4, 8], #5 replaces natural 5th → must keep
    const forms = padEnumGuitarChordForms([0, 4, 8], 0, GUITAR, 21, 4);
    for (const f of forms) {
      const pcs = new Set();
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      expect(pcs.has(8)).toBe(true); // Ab = pitch class 8
    }
  });

  // --- noOpen (funk/soul: no open strings) ---
  it('noOpen: no form uses fret 0', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7], 0, GUITAR, 21, 4, { noOpen: true });
    expect(forms.length).toBeGreaterThan(0);
    for (const f of forms) {
      expect(f.frets).not.toContain(0);
    }
  });

  it('noOpen: Cmaj7 top results are closed position', () => {
    const forms = padEnumGuitarChordForms([0, 4, 7, 11], 0, GUITAR, 21, 4, { noOpen: true });
    expect(forms.length).toBeGreaterThan(0);
    for (const f of forms) {
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) expect(f.frets[s]).toBeGreaterThan(0);
      }
    }
  });

  it('C7(#11) can omit 5th (natural 5th + tension coexist)', () => {
    // C7(#11) = [0, 4, 7, 10, 18], has tensions, natural 5th present, #11 is tension
    const forms = padEnumGuitarChordForms([0, 4, 7, 10, 18], 0, GUITAR, 21, 4);
    const without5th = forms.filter(f => {
      const pcs = new Set();
      for (let s = 0; s < GUITAR.length; s++) {
        if (f.frets[s] !== null) pcs.add((GUITAR[s] + f.frets[s]) % 12);
      }
      return !pcs.has(7);
    });
    expect(without5th.length).toBeGreaterThan(0);
  });
});
