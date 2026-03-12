import { describe, it, expect, beforeEach } from 'vitest';

// Helper: create mock tension button with classList tracking
function mockBtn(tension) {
  var classes = new Set();
  return {
    _tension: tension,
    classList: {
      add: function(c) { classes.add(c); },
      remove: function(c) { classes.delete(c); },
      contains: function(c) { return classes.has(c); },
      toggle: function(c, force) { if (force) classes.add(c); else classes.delete(c); },
    },
    _hasClass: function(c) { return classes.has(c); },
  };
}

// Build buttons from TENSION_ROWS data
function buildMockBtns() {
  var btns = [];
  var maxCols = Math.max(...TENSION_ROWS.map(r => r.length));
  TENSION_ROWS.forEach(row => {
    for (var i = 0; i < maxCols; i++) {
      btns.push(mockBtn(row[i] || null));
    }
  });
  return btns;
}

function findBtn(btns, label) {
  return btns.find(b => b._tension && b._tension.label === label);
}

describe('padUpdateTensionVisibility', () => {
  var btns;
  beforeEach(() => { btns = buildMockBtns(); });

  // Category D: Without 7th, altered tensions hidden
  it('hides b9 for major triad (no 7th)', () => {
    var major = { pcs: [0, 4, 7] };
    padUpdateTensionVisibility(btns, major, padApplyTension);
    var b9 = findBtn(btns, 'b9');
    expect(b9._hasClass('quality-hidden')).toBe(true);
  });

  // Category E: With 7th, "6" hidden
  it('hides "6" label for dom7', () => {
    var dom7 = { pcs: [0, 4, 7, 10] };
    padUpdateTensionVisibility(btns, dom7, padApplyTension);
    var six = findBtn(btns, '6');
    expect(six._hasClass('quality-hidden')).toBe(true);
  });

  // Category F: sus4 only for dominant 7
  it('hides sus4 for maj7 (not dominant)', () => {
    var maj7 = { pcs: [0, 4, 7, 11] };
    padUpdateTensionVisibility(btns, maj7, padApplyTension);
    var sus = findBtn(btns, 'sus4');
    expect(sus._hasClass('quality-hidden')).toBe(true);
  });

  it('shows sus4 for dom7', () => {
    var dom7 = { pcs: [0, 4, 7, 10] };
    padUpdateTensionVisibility(btns, dom7, padApplyTension);
    var sus = findBtn(btns, 'sus4');
    expect(sus._hasClass('quality-hidden')).toBe(false);
  });

  // Category G: Non-dominant 7th dims altered tensions
  it('dims b9 for min7 (non-dominant)', () => {
    var min7 = { pcs: [0, 3, 7, 10] };
    padUpdateTensionVisibility(btns, min7, padApplyTension);
    var b9 = findBtn(btns, 'b9');
    expect(b9._hasClass('tension-uncommon')).toBe(true);
  });

  it('does NOT dim b9 for dom7 (standard on dominant)', () => {
    var dom7 = { pcs: [0, 4, 7, 10] };
    padUpdateTensionVisibility(btns, dom7, padApplyTension);
    var b9 = findBtn(btns, 'b9');
    expect(b9._hasClass('tension-uncommon')).toBe(false);
  });

  // Category G2: 11th avoid on major 3rd
  it('hides 11 for major triad with 7th', () => {
    var dom7 = { pcs: [0, 4, 7, 10] };
    padUpdateTensionVisibility(btns, dom7, padApplyTension);
    var eleven = findBtn(btns, '11');
    // 11 should be hidden (avoid note on dom7 with major 3rd)
    if (eleven) expect(eleven._hasClass('quality-hidden')).toBe(true);
  });

  // Category H: add9 vs 9
  it('hides add9 for dom7 (has 7th → use "9" instead)', () => {
    var dom7 = { pcs: [0, 4, 7, 10] };
    padUpdateTensionVisibility(btns, dom7, padApplyTension);
    var add9 = findBtn(btns, 'add9');
    expect(add9._hasClass('quality-hidden')).toBe(true);
  });

  it('hides "9" for major triad (no 7th → use "add9" instead)', () => {
    var major = { pcs: [0, 4, 7] };
    padUpdateTensionVisibility(btns, major, padApplyTension);
    var nine = findBtn(btns, '9');
    expect(nine._hasClass('quality-hidden')).toBe(true);
  });

  // Category D2: Triad whitelist
  it('allows add9 and 6 for major triad, hides others', () => {
    var major = { pcs: [0, 4, 7] };
    padUpdateTensionVisibility(btns, major, padApplyTension);
    var add9 = findBtn(btns, 'add9');
    var six = findBtn(btns, '6');
    expect(add9._hasClass('quality-hidden')).toBe(false);
    expect(six._hasClass('quality-hidden')).toBe(false);
  });

  // Category G4: b13 on 6th chords
  it('hides b13 for 6th chord', () => {
    // C6 = [0, 4, 7, 9] — has6th=true (9 present, no 7th)
    var c6 = { pcs: [0, 4, 7, 9] };
    padUpdateTensionVisibility(btns, c6, padApplyTension);
    var b13 = findBtn(btns, 'b13');
    if (b13) expect(b13._hasClass('quality-hidden')).toBe(true);
  });

  // onTriad callback
  it('calls onTriad callback for triads', () => {
    var called = false;
    var major = { pcs: [0, 4, 7] };
    padUpdateTensionVisibility(btns, major, padApplyTension, {
      onTriad: function(isTriad) { called = isTriad; },
    });
    expect(called).toBe(true);
  });

  it('calls onTriad(false) for 7th chords', () => {
    var called = true;
    var dom7 = { pcs: [0, 4, 7, 10] };
    padUpdateTensionVisibility(btns, dom7, padApplyTension, {
      onTriad: function(isTriad) { called = isTriad; },
    });
    expect(called).toBe(false);
  });
});
