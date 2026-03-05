// ========================================
// PAD-CORE — SVG Rendering (Pure Functions)
// All rendering functions produce SVG elements without reading global state.
// ========================================

// Node.js: load dependencies into global scope (browser: already global via script tag)
if (typeof require !== 'undefined' && typeof GRID === 'undefined') {
  Object.assign(globalThis, require('./data.js'));
  Object.assign(globalThis, require('./theory.js'));
}

// ======== GRID MATH ========

var PAD = GRID;

function padBaseMidi(octaveShift) {
  return PAD.BASE_MIDI + (octaveShift || 0) * 12;
}

function padMidiNote(row, col, octaveShift) {
  return padBaseMidi(octaveShift) + row * PAD.ROW_INTERVAL + col * PAD.COL_INTERVAL;
}

function padNoteName(midi) {
  return NOTE_NAMES_SHARP[padPitchClass(midi)] + (Math.floor(midi / 12) - 2);
}

// ======== DEGREE NAME ========

function padDegreeName(interval, qualityPCS) {
  switch (interval) {
    case 0: return 'R';
    case 1: return 'b9';
    case 2: return '9';
    case 3:
      if (qualityPCS && qualityPCS.includes(4)) return '#9';
      return 'm3';
    case 4: return '3';
    case 5:
      if (qualityPCS && !qualityPCS.includes(3) && !qualityPCS.includes(4)) return '4';
      return '11';
    case 6:
      if (qualityPCS && qualityPCS.includes(6)) return 'b5';
      return '#11';
    case 7: return '5';
    case 8:
      if (qualityPCS && qualityPCS.includes(8)) return '#5';
      return 'b13';
    case 9:
      if (qualityPCS && qualityPCS.includes(9) && !qualityPCS.includes(10) && !qualityPCS.includes(11)) return '6';
      return '13';
    case 10: return 'b7';
    case 11: return '\u25B37';
  }
  return '';
}

// ======== SVG VIEWBOX ========

function padGridViewBox(cols, rows, padSize, padGap, margin) {
  if (cols === undefined) { cols = PAD.COLS; rows = PAD.ROWS; padSize = PAD.PAD_SIZE; padGap = PAD.PAD_GAP; margin = PAD.MARGIN; }
  var w = margin * 2 + cols * (padSize + padGap) - padGap;
  var h = margin * 2 + rows * (padSize + padGap) - padGap;
  return { w: w, h: h };
}

// ======== COMPUTE VOICING BOXES ========

function padComputeBoxes(offsets, targetPC, octaveShift, maxRS, maxCS) {
  var boxes = [];
  var bm = padBaseMidi(octaveShift);
  for (var row = 0; row < PAD.ROWS; row++) {
    for (var col = 0; col < PAD.COLS; col++) {
      var midi = padMidiNote(row, col, octaveShift);
      if (padPitchClass(midi) !== targetPC) continue;
      var allVP = padCalcAllVoicingPositions(row, col, offsets, PAD.ROWS, PAD.COLS, bm, PAD.ROW_INTERVAL);
      if (allVP.length === 0) continue;
      var filtered = maxRS ? allVP.filter(function(vp) {
        var rs = vp.maxRow - vp.minRow + 1, cs = vp.maxCol - vp.minCol + 1;
        return rs <= maxRS && cs <= maxCS;
      }) : allVP;
      if (filtered.length === 0) continue;
      boxes.push({ midi: midi, row: row, col: col, alternatives: filtered });
    }
  }
  boxes.sort(function(a, b) { return a.midi - b.midi; });
  return boxes;
}

// ======== RENDER GRID ========

