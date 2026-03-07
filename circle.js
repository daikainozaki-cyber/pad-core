// ========================================
// PAD-CORE — Circle of Fifths (Pure SVG Rendering)
// Self-contained: no dependency on data.js or theory.js
// ========================================

// ======== CONSTANTS ========

var PAD_CIRCLE_KEYS = [
  { major: 'C', minor: 'Am', sharps: 0, flats: 0 },
  { major: 'G', minor: 'Em', sharps: 1, flats: 0 },
  { major: 'D', minor: 'Bm', sharps: 2, flats: 0 },
  { major: 'A', minor: 'F♯m', sharps: 3, flats: 0 },
  { major: 'E', minor: 'C♯m', sharps: 4, flats: 0 },
  { major: 'B', minor: 'G♯m', sharps: 5, flats: 0 },
  { major: 'G♭', minor: 'E♭m', sharps: 0, flats: 6 },
  { major: 'D♭', minor: 'B♭m', sharps: 0, flats: 5 },
  { major: 'A♭', minor: 'Fm', sharps: 0, flats: 4 },
  { major: 'E♭', minor: 'Cm', sharps: 0, flats: 3 },
  { major: 'B♭', minor: 'Gm', sharps: 0, flats: 2 },
  { major: 'F', minor: 'Dm', sharps: 0, flats: 1 }
];

var PAD_CIRCLE_NOTE_NAMES = [
  { sharp: 'C', flat: 'C' },
  { sharp: 'G', flat: 'G' },
  { sharp: 'D', flat: 'D' },
  { sharp: 'A', flat: 'A' },
  { sharp: 'E', flat: 'E' },
  { sharp: 'B', flat: 'B' },
  { sharp: 'F♯', flat: 'G♭' },
  { sharp: 'C♯', flat: 'D♭' },
  { sharp: 'G♯', flat: 'A♭' },
  { sharp: 'D♯', flat: 'E♭' },
  { sharp: 'A♯', flat: 'B♭' },
  { sharp: 'F', flat: 'F' }
];

var PAD_CIRCLE_DEFAULT_COLORS = {
  tonic: '#ff9800',
  subdominant: '#42a5f5',
  dominant: '#ef5350',
  majorSegment: '#388e3c',
  minorSegment: '#81c784',
  selectedStroke: '#ff6f00',
  centerFill: 'white',
  majorText: 'white',
  minorText: '#1b5e20',
  segmentStroke: 'white',
  titleColor: '#2e7d32',
  subtitleColor: '#66bb6a',
  degreeText: '#333',
  degreeTextAlt: 'white',
  degreeStroke: 'white',
  buttonBg: 'white',
  buttonActiveText: 'white',
  buttonNatural: '#66bb6a',
  buttonHarmonic: '#1b5e20',
  buttonMelodic: '#43a047'
};

// ======== DEGREE DATA (circle overlay) ========

var PAD_CIRCLE_MAJOR_DEGREES = [
  { roman: 'I', offset: 0, suffix: 'Maj7', isMajor: true, colorType: 'tonic' },
  { roman: 'ii', offset: 2, suffix: 'm7', isMajor: false, colorType: 'subdominant' },
  { roman: 'iii', offset: 4, suffix: 'm7', isMajor: false, colorType: 'tonic' },
  { roman: 'IV', offset: -1, suffix: 'Maj7', isMajor: true, colorType: 'subdominant' },
  { roman: 'V', offset: 1, suffix: '7', isMajor: true, colorType: 'dominant' },
  { roman: 'vi', offset: 3, suffix: 'm7', isMajor: false, colorType: 'tonic' },
  { roman: 'vii', offset: 5, suffix: 'dim7', isMajor: false, colorType: 'dominant' },
  { roman: '♭II', offset: -5, suffix: '7', isMajor: true, colorType: 'dominant', isSubstitute: true }
];

