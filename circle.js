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
  selectedStroke: '#ff6f00'
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
  { roman: 'V', offset: 1, circleOffset: 1, suffix: '7', isMajor: true, colorType: 'dominant' },
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
  { roman: 'V', offset: 1, circleOffset: 1, suffix: '7', harmonicFn: 'ドミナント', isMajor: true, colorType: 'dominant', isDiatonic: false },
  { roman: 'vii', offset: 5, circleOffset: 5, suffix: 'dim7', harmonicFn: 'ドミナント（代理）', isMajor: false, colorType: 'dominant', isDiatonic: false },
  { roman: '♭II', offset: -5, circleOffset: -2, suffix: '7', harmonicFn: '裏コード（V7代理）', isMajor: true, colorType: 'dominant', isDiatonic: false }
];

var PAD_CIRCLE_MINOR_DIATONIC_HARMONIC = [
  { roman: 'i', offset: 0, circleOffset: 0, suffix: 'm(Maj7)', harmonicFn: 'トニック', isMajor: false, colorType: 'tonic', isDiatonic: true },
  { roman: 'ii', offset: 2, circleOffset: 2, suffix: 'm7(♭5)', harmonicFn: 'サブドミナント（代理）', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: '♭III', offset: -3, circleOffset: 0, suffix: 'Maj7(♯5)', harmonicFn: 'トニック（代理）', isMajor: true, colorType: 'tonic', isDiatonic: true },
  { roman: 'iv', offset: -1, circleOffset: -1, suffix: 'm7', harmonicFn: 'サブドミナント', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: 'V', offset: 1, circleOffset: 1, suffix: '7', harmonicFn: 'ドミナント', isMajor: true, colorType: 'dominant', isDiatonic: true },
  { roman: '♭VI', offset: -4, circleOffset: -1, suffix: 'Maj7', harmonicFn: 'サブドミナント（代理）', isMajor: true, colorType: 'subdominant', isDiatonic: true },
  { roman: 'vii', offset: 5, circleOffset: 5, suffix: 'dim7', harmonicFn: 'ドミナント（代理）', isMajor: false, colorType: 'dominant', isDiatonic: true },
  { roman: '♭II', offset: -5, circleOffset: -2, suffix: '7', harmonicFn: '裏コード（V7代理）', isMajor: true, colorType: 'dominant', isDiatonic: false }
];