function padRenderGrid(svg, activePCS, rootPC, bassPC, qualityPCS, octaveShift, selectedBox) {
  var selMidi = selectedBox ? new Set(selectedBox.midiNotes) : null;
  var S = PAD.PAD_SIZE, G = PAD.PAD_GAP, M = PAD.MARGIN;

  for (var row = 0; row < PAD.ROWS; row++) {
    for (var col = 0; col < PAD.COLS; col++) {
      var midi = padMidiNote(row, col, octaveShift);
      var pc = padPitchClass(midi);
      var x = M + col * (S + G);
      var y = M + (PAD.ROWS - 1 - row) * (S + G);
      var interval = ((pc - rootPC) + 12) % 12;
      var isRoot = pc === rootPC;
      var isBass = bassPC !== null && pc === bassPC && pc !== rootPC;
      var isActive = activePCS.has(pc);

      var isGuide3 = [3, 4].some(function(iv) { return (rootPC + iv) % 12 === pc; }) && isActive && !isRoot;
      var isGuide7 = [10, 11].some(function(iv) { return (rootPC + iv) % 12 === pc; }) && isActive && !isRoot;
      var is6thGuide = qualityPCS && qualityPCS.includes(9) &&
        !qualityPCS.includes(10) && !qualityPCS.includes(11) &&
        (rootPC + 9) % 12 === pc && isActive && !isRoot;
      var isGuide = isGuide3 || isGuide7 || is6thGuide;

      var fill = '#2a2a3e', textColor = '#666';
      if (isRoot && isActive) { fill = '#E69F00'; textColor = '#000'; }
      else if (isBass) { fill = '#ff9800'; textColor = '#000'; }
      else if (isGuide3) { fill = '#009E73'; textColor = '#fff'; }
      else if (isGuide7 || is6thGuide) { fill = '#CC79A7'; textColor = '#fff'; }
      else if (isActive) { fill = '#56B4E9'; textColor = '#000'; }

      var isDimmed = selMidi && !selMidi.has(midi) && fill !== '#2a2a3e';

      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', S); rect.setAttribute('height', S);
      rect.setAttribute('rx', 5); rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)');
      rect.setAttribute('stroke-width', isActive ? 1.5 : 0.5);
      if (isDimmed) rect.setAttribute('opacity', '0.3');
      svg.appendChild(rect);

      var showDegree = rootPC !== null && isActive;
      var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + S / 2);
      text.setAttribute('y', showDegree ? y + 11 : y + S / 2 - 3);
      text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', textColor);
      text.setAttribute('font-size', '8px');
      text.setAttribute('font-weight', showDegree ? '600' : '400');
      text.setAttribute('font-family', 'system-ui, sans-serif');
      text.textContent = NOTE_NAMES_SHARP[pc];
      if (isDimmed) text.setAttribute('opacity', '0.3');
      svg.appendChild(text);

      if (showDegree) {
        var degName = padDegreeName(interval, qualityPCS);
        var degText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        degText.setAttribute('x', x + S / 2);
        degText.setAttribute('y', y + 25);
        degText.setAttribute('text-anchor', 'middle'); degText.setAttribute('dominant-baseline', 'middle');
        degText.setAttribute('fill', textColor);
        degText.setAttribute('font-size', '11px'); degText.setAttribute('font-weight', '700');
        degText.setAttribute('font-family', 'system-ui, sans-serif');
        degText.textContent = degName;
        if (isDimmed) degText.setAttribute('opacity', '0.3');
        svg.appendChild(degText);
      }

      var octText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      octText.setAttribute('x', x + S / 2);
      octText.setAttribute('y', showDegree ? y + 38 : y + S / 2 + 9);
      octText.setAttribute('text-anchor', 'middle'); octText.setAttribute('dominant-baseline', 'middle');
      octText.setAttribute('fill', textColor);
      octText.setAttribute('font-size', '7px'); octText.setAttribute('opacity', isDimmed ? '0.15' : '0.5');
      octText.setAttribute('font-family', 'system-ui, sans-serif');
      octText.textContent = padNoteName(midi);
      svg.appendChild(octText);
    }
  }
}

// ======== DRAW VOICING BOXES ========

