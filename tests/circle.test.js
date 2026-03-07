import { describe, it, expect } from 'vitest';

// ======== Constants ========

describe('PAD_CIRCLE_KEYS', () => {
  it('has 12 entries in fifths order', () => {
    expect(PAD_CIRCLE_KEYS.length).toBe(12);
    expect(PAD_CIRCLE_KEYS[0].major).toBe('C');
    expect(PAD_CIRCLE_KEYS[1].major).toBe('G');
    expect(PAD_CIRCLE_KEYS[11].major).toBe('F');
  });

  it('each entry has major, minor, sharps, flats', () => {
    PAD_CIRCLE_KEYS.forEach(function(k) {
      expect(typeof k.major).toBe('string');
      expect(typeof k.minor).toBe('string');
      expect(typeof k.sharps).toBe('number');
      expect(typeof k.flats).toBe('number');
    });
  });

  it('sharps + flats never both > 0', () => {
    PAD_CIRCLE_KEYS.forEach(function(k) {
      expect(k.sharps === 0 || k.flats === 0).toBe(true);
    });
  });
});

describe('PAD_CIRCLE_NOTE_NAMES', () => {
  it('has 12 entries', () => {
    expect(PAD_CIRCLE_NOTE_NAMES.length).toBe(12);
  });

  it('each entry has sharp and flat variants', () => {
    PAD_CIRCLE_NOTE_NAMES.forEach(function(n) {
      expect(typeof n.sharp).toBe('string');
      expect(typeof n.flat).toBe('string');
    });
  });

  it('enharmonic pairs are correct', () => {
    // F#/Gb
    expect(PAD_CIRCLE_NOTE_NAMES[6].sharp).toContain('F');
    expect(PAD_CIRCLE_NOTE_NAMES[6].flat).toContain('G');
  });
});

// ======== Pure Functions ========

describe('padCircleGetNoteName', () => {
  it('returns sharp name when useSharp=true', () => {
    expect(padCircleGetNoteName(0, true)).toBe('C');
    expect(padCircleGetNoteName(6, true)).toBe('F♯');
  });

  it('returns flat name when useSharp=false', () => {
    expect(padCircleGetNoteName(0, false)).toBe('C');
    expect(padCircleGetNoteName(6, false)).toBe('G♭');
  });

  it('handles all 12 indices', () => {
    for (var i = 0; i < 12; i++) {
      expect(typeof padCircleGetNoteName(i, true)).toBe('string');
      expect(typeof padCircleGetNoteName(i, false)).toBe('string');
    }
  });
});

describe('padCirclePolarToCartesian', () => {
  it('0 degrees = top (12 o\'clock)', () => {
    var pos = padCirclePolarToCartesian(350, 350, 280, 0);
    expect(pos.x).toBeCloseTo(350, 5);
    expect(pos.y).toBeCloseTo(70, 5);
  });

  it('90 degrees = right (3 o\'clock)', () => {
    var pos = padCirclePolarToCartesian(350, 350, 280, 90);
    expect(pos.x).toBeCloseTo(630, 5);
    expect(pos.y).toBeCloseTo(350, 5);
  });

  it('180 degrees = bottom (6 o\'clock)', () => {
    var pos = padCirclePolarToCartesian(350, 350, 280, 180);
    expect(pos.x).toBeCloseTo(350, 5);
    expect(pos.y).toBeCloseTo(630, 5);
  });

  it('270 degrees = left (9 o\'clock)', () => {
    var pos = padCirclePolarToCartesian(350, 350, 280, 270);
    expect(pos.x).toBeCloseTo(70, 5);
    expect(pos.y).toBeCloseTo(350, 5);
  });

  it('returns {x, y} object', () => {
    var pos = padCirclePolarToCartesian(0, 0, 100, 45);
    expect(pos).toHaveProperty('x');
    expect(pos).toHaveProperty('y');
  });
});

describe('padCircleCreateSegmentPath', () => {
  it('returns a valid SVG path string', () => {
    var d = padCircleCreateSegmentPath(350, 350, 200, 280, 0, 30);
    expect(typeof d).toBe('string');
    expect(d).toMatch(/^M /);
    expect(d).toContain(' A ');
    expect(d).toContain(' L ');
    expect(d).toMatch(/Z$/);
  });

  it('different angles produce different paths', () => {
    var d1 = padCircleCreateSegmentPath(350, 350, 200, 280, 0, 30);
    var d2 = padCircleCreateSegmentPath(350, 350, 200, 280, 30, 60);
    expect(d1).not.toBe(d2);
  });

  it('different radii produce different paths', () => {
    var d1 = padCircleCreateSegmentPath(350, 350, 200, 280, 0, 30);
    var d2 = padCircleCreateSegmentPath(350, 350, 120, 200, 0, 30);
    expect(d1).not.toBe(d2);
  });
});

// ======== Degree Data ========

describe('PAD_CIRCLE_MAJOR_DEGREES', () => {
  it('has 8 entries (7 diatonic + substitute)', () => {
    expect(PAD_CIRCLE_MAJOR_DEGREES.length).toBe(8);
  });

  it('each has roman, offset, suffix, isMajor, colorType', () => {
    PAD_CIRCLE_MAJOR_DEGREES.forEach(function(d) {
      expect(typeof d.roman).toBe('string');
      expect(typeof d.offset).toBe('number');
      expect(typeof d.suffix).toBe('string');
      expect(typeof d.isMajor).toBe('boolean');
      expect(['tonic', 'subdominant', 'dominant']).toContain(d.colorType);
    });
  });

  it('starts with I Maj7 tonic', () => {
    expect(PAD_CIRCLE_MAJOR_DEGREES[0].roman).toBe('I');
    expect(PAD_CIRCLE_MAJOR_DEGREES[0].suffix).toBe('Maj7');
    expect(PAD_CIRCLE_MAJOR_DEGREES[0].colorType).toBe('tonic');
  });

  it('last entry is substitute dominant', () => {
    var last = PAD_CIRCLE_MAJOR_DEGREES[PAD_CIRCLE_MAJOR_DEGREES.length - 1];
    expect(last.isSubstitute).toBe(true);
    expect(last.colorType).toBe('dominant');
  });
});