var PAD_CIRCLE_MINOR_DEGREES = [
  { roman: 'i', offset: 0, circleOffset: 0, suffix: 'm7', isMajor: false, colorType: 'tonic' },
  { roman: 'ii', offset: 2, circleOffset: 2, suffix: 'm7(♭5)', isMajor: false, colorType: 'subdominant' },
  { roman: '♭III', offset: -3, circleOffset: 0, suffix: 'Maj7', isMajor: true, colorType: 'tonic' },
  { roman: 'iv', offset: -1, circleOffset: -1, suffix: 'm7', isMajor: false, colorType: 'subdominant' },
  { roman: 'V', offset: 1, circleOffset: 4, suffix: '7', isMajor: true, colorType: 'dominant' },
  { roman: 'v', offset: 1, circleOffset: 1, suffix: 'm7', isMajor: false, colorType: 'dominant' },
  { roman: '♭VI', offset: -4, circleOffset: -1, suffix: 'Maj7', isMajor: true, colorType: 'subdominant' },
  { roman: '♭VII', offset: -2, circleOffset: 1, suffix: '7', isMajor: true, colorType: 'subdominant' },
  { roman: 'vii', offset: 5, circleOffset: 5, suffix: 'dim7', isMajor: false, colorType: 'dominant' },
  { roman: '♭II', offset: -5, circleOffset: -2, suffix: '7', isMajor: true, colorType: 'dominant', isSubstitute: true }
];

// ======== DIATONIC DATA (for tables) ========

var PAD_CIRCLE_MAJOR_DIATONIC = [
  { roman: 'I', offset: 0, suffix: 'Maj7', harmonicFn: 'トニック', isMajor: true, colorType: 'tonic', isDiatonic: true },
  { roman: 'ii', offset: 2, suffix: 'm7', harmonicFn: 'サブドミナント', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: 'iii', offset: 4, suffix: 'm7', harmonicFn: 'トニック（代理）', isMajor: false, colorType: 'tonic', isDiatonic: true },
  { roman: 'IV', offset: -1, suffix: 'Maj7', harmonicFn: 'サブドミナント', isMajor: true, colorType: 'subdominant', isDiatonic: true },
  { roman: 'V', offset: 1, suffix: '7', harmonicFn: 'ドミナント', isMajor: true, colorType: 'dominant', isDiatonic: true },
  { roman: 'vi', offset: 3, suffix: 'm7', harmonicFn: 'トニック（代理）', isMajor: false, colorType: 'tonic', isDiatonic: true },
  { roman: 'vii', offset: 5, suffix: 'm7(♭5)', harmonicFn: 'ドミナント（代理）', isMajor: false, colorType: 'dominant', isDiatonic: true },
  { roman: 'I', offset: 0, suffix: '7', harmonicFn: 'トニック（ブルース）', isMajor: true, colorType: 'tonic', isDiatonic: false },
  { roman: 'IV', offset: -1, suffix: '7', harmonicFn: 'サブドミナント（ブルース）', isMajor: true, colorType: 'subdominant', isDiatonic: false },
  { roman: 'vii', offset: 5, suffix: 'dim7', harmonicFn: 'ドミナント（代理）', isMajor: false, colorType: 'dominant', isDiatonic: false },
  { roman: '♭II', offset: -5, suffix: '7', harmonicFn: '裏コード（V7代理）', isMajor: true, colorType: 'dominant', isDiatonic: false },
  { roman: 'IV', offset: -1, suffix: 'm7', harmonicFn: 'サブドミナント・マイナー', isMajor: false, colorType: 'subdominant', isDiatonic: false }
];