function padDrawBoxes(svg, boxes, selectedIdx, cycleIndices, octaveShift, onSelect) {
  var S = PAD.PAD_SIZE, G = PAD.PAD_GAP, M = PAD.MARGIN;
  var hasSelection = selectedIdx !== null;
  var bm = padBaseMidi(octaveShift);

  var lastBoxes = boxes.map(function(b, idx) {
    var altIdx = (cycleIndices && cycleIndices[idx]) || 0;
    var safeIdx = altIdx < b.alternatives.length ? altIdx : 0;
    var currentVP = b.alternatives[safeIdx];
    return {
      rootRow: b.row, rootCol: b.col,
      midiNotes: currentVP.positions.map(function(p) { return bm + p.row * PAD.ROW_INTERVAL + p.col; }).sort(function(a, b2) { return a - b2; }),
      alternatives: b.alternatives,
      currentAlt: safeIdx
    };
  });

  var cycleableSet = new Set();
  boxes.forEach(function(b, idx) { if (b.alternatives.length > 1) cycleableSet.add(idx); });

  boxes.forEach(function(b, idx) {
    var sel = selectedIdx === idx;
    if (hasSelection && !sel) return;

    var safeIdx = lastBoxes[idx].currentAlt;
    var vp = b.alternatives[safeIdx];
    var isCycleable = cycleableSet.has(idx);

    var bx = M + vp.minCol * (S + G) - 3;
    var by = M + (PAD.ROWS - 1 - vp.maxRow) * (S + G) - 3;
    var bw = (vp.maxCol - vp.minCol + 1) * (S + G) - G + 6;
    var bh = (vp.maxRow - vp.minRow + 1) * (S + G) - G + 6;
    var boxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    boxRect.setAttribute('x', bx); boxRect.setAttribute('y', by);
    boxRect.setAttribute('width', bw); boxRect.setAttribute('height', bh);
    boxRect.setAttribute('rx', 6); boxRect.setAttribute('fill', 'none');
    boxRect.setAttribute('stroke', sel ? '#fff' : 'rgba(255,255,255,0.6)');
    boxRect.setAttribute('stroke-width', sel ? 2.5 : 1.5);
    boxRect.setAttribute('stroke-dasharray', '5 3');
    boxRect.setAttribute('opacity', sel ? '1' : '0.7');
    svg.appendChild(boxRect);

    if (sel) {
      vp.positions.forEach(function(pos) {
        var px = M + pos.col * (S + G) - 2;
        var py = M + (PAD.ROWS - 1 - pos.row) * (S + G) - 2;
        var padRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        padRect.setAttribute('x', px); padRect.setAttribute('y', py);
        padRect.setAttribute('width', S + 4); padRect.setAttribute('height', S + 4);
        padRect.setAttribute('rx', 5); padRect.setAttribute('fill', 'none');
        padRect.setAttribute('stroke', '#fff'); padRect.setAttribute('stroke-width', 2);
        svg.appendChild(padRect);
      });
    }

    var bassPos = vp.positions[0];
    var bsz = isCycleable ? 22 : 16;
    var bX = M + bassPos.col * (S + G);
    var bY = M + (PAD.ROWS - 1 - bassPos.row) * (S + G);
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    if (onSelect) g.addEventListener('click', (function(i) { return function() { onSelect(i); }; })(idx));

    var br = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    br.setAttribute('x', bX); br.setAttribute('y', bY);
    br.setAttribute('width', bsz); br.setAttribute('height', bsz);
    br.setAttribute('rx', 3);
    br.setAttribute('fill', sel ? '#000' : '#fff');
    br.setAttribute('opacity', '0.9');
    g.appendChild(br);

    var bt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    bt.setAttribute('x', bX + bsz / 2); bt.setAttribute('y', bY + bsz / 2 + 1);
    bt.setAttribute('text-anchor', 'middle'); bt.setAttribute('dominant-baseline', 'middle');
    bt.setAttribute('fill', sel ? '#fff' : '#000');
    bt.setAttribute('font-weight', '800');
    bt.setAttribute('font-family', 'system-ui, sans-serif');
    var boxLetter = String.fromCharCode(65 + idx);
    if (isCycleable && sel) {
      var box = lastBoxes[idx];
      bt.setAttribute('font-size', '9px');
      bt.textContent = boxLetter + (box.currentAlt + 1) + '/' + box.alternatives.length;
    } else {
      bt.setAttribute('font-size', '11px');
      bt.textContent = boxLetter;
    }
    g.appendChild(bt);
    svg.appendChild(g);
  });

  return lastBoxes;
}

// Conditional exports for Node.js (Vitest) — ignored in browser
if (typeof module !== 'undefined') module.exports = {
  padBaseMidi, padMidiNote, padNoteName,
  padDegreeName, padGridViewBox, padComputeBoxes,
  padRenderGrid, padDrawBoxes,
};