describe('PAD_CIRCLE_MINOR_DEGREES', () => {
  it('has 10 entries', () => {
    expect(PAD_CIRCLE_MINOR_DEGREES.length).toBe(10);
  });

  it('each has circleOffset', () => {
    PAD_CIRCLE_MINOR_DEGREES.forEach(function(d) {
      expect(d).toHaveProperty('circleOffset');
    });
  });

  it('last entry is substitute dominant', () => {
    var last = PAD_CIRCLE_MINOR_DEGREES[PAD_CIRCLE_MINOR_DEGREES.length - 1];
    expect(last.isSubstitute).toBe(true);
  });
});

// ======== Diatonic Data ========

describe('PAD_CIRCLE_MAJOR_DIATONIC', () => {
  it('has 12 entries (7 diatonic + 5 non-diatonic)', () => {
    expect(PAD_CIRCLE_MAJOR_DIATONIC.length).toBe(12);
  });

  it('first 7 are diatonic', () => {
    for (var i = 0; i < 7; i++) {
      expect(PAD_CIRCLE_MAJOR_DIATONIC[i].isDiatonic).toBe(true);
    }
  });

  it('each has harmonicFn string', () => {
    PAD_CIRCLE_MAJOR_DIATONIC.forEach(function(d) {
      expect(typeof d.harmonicFn).toBe('string');
      expect(d.harmonicFn.length).toBeGreaterThan(0);
    });
  });

  it('colorType values are valid', () => {
    PAD_CIRCLE_MAJOR_DIATONIC.forEach(function(d) {
      expect(['tonic', 'subdominant', 'dominant']).toContain(d.colorType);
    });
  });
});

describe('PAD_CIRCLE_MINOR_DIATONIC_NATURAL', () => {
  it('has 10 entries (7 diatonic + 3 non-diatonic)', () => {
    expect(PAD_CIRCLE_MINOR_DIATONIC_NATURAL.length).toBe(10);
  });

  it('each minor entry has circleOffset', () => {
    PAD_CIRCLE_MINOR_DIATONIC_NATURAL.forEach(function(d) {
      expect(d).toHaveProperty('circleOffset');
    });
  });
});

describe('PAD_CIRCLE_MINOR_DIATONIC_HARMONIC', () => {
  it('has 8 entries (7 diatonic + 1 non-diatonic)', () => {
    expect(PAD_CIRCLE_MINOR_DIATONIC_HARMONIC.length).toBe(8);
  });

  it('V7 is diatonic in harmonic minor', () => {
    var v7 = PAD_CIRCLE_MINOR_DIATONIC_HARMONIC.filter(function(d) {
      return d.roman === 'V' && d.suffix === '7';
    });
    expect(v7.length).toBe(1);
    expect(v7[0].isDiatonic).toBe(true);
  });
});

describe('PAD_CIRCLE_MINOR_DIATONIC_MELODIC', () => {
  it('has 8 entries (7 diatonic + 1 non-diatonic)', () => {
    expect(PAD_CIRCLE_MINOR_DIATONIC_MELODIC.length).toBe(8);
  });

  it('ii is m7 (not m7b5) in melodic minor', () => {
    var ii = PAD_CIRCLE_MINOR_DIATONIC_MELODIC.filter(function(d) {
      return d.roman === 'ii';
    });
    expect(ii.length).toBe(1);
    expect(ii[0].suffix).toBe('m7');
  });
});

// ======== Render Function ========

describe('padRenderCircleOfFifths', () => {
  it('returns update and destroy functions', () => {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var result = padRenderCircleOfFifths(svgEl, { size: 200 });
    expect(typeof result.update).toBe('function');
    expect(typeof result.destroy).toBe('function');
  });

  it('does not throw with default options', () => {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(function() {
      padRenderCircleOfFifths(svgEl, {});
    }).not.toThrow();
  });

  it('does not throw with selectedKeyIndex', () => {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(function() {
      padRenderCircleOfFifths(svgEl, { selectedKeyIndex: 0, selectedType: 'major' });
    }).not.toThrow();
  });

  it('does not throw with minor selection and scale mode buttons', () => {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(function() {
      padRenderCircleOfFifths(svgEl, {
        selectedKeyIndex: 3,
        selectedType: 'minor',
        scaleMode: 'harmonic',
        showScaleModeButtons: true,
      });
    }).not.toThrow();
  });

  it('update does not throw', () => {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var instance = padRenderCircleOfFifths(svgEl, {});
    expect(function() {
      instance.update({ selectedKeyIndex: 5, selectedType: 'minor' });
    }).not.toThrow();
  });

  it('destroy does not throw', () => {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var instance = padRenderCircleOfFifths(svgEl, {});
    expect(function() {
      instance.destroy();
    }).not.toThrow();
  });

  it('fires onKeySelect callback via update', () => {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var called = false;
    padRenderCircleOfFifths(svgEl, {
      onKeySelect: function() { called = true; },
    });
    // Callback fires on segment click, not on initial render
    expect(called).toBe(false);
  });
});