var PAD_CIRCLE_MINOR_DIATONIC_NATURAL = [
  { roman: 'i', offset: 0, circleOffset: 0, suffix: 'm7', harmonicFn: 'トニック', isMajor: false, colorType: 'tonic', isDiatonic: true },
  { roman: 'ii', offset: 2, circleOffset: 2, suffix: 'm7(♭5)', harmonicFn: 'サブドミナント（代理）', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: '♭III', offset: -3, circleOffset: 0, suffix: 'Maj7', harmonicFn: 'トニック（代理）', isMajor: true, colorType: 'tonic', isDiatonic: true },
  { roman: 'iv', offset: -1, circleOffset: -1, suffix: 'm7', harmonicFn: 'サブドミナント', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: 'v', offset: 1, circleOffset: 1, suffix: 'm7', harmonicFn: 'ドミナント（ナチュラル）', isMajor: false, colorType: 'dominant', isDiatonic: true },
  { roman: '♭VI', offset: -4, circleOffset: -1, suffix: 'Maj7', harmonicFn: 'サブドミナント（代理）', isMajor: true, colorType: 'subdominant', isDiatonic: true },
  { roman: '♭VII', offset: -2, circleOffset: 1, suffix: '7', harmonicFn: 'サブドミナント（代理）', isMajor: true, colorType: 'subdominant', isDiatonic: true },
  { roman: 'V', offset: 1, circleOffset: 4, suffix: '7', harmonicFn: 'ドミナント', isMajor: true, colorType: 'dominant', isDiatonic: false },
  { roman: 'vii', offset: 5, circleOffset: 5, suffix: 'dim7', harmonicFn: 'ドミナント（代理）', isMajor: false, colorType: 'dominant', isDiatonic: false },
  { roman: '♭II', offset: -5, circleOffset: -2, suffix: '7', harmonicFn: '裏コード（V7代理）', isMajor: true, colorType: 'dominant', isDiatonic: false }
];

var PAD_CIRCLE_MINOR_DIATONIC_HARMONIC = [
  { roman: 'i', offset: 0, circleOffset: 0, suffix: 'm(Maj7)', harmonicFn: 'トニック', isMajor: false, colorType: 'tonic', isDiatonic: true },
  { roman: 'ii', offset: 2, circleOffset: 2, suffix: 'm7(♭5)', harmonicFn: 'サブドミナント（代理）', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: '♭III', offset: -3, circleOffset: 0, suffix: 'Maj7(♯5)', harmonicFn: 'トニック（代理）', isMajor: true, colorType: 'tonic', isDiatonic: true },
  { roman: 'iv', offset: -1, circleOffset: -1, suffix: 'm7', harmonicFn: 'サブドミナント', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: 'V', offset: 1, circleOffset: 4, suffix: '7', harmonicFn: 'ドミナント', isMajor: true, colorType: 'dominant', isDiatonic: true },
  { roman: '♭VI', offset: -4, circleOffset: -1, suffix: 'Maj7', harmonicFn: 'サブドミナント（代理）', isMajor: true, colorType: 'subdominant', isDiatonic: true },
  { roman: 'vii', offset: 5, circleOffset: 5, suffix: 'dim7', harmonicFn: 'ドミナント（代理）', isMajor: false, colorType: 'dominant', isDiatonic: true },
  { roman: '♭II', offset: -5, circleOffset: -2, suffix: '7', harmonicFn: '裏コード（V7代理）', isMajor: true, colorType: 'dominant', isDiatonic: false }
];

var PAD_CIRCLE_MINOR_DIATONIC_MELODIC = [
  { roman: 'i', offset: 0, circleOffset: 0, suffix: 'm(Maj7)', harmonicFn: 'トニック', isMajor: false, colorType: 'tonic', isDiatonic: true },
  { roman: 'ii', offset: 2, circleOffset: 2, suffix: 'm7', harmonicFn: 'サブドミナント', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: '♭III', offset: -3, circleOffset: 0, suffix: 'Maj7(♯5)', harmonicFn: 'トニック（代理）', isMajor: true, colorType: 'tonic', isDiatonic: true },
  { roman: 'IV', offset: -1, circleOffset: 2, suffix: '7', harmonicFn: 'サブドミナント', isMajor: true, colorType: 'subdominant', isDiatonic: true },
  { roman: 'V', offset: 1, circleOffset: 4, suffix: '7', harmonicFn: 'ドミナント', isMajor: true, colorType: 'dominant', isDiatonic: true },
  { roman: 'vi', offset: 3, circleOffset: 3, suffix: 'm7(♭5)', harmonicFn: 'サブドミナント（代理）', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: 'vii', offset: 5, circleOffset: 5, suffix: 'm7(♭5)', harmonicFn: 'ドミナント（代理）', isMajor: false, colorType: 'dominant', isDiatonic: true },
  { roman: '♭II', offset: -5, circleOffset: -2, suffix: '7', harmonicFn: '裏コード（V7代理）', isMajor: true, colorType: 'dominant', isDiatonic: false }
];