var PAD_CIRCLE_MINOR_DIATONIC_MELODIC = [
  { roman: 'i', offset: 0, circleOffset: 0, suffix: 'm(Maj7)', harmonicFn: 'トニック', isMajor: false, colorType: 'tonic', isDiatonic: true },
  { roman: 'ii', offset: 2, circleOffset: 2, suffix: 'm7', harmonicFn: 'サブドミナント', isMajor: false, colorType: 'subdominant', isDiatonic: true },
  { roman: '♭III', offset: -3, circleOffset: 0, suffix: 'Maj7(♯5)', harmonicFn: 'トニック（代理）', isMajor: true, colorType: 'tonic', isDiatonic: true },
  { roman: 'IV', offset: -1, circleOffset: -1, suffix: '7', harmonicFn: 'サブドミナント', isMajor: true, colorType: 'subdominant', isDiatonic: true },
  { roman: 'V', offset: 1, circleOffset: 1, suffix: '7', harmonicFn: 'ドミナント', isMajor: true, colorType: 'dominant', isDiatonic: true },
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
    selectedStroke: uc.selectedStroke || dc.selectedStroke
  };

  // Fixed coordinate system — SVG viewBox handles scaling
  var CX = 350, CY = 350;
  var OUTER_R = 280, INNER_R = 200, CENTER_R = 120;
  var ANGLE_PER_SEG = 30;
  var DEGREE_R = 25, MINOR_DEGREE_R = 16;

  function svgNS(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function clearSvg() {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  }

  function render() {
    clearSvg();

    svgEl.setAttribute('viewBox', '0 0 700 700');
    svgEl.setAttribute('width', state.size);
    svgEl.setAttribute('height', state.size);

    // --- Segments ---
    PAD_CIRCLE_KEYS.forEach(function(key, index) {
      var startAngle = index * ANGLE_PER_SEG - ANGLE_PER_SEG / 2;
      var endAngle = startAngle + ANGLE_PER_SEG;
      var midAngle = startAngle + ANGLE_PER_SEG / 2;
      var isSelected = state.selectedKeyIndex === index;

      // Major segment
      var majorD = padCircleCreateSegmentPath(CX, CY, INNER_R, OUTER_R, startAngle, endAngle);
      var majorSeg = svgNS('path');
      majorSeg.setAttribute('d', majorD);
      majorSeg.setAttribute('fill', colors.majorSegment);
      majorSeg.setAttribute('stroke', isSelected && state.selectedType === 'major' ? colors.selectedStroke : 'white');
      majorSeg.setAttribute('stroke-width', isSelected && state.selectedType === 'major' ? '3' : '2');
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

      // Major text
      var majorPos = padCirclePolarToCartesian(CX, CY, (OUTER_R + INNER_R) / 2, midAngle);
      var majorText = svgNS('text');
      majorText.setAttribute('x', majorPos.x);
      majorText.setAttribute('y', majorPos.y);
      majorText.setAttribute('text-anchor', 'middle');
      majorText.setAttribute('dominant-baseline', 'middle');
      majorText.setAttribute('font-size', '22');
      majorText.setAttribute('font-weight', '600');
      majorText.setAttribute('fill', 'white');
      majorText.setAttribute('pointer-events', 'none');
      majorText.setAttribute('style', 'text-rendering: optimizeLegibility;');
      majorText.textContent = key.major;
      svgEl.appendChild(majorText);

      // Minor segment
      var minorD = padCircleCreateSegmentPath(CX, CY, CENTER_R, INNER_R, startAngle, endAngle);
      var minorSeg = svgNS('path');
      minorSeg.setAttribute('d', minorD);
      minorSeg.setAttribute('fill', colors.minorSegment);
      minorSeg.setAttribute('stroke', isSelected && state.selectedType === 'minor' ? colors.selectedStroke : 'white');
      minorSeg.setAttribute('stroke-width', isSelected && state.selectedType === 'minor' ? '3' : '2');
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

      // Minor text
      var minorPos = padCirclePolarToCartesian(CX, CY, (INNER_R + CENTER_R) / 2, midAngle);
      var minorText = svgNS('text');
      minorText.setAttribute('x', minorPos.x);
      minorText.setAttribute('y', minorPos.y);
      minorText.setAttribute('text-anchor', 'middle');
      minorText.setAttribute('dominant-baseline', 'middle');
      minorText.setAttribute('font-size', '16');
      minorText.setAttribute('font-weight', '500');
      minorText.setAttribute('fill', '#1b5e20');
      minorText.setAttribute('pointer-events', 'none');
      minorText.setAttribute('style', 'text-rendering: optimizeLegibility;');
      minorText.textContent = key.minor;
      svgEl.appendChild(minorText);
    });

    // --- Center circle ---
    var centerCircle = svgNS('circle');
    centerCircle.setAttribute('cx', CX);
    centerCircle.setAttribute('cy', CY);
    centerCircle.setAttribute('r', CENTER_R);
    centerCircle.setAttribute('fill', 'white');
    svgEl.appendChild(centerCircle);

    // --- Title ---
    if (state.showTitle) {
      var title1 = svgNS('text');
      title1.setAttribute('x', CX);
      title1.setAttribute('y', CY - 50);
      title1.setAttribute('text-anchor', 'middle');
      title1.setAttribute('dominant-baseline', 'middle');
      title1.setAttribute('font-size', '24');
      title1.setAttribute('font-weight', '700');
      title1.setAttribute('fill', '#2e7d32');
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
      title2.setAttribute('fill', '#66bb6a');
      title2.setAttribute('style', 'text-rendering: optimizeLegibility;');
      title2.textContent = 'Circle of Fifths';
      svgEl.appendChild(title2);
    }

    // --- Scale mode buttons (minor only) ---
    if (state.showScaleModeButtons && state.selectedType === 'minor') {
      var isNatural = state.scaleMode === 'natural';
      var isHarmonic = state.scaleMode === 'harmonic';
      var isMelodic = state.scaleMode === 'melodic';

      var btnW = 90, btnH = 36, btnGap = 8, btnRx = 6;
      var totalW = btnW * 3 + btnGap * 2;
      var btnY = CY + 2;
      var btnStartX = CX - totalW / 2;

      var modeButtons = [
        { label: 'Natural', active: isNatural, mode: 'natural', color: '#66bb6a' },
        { label: 'Harmonic', active: isHarmonic, mode: 'harmonic', color: '#1b5e20' },
        { label: 'Melodic', active: isMelodic, mode: 'melodic', color: '#43a047' }
      ];

      modeButtons.forEach(function(btn, i) {
        var bx = btnStartX + i * (btnW + btnGap);

        var rect = svgNS('rect');
        rect.setAttribute('x', bx);
        rect.setAttribute('y', btnY);
        rect.setAttribute('width', btnW);
        rect.setAttribute('height', btnH);
        rect.setAttribute('rx', btnRx);
        rect.setAttribute('fill', btn.active ? btn.color : 'white');
        rect.setAttribute('stroke', btn.color);
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('cursor', 'pointer');
        rect.addEventListener('click', (function(mode) {
          return function() {
            state.scaleMode = mode;
            render();
            if (state.onScaleModeChange) state.onScaleModeChange(state.scaleMode);
          };
        })(btn.mode));
        svgEl.appendChild(rect);

        var text = svgNS('text');
        text.setAttribute('x', bx + btnW / 2);
        text.setAttribute('y', btnY + btnH / 2 + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', btn.active ? 'white' : btn.color);
        text.setAttribute('pointer-events', 'none');
        text.setAttribute('style', 'text-rendering: optimizeLegibility;');
        text.textContent = btn.label;
        svgEl.appendChild(text);
      });
    }

    // --- Degree circles ---
    if (state.showDegrees && state.selectedKeyIndex !== null && state.selectedType) {
      var selectedIndex = state.selectedKeyIndex;
      var type = state.selectedType;
      var degrees = type === 'major' ? PAD_CIRCLE_MAJOR_DEGREES : PAD_CIRCLE_MINOR_DEGREES;

      degrees.forEach(function(degree) {
        var displayOffset = degree.circleOffset !== undefined ? degree.circleOffset : degree.offset;
        var targetIndex = (selectedIndex + displayOffset + 12) % 12;

        if (type === 'major' && !degree.isMajor) {
          targetIndex = (targetIndex + 9) % 12;
        }

        var segStart = targetIndex * ANGLE_PER_SEG - ANGLE_PER_SEG / 2;
        var midAngle = segStart + ANGLE_PER_SEG / 2;

        var displayR;
        if (degree.isSubstitute || degree.isMajor) {
          displayR = OUTER_R + 30;
        } else {
          displayR = CENTER_R + 3;
        }

        var pos = padCirclePolarToCartesian(CX, CY, displayR, midAngle);

        var degGroup = svgNS('g');

        var circle = svgNS('circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', degree.isMajor ? pos.y : pos.y + 15);
        circle.setAttribute('r', degree.isMajor ? DEGREE_R : MINOR_DEGREE_R);
        circle.setAttribute('fill', colors[degree.colorType]);
        circle.setAttribute('fill-opacity', degree.isMajor ? '1' : '0.8');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        degGroup.appendChild(circle);

        var text = svgNS('text');
        text.setAttribute('x', pos.x);
        text.setAttribute('y', degree.isMajor ? pos.y + 5 : pos.y + 15 + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', degree.isMajor ? '14' : '10');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', (degree.isSubstitute || degree.colorType === 'dominant') ? 'white' : '#333');
        text.setAttribute('pointer-events', 'none');
        text.setAttribute('style', 'text-rendering: optimizeLegibility;');
        text.textContent = degree.roman;
        degGroup.appendChild(text);

        svgEl.appendChild(degGroup);
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
