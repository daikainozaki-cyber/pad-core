import { describe, it, expect } from 'vitest';

describe('SCALES', () => {
  it('contains 31 scales', () => {
    expect(SCALES).toHaveLength(31);
  });

  it('each scale has valid pcs (0-11, sorted, no duplicates)', () => {
    SCALES.forEach((scale) => {
      scale.pcs.forEach(pc => {
        expect(pc).toBeGreaterThanOrEqual(0);
        expect(pc).toBeLessThan(12);
      });
      for (let i = 1; i < scale.pcs.length; i++) {
        expect(scale.pcs[i]).toBeGreaterThan(scale.pcs[i - 1]);
      }
      expect(new Set(scale.pcs).size).toBe(scale.pcs.length);
    });
  });

  it('each scale has required properties', () => {
    SCALES.forEach(scale => {
      expect(scale).toHaveProperty('id');
      expect(scale).toHaveProperty('name');
      expect(scale).toHaveProperty('pcs');
      expect(scale).toHaveProperty('cn');
    });
  });

  it('all scales start with 0 (root)', () => {
    SCALES.forEach(scale => {
      expect(scale.pcs[0]).toBe(0);
    });
  });

  it('diatonic modes have 7 notes', () => {
    SCALES.filter(s => s.cat === '○').forEach(scale => {
      expect(scale.pcs).toHaveLength(7);
    });
  });
});

describe('BUILDER_QUALITIES', () => {
  it('is a 4x3 grid', () => {
    expect(BUILDER_QUALITIES).toHaveLength(4);
    BUILDER_QUALITIES.forEach(row => {
      expect(row).toHaveLength(3);
    });
  });

  it('each quality has name, label, and valid pcs', () => {
    BUILDER_QUALITIES.flat().forEach(q => {
      expect(q).toHaveProperty('name');
      expect(q).toHaveProperty('label');
      expect(q).toHaveProperty('pcs');
      q.pcs.forEach(pc => {
        expect(pc).toBeGreaterThanOrEqual(0);
        expect(pc).toBeLessThan(12);
      });
    });
  });

  it('all qualities start with root (0)', () => {
    BUILDER_QUALITIES.flat().forEach(q => {
      expect(q.pcs[0]).toBe(0);
    });
  });
});

describe('TENSION_ROWS', () => {
  it('non-null entries have label and mods', () => {
    TENSION_ROWS.flat().forEach(t => {
      if (t === null) return;
      expect(t).toHaveProperty('label');
      expect(t).toHaveProperty('mods');
    });
  });

  it('mods.add values are valid pitch classes', () => {
    TENSION_ROWS.flat().forEach(t => {
      if (!t || !t.mods.add) return;
      t.mods.add.forEach(pc => {
        expect(pc).toBeGreaterThanOrEqual(0);
        expect(pc).toBeLessThan(12);
      });
    });
  });
});

describe('SCALE_AVAIL_TENSIONS', () => {
  it('covers all diatonic/HM/MM scales (indices 0-20)', () => {
    for (let i = 0; i <= 20; i++) {
      expect(SCALE_AVAIL_TENSIONS).toHaveProperty(String(i));
    }
  });

  it('avail and avoid contain valid tension names', () => {
    const validNames = new Set(Object.keys(TENSION_NAME_TO_PC));
    Object.values(SCALE_AVAIL_TENSIONS).forEach(sat => {
      if (sat.avail) sat.avail.forEach(name => expect(validNames.has(name)).toBe(true));
      if (sat.avoid) sat.avoid.forEach(name => expect(validNames.has(name)).toBe(true));
    });
  });
});

describe('GRID', () => {
  it('has standard 8x8 pad layout', () => {
    expect(GRID.ROWS).toBe(8);
    expect(GRID.COLS).toBe(8);
    expect(GRID.BASE_MIDI).toBe(36);
    expect(GRID.ROW_INTERVAL).toBe(5);
  });
});