// ======== PURE FUNCTIONS ========

function padCircleGetNoteName(index, useSharp) {
  var note = PAD_CIRCLE_NOTE_NAMES[index];
  return useSharp ? note.sharp : note.flat;
}

function padCirclePolarToCartesian(cx, cy, radius, angleDeg) {
  var angleRad = (angleDeg - 90) * Math.PI / 180.0;
  return {
    x: cx + (radius * Math.cos(angleRad)),
    y: cy + (radius * Math.sin(angleRad))
  };
}

function padCircleCreateSegmentPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  var startOuter = padCirclePolarToCartesian(cx, cy, outerR, startAngle);
  var endOuter = padCirclePolarToCartesian(cx, cy, outerR, endAngle);
  var startInner = padCirclePolarToCartesian(cx, cy, innerR, endAngle);
  var endInner = padCirclePolarToCartesian(cx, cy, innerR, startAngle);
  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOuter.x, startOuter.y,
    "A", outerR, outerR, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    "L", startInner.x, startInner.y,
    "A", innerR, innerR, 0, largeArcFlag, 0, endInner.x, endInner.y,
    "Z"
  ].join(" ");
}

// ======== MAIN RENDER ========

function padRenderCircleOfFifths(svgEl, options) {
  var opts = options || {};

  var state = {
    selectedKeyIndex: opts.selectedKeyIndex != null ? opts.selectedKeyIndex : null,
    selectedType: opts.selectedType || null,
    scaleMode: opts.scaleMode || 'natural',
    size: opts.size || 700,
    showDegrees: opts.showDegrees !== false,
    showScaleModeButtons: opts.showScaleModeButtons !== false,
    showTitle: opts.showTitle !== false,
    onKeySelect: opts.onKeySelect || null,
    onScaleModeChange: opts.onScaleModeChange || null
  };

  var dc = PAD_CIRCLE_DEFAULT_COLORS;
  var uc = opts.colors || {};
  var colors = {
    tonic: uc.tonic || dc.tonic,
    subdominant: uc.subdominant || dc.subdominant,
    dominant: uc.dominant || dc.dominant,
    majorSegment: uc.majorSegment || dc.majorSegment,
    minorSegment: uc.minorSegment || dc.minorSegment,
    selectedStroke: uc.selectedStroke || dc.selectedStroke,
    centerFill: uc.centerFill || dc.centerFill,
    majorText: uc.majorText || dc.majorText,
    minorText: uc.minorText || dc.minorText,
    segmentStroke: uc.segmentStroke || dc.segmentStroke,
    titleColor: uc.titleColor || dc.titleColor,
    subtitleColor: uc.subtitleColor || dc.subtitleColor,
    degreeText: uc.degreeText || dc.degreeText,
    degreeTextAlt: uc.degreeTextAlt || dc.degreeTextAlt,
    degreeStroke: uc.degreeStroke || dc.degreeStroke,
    buttonBg: uc.buttonBg || dc.buttonBg,
    buttonActiveText: uc.buttonActiveText || dc.buttonActiveText,
    buttonNatural: uc.buttonNatural || dc.buttonNatural,
    buttonHarmonic: uc.buttonHarmonic || dc.buttonHarmonic,
    buttonMelodic: uc.buttonMelodic || dc.buttonMelodic
  };

  // Fixed coordinate system — SVG viewBox handles scaling
  var CX = 380, CY = 380;
  var OUTER_R = 280, INNER_R = 200, CENTER_R = 120;
  var ANGLE_PER_SEG = 30;


  function svgNS(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function clearSvg() {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  }

  function render() {
    clearSvg();

    svgEl.setAttribute('viewBox', '0 0 760 760');
    svgEl.setAttribute('width', state.size);
    svgEl.setAttribute('height', state.size);

    // --- Build degree-to-segment maps ---
    var majorDegreeMap = {};
    var minorDegreeMap = {};
    var hasDegreeSelection = state.showDegrees && state.selectedKeyIndex !== null && state.selectedType;

    if (hasDegreeSelection) {
      var degTable;
      if (state.selectedType === 'major') {
        degTable = PAD_CIRCLE_MAJOR_DIATONIC;
      } else {
        if (state.scaleMode === 'harmonic') degTable = PAD_CIRCLE_MINOR_DIATONIC_HARMONIC;
        else if (state.scaleMode === 'melodic') degTable = PAD_CIRCLE_MINOR_DIATONIC_MELODIC;
        else degTable = PAD_CIRCLE_MINOR_DIATONIC_NATURAL;
      }

      degTable.forEach(function(deg) {
        if (!deg.isDiatonic) return; // Show only selected mode's diatonic degrees
        var off = deg.circleOffset !== undefined ? deg.circleOffset : deg.offset;
        var ti = (state.selectedKeyIndex + off + 12) % 12;
        if (state.selectedType === 'major' && !deg.isMajor) {
          ti = (ti + 9) % 12;
        }
        var map = deg.isMajor ? majorDegreeMap : minorDegreeMap;
        if (!map[ti]) map[ti] = [];
        map[ti].push(deg);
      });
    }

    // --- Segments ---
    PAD_CIRCLE_KEYS.forEach(function(key, index) {
      var startAngle = index * ANGLE_PER_SEG - ANGLE_PER_SEG / 2;
      var endAngle = startAngle + ANGLE_PER_SEG;
      var midAngle = startAngle + ANGLE_PER_SEG / 2;

      // Degree info for this segment
      var majDegs = majorDegreeMap[index];
      var minDegs = minorDegreeMap[index];

      // --- Major segment ---
      var majorFill = colors.majorSegment;
      var majorFillOp = '1';
      if (majDegs) {
        var majPri = majDegs.find(function(d) { return d.isDiatonic; }) || majDegs[0];
        majorFill = colors[majPri.colorType];
        majorFillOp = majPri.isDiatonic ? '1' : '0.5';
      } else if (hasDegreeSelection) {
        majorFillOp = '0.35';
      }

      var majorD = padCircleCreateSegmentPath(CX, CY, INNER_R, OUTER_R, startAngle, endAngle);
      var majorSeg = svgNS('path');
      majorSeg.setAttribute('d', majorD);
      majorSeg.setAttribute('fill', majorFill);
      majorSeg.setAttribute('fill-opacity', majorFillOp);
      majorSeg.setAttribute('stroke', colors.segmentStroke);
      majorSeg.setAttribute('stroke-width', '2');
      majorSeg.setAttribute('cursor', 'pointer');
      majorSeg.addEventListener('click', (function(i) {
        return function() {
          state.selectedKeyIndex = i;
          state.selectedType = 'major';
          render();
          if (state.onKeySelect) state.onKeySelect(i, 'major');
        };
      })(index));
      svgEl.appendChild(majorSeg);

      // Major key text (always visible)
      var majorPos = padCirclePolarToCartesian(CX, CY, (OUTER_R + INNER_R) / 2, midAngle);
      var majorText = svgNS('text');
      majorText.setAttribute('x', majorPos.x);
      majorText.setAttribute('y', majorPos.y);
      majorText.setAttribute('text-anchor', 'middle');
      majorText.setAttribute('dominant-baseline', 'middle');
      majorText.setAttribute('font-size', '22');
      majorText.setAttribute('font-weight', '600');
      majorText.setAttribute('fill', majDegs ? 'rgba(255,255,255,0.95)' : colors.majorText);
      majorText.setAttribute('pointer-events', 'none');
      majorText.setAttribute('style', 'text-rendering: optimizeLegibility;');
      if (hasDegreeSelection && !majDegs) majorText.setAttribute('fill-opacity', '0.4');
      majorText.textContent = key.major;
      svgEl.appendChild(majorText);

      // Major degree label (outside the outer ring)
      if (majDegs) {
        var majDegPos = padCirclePolarToCartesian(CX, CY, OUTER_R + 20, midAngle);
        var seen = {}, labels = [];
        majDegs.forEach(function(d) { if (!seen[d.roman]) { labels.push(d.roman); seen[d.roman] = true; } });
        var majDegText = svgNS('text');
        majDegText.setAttribute('x', majDegPos.x);
        majDegText.setAttribute('y', majDegPos.y);
        majDegText.setAttribute('text-anchor', 'middle');
        majDegText.setAttribute('dominant-baseline', 'middle');
        majDegText.setAttribute('font-size', '14');
        majDegText.setAttribute('font-weight', '700');
        majDegText.setAttribute('fill', 'white');
        majDegText.setAttribute('pointer-events', 'none');
        majDegText.setAttribute('style', 'text-rendering: optimizeLegibility;');
        majDegText.textContent = labels.join('/');
        svgEl.appendChild(majDegText);
      }

      // --- Minor segment ---
      var minorFill = colors.minorSegment;
      var minorFillOp = '1';
      if (minDegs) {
        var minPri = minDegs.find(function(d) { return d.isDiatonic; }) || minDegs[0];
        minorFill = colors[minPri.colorType];
        minorFillOp = minPri.isDiatonic ? '1' : '0.5';
      } else if (hasDegreeSelection) {
        minorFillOp = '0.35';
      }

      var minorD = padCircleCreateSegmentPath(CX, CY, CENTER_R, INNER_R, startAngle, endAngle);
      var minorSeg = svgNS('path');
      minorSeg.setAttribute('d', minorD);
      minorSeg.setAttribute('fill', minorFill);
      minorSeg.setAttribute('fill-opacity', minorFillOp);
      minorSeg.setAttribute('stroke', colors.segmentStroke);
      minorSeg.setAttribute('stroke-width', '2');
      minorSeg.setAttribute('cursor', 'pointer');
      minorSeg.addEventListener('click', (function(i) {
        return function() {
          state.selectedKeyIndex = i;
          state.selectedType = 'minor';
          render();
          if (state.onKeySelect) state.onKeySelect(i, 'minor');
        };
      })(index));
      svgEl.appendChild(minorSeg);

      // Minor key text (always visible)
      var minorPos = padCirclePolarToCartesian(CX, CY, (INNER_R + CENTER_R) / 2, midAngle);
      var minorText = svgNS('text');
      minorText.setAttribute('x', minorPos.x);
      minorText.setAttribute('y', minorPos.y);
      minorText.setAttribute('text-anchor', 'middle');
      minorText.setAttribute('dominant-baseline', 'middle');
      minorText.setAttribute('font-size', '16');
      minorText.setAttribute('font-weight', '500');
      minorText.setAttribute('fill', minDegs ? 'rgba(255,255,255,0.95)' : colors.minorText);
      minorText.setAttribute('pointer-events', 'none');
      minorText.setAttribute('style', 'text-rendering: optimizeLegibility;');
      if (hasDegreeSelection && !minDegs) minorText.setAttribute('fill-opacity', '0.4');
      minorText.textContent = key.minor;
      svgEl.appendChild(minorText);

      // Minor degree label (near center edge)
      if (minDegs) {
        var minDegPos = padCirclePolarToCartesian(CX, CY, CENTER_R + 15, midAngle);
        var seenMin = {}, labelsMin = [];
        minDegs.forEach(function(d) { if (!seenMin[d.roman]) { labelsMin.push(d.roman); seenMin[d.roman] = true; } });
        var minDegText = svgNS('text');
        minDegText.setAttribute('x', minDegPos.x);
        minDegText.setAttribute('y', minDegPos.y);
        minDegText.setAttribute('text-anchor', 'middle');
        minDegText.setAttribute('dominant-baseline', 'middle');
        minDegText.setAttribute('font-size', '12');
        minDegText.setAttribute('font-weight', '700');
        minDegText.setAttribute('fill', 'white');
        minDegText.setAttribute('pointer-events', 'none');
        minDegText.setAttribute('style', 'text-rendering: optimizeLegibility;');
        minDegText.textContent = labelsMin.join('/');
        svgEl.appendChild(minDegText);
      }
    });

    // --- Center circle ---
    var centerCircle = svgNS('circle');
    centerCircle.setAttribute('cx', CX);
    centerCircle.setAttribute('cy', CY);
    centerCircle.setAttribute('r', CENTER_R);
    centerCircle.setAttribute('fill', colors.centerFill);
    svgEl.appendChild(centerCircle);

    // --- Selection highlight (overlay after center circle, uniform grid preserved) ---
    if (state.selectedKeyIndex !== null && state.selectedType) {
      var selIdx = state.selectedKeyIndex;
      var selStart = selIdx * ANGLE_PER_SEG - ANGLE_PER_SEG / 2;
      var selEnd = selStart + ANGLE_PER_SEG;
      var selInner = state.selectedType === 'major' ? INNER_R : CENTER_R;
      var selOuter = state.selectedType === 'major' ? OUTER_R : INNER_R;
      var selD = padCircleCreateSegmentPath(CX, CY, selInner, selOuter, selStart, selEnd);
      var selHighlight = svgNS('path');
      selHighlight.setAttribute('d', selD);
      selHighlight.setAttribute('fill', 'none');
      selHighlight.setAttribute('stroke', colors.selectedStroke);
      selHighlight.setAttribute('stroke-width', '4');
      selHighlight.setAttribute('pointer-events', 'none');
      svgEl.appendChild(selHighlight);
    }

    // --- Title ---
    if (state.showTitle) {
      var title1 = svgNS('text');
      title1.setAttribute('x', CX);
      title1.setAttribute('y', CY - 50);
      title1.setAttribute('text-anchor', 'middle');
      title1.setAttribute('dominant-baseline', 'middle');
      title1.setAttribute('font-size', '24');
      title1.setAttribute('font-weight', '700');
      title1.setAttribute('fill', colors.titleColor);
      title1.setAttribute('style', 'text-rendering: optimizeLegibility;');
      title1.textContent = '五度圏';
      svgEl.appendChild(title1);

      var title2 = svgNS('text');
      title2.setAttribute('x', CX);
      title2.setAttribute('y', CY - 30);
      title2.setAttribute('text-anchor', 'middle');
      title2.setAttribute('dominant-baseline', 'middle');
      title2.setAttribute('font-size', '16');
      title2.setAttribute('font-weight', '400');
      title2.setAttribute('fill', colors.subtitleColor);
      title2.setAttribute('style', 'text-rendering: optimizeLegibility;');
      title2.textContent = 'Circle of Fifths';
      svgEl.appendChild(title2);
    }

    // --- Scale mode toggle (minor only, compact inline labels) ---
    if (state.showScaleModeButtons && state.selectedType === 'minor') {
      var modes = [
        { key: 'natural', label: 'Nat', color: colors.buttonNatural },
        { key: 'harmonic', label: 'Harm', color: colors.buttonHarmonic },
        { key: 'melodic', label: 'Mel', color: colors.buttonMelodic }
      ];
      var labelY = CY + 55;
      var gap = 8;
      var itemW = 52;
      var totalW = itemW * 3 + gap * 2;
      var startX = CX - totalW / 2;

      modes.forEach(function(m, i) {
        var mx = startX + i * (itemW + gap);
        var isActive = state.scaleMode === m.key;

        var hitArea = svgNS('rect');
        hitArea.setAttribute('x', mx);
        hitArea.setAttribute('y', labelY - 10);
        hitArea.setAttribute('width', itemW);
        hitArea.setAttribute('height', 20);
        hitArea.setAttribute('fill', 'transparent');
        hitArea.setAttribute('cursor', 'pointer');
        hitArea.addEventListener('click', (function(mode) {
          return function() {
            state.scaleMode = mode;
            render();
            if (state.onScaleModeChange) state.onScaleModeChange(state.scaleMode);
          };
        })(m.key));
        svgEl.appendChild(hitArea);

        var label = svgNS('text');
        label.setAttribute('x', mx + itemW / 2);
        label.setAttribute('y', labelY + 2);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', isActive ? '14' : '11');
        label.setAttribute('font-weight', isActive ? '700' : '400');
        label.setAttribute('fill', isActive ? m.color : '#888');
        label.setAttribute('pointer-events', 'none');
        label.setAttribute('style', 'text-rendering: optimizeLegibility;');
        label.textContent = m.label;
        svgEl.appendChild(label);
      });
    }

  }

  render();

  return {
    update: function(newOptions) {
      var no = newOptions || {};
      if (no.selectedKeyIndex !== undefined) state.selectedKeyIndex = no.selectedKeyIndex;
      if (no.selectedType !== undefined) state.selectedType = no.selectedType;
      if (no.scaleMode !== undefined) state.scaleMode = no.scaleMode;
      if (no.size !== undefined) state.size = no.size;
      if (no.showDegrees !== undefined) state.showDegrees = no.showDegrees;
      if (no.showScaleModeButtons !== undefined) state.showScaleModeButtons = no.showScaleModeButtons;
      if (no.showTitle !== undefined) state.showTitle = no.showTitle;
      if (no.onKeySelect !== undefined) state.onKeySelect = no.onKeySelect;
      if (no.onScaleModeChange !== undefined) state.onScaleModeChange = no.onScaleModeChange;
      if (no.colors) {
        var nc = no.colors;
        if (nc.tonic) colors.tonic = nc.tonic;
        if (nc.subdominant) colors.subdominant = nc.subdominant;
        if (nc.dominant) colors.dominant = nc.dominant;
        if (nc.majorSegment) colors.majorSegment = nc.majorSegment;
        if (nc.minorSegment) colors.minorSegment = nc.minorSegment;
        if (nc.selectedStroke) colors.selectedStroke = nc.selectedStroke;
      }
      render();
    },
    destroy: function() {
      clearSvg();
    }
  };
}

// Conditional exports for Node.js (Vitest) — ignored in browser
if (typeof module !== 'undefined') module.exports = {
  padCircleKeys: PAD_CIRCLE_KEYS,
  padCircleNoteNames: PAD_CIRCLE_NOTE_NAMES,
  padCircleDefaultColors: PAD_CIRCLE_DEFAULT_COLORS,
  padCircleMajorDegrees: PAD_CIRCLE_MAJOR_DEGREES,
  padCircleMinorDegrees: PAD_CIRCLE_MINOR_DEGREES,
  padCircleMajorDiatonic: PAD_CIRCLE_MAJOR_DIATONIC,
  padCircleMinorDiatonicNatural: PAD_CIRCLE_MINOR_DIATONIC_NATURAL,
  padCircleMinorDiatonicHarmonic: PAD_CIRCLE_MINOR_DIATONIC_HARMONIC,
  padCircleMinorDiatonicMelodic: PAD_CIRCLE_MINOR_DIATONIC_MELODIC,
  padCircleGetNoteName: padCircleGetNoteName,
  padCirclePolarToCartesian: padCirclePolarToCartesian,
  padCircleCreateSegmentPath: padCircleCreateSegmentPath,
  padRenderCircleOfFifths: padRenderCircleOfFifths,
  PAD_CIRCLE_KEYS: PAD_CIRCLE_KEYS,
  PAD_CIRCLE_NOTE_NAMES: PAD_CIRCLE_NOTE_NAMES,
  PAD_CIRCLE_DEFAULT_COLORS: PAD_CIRCLE_DEFAULT_COLORS,
  PAD_CIRCLE_MAJOR_DEGREES: PAD_CIRCLE_MAJOR_DEGREES,
  PAD_CIRCLE_MINOR_DEGREES: PAD_CIRCLE_MINOR_DEGREES,
  PAD_CIRCLE_MAJOR_DIATONIC: PAD_CIRCLE_MAJOR_DIATONIC,
  PAD_CIRCLE_MINOR_DIATONIC_NATURAL: PAD_CIRCLE_MINOR_DIATONIC_NATURAL,
  PAD_CIRCLE_MINOR_DIATONIC_HARMONIC: PAD_CIRCLE_MINOR_DIATONIC_HARMONIC,
  PAD_CIRCLE_MINOR_DIATONIC_MELODIC: PAD_CIRCLE_MINOR_DIATONIC_MELODIC,
};
