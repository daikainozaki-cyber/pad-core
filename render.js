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

// ======== FRETBOARD RENDERING (Guitar / Bass) ========

/**
 * Render a fretboard diagram (guitar or bass) into an SVG element.
 * Pure function — all state passed via opts. No global reads.
 *
 * @param {SVGElement} svg - Target SVG element (will be cleared)
 * @param {Object} opts
 *   Required:
 *     tuning:       number[]  - open string MIDI values, high to low
 *     stringNames:  string[]  - string name labels
 *     rootPC:       number    - root pitch class (0-11)
 *   Optional:
 *     pcsSet:       Set       - active pitch classes (default: empty)
 *     bassPC:       number|null - bass note PC
 *     overlayPCS:   Set|null  - overlay scale PCS
 *     overlayCharPCS: Set|null - characteristic notes in overlay
 *     renderState:  Object    - { guide3PCS, guide7PCS, tensionPCS, avoidPCS, omittedPCS }
 *     positionState: Object   - { enabled, alternatives, currentAlt }
 *     selectedFrets: number[] - per-string selected fret (null = not selected)
 *     labelFn:      function(pc, interval) => string  - custom label function
 *     chordMode:    boolean   - true when in chord mode (enables guide/tension coloring)
 *     solo:         boolean   - solo display mode (larger)
 *     width:        number    - diagram width (default: 564)
 *     isMobile:     boolean
 *     isLandscape:  boolean
 *     padRange:     {lo,hi}|null - MIDI range for pad highlight
 *     colors:       Object    - color palette (default: PAD_INST_COLORS)
 *     onFretClick:  function(stringIdx, fret)|null - click callback
 *     ghostForms:   Array|null - alternative voicing forms for ghost dots
 *     currentFretSet: Set|null - current voicing fret keys (stringIdx*100+fret) for ghost exclusion
 */
function padRenderFretboard(svg, opts) {
  var o = opts || {};
  var tuning = o.tuning;
  var strNames = o.stringNames;
  var numStr = tuning.length;
  var rootPC = o.rootPC != null ? o.rootPC : 0;
  var pcsSet = o.pcsSet || new Set();
  var bassPC = o.bassPC != null ? o.bassPC : null;
  var ovlPCS = o.overlayPCS || null;
  var ovlCharPCS = o.overlayCharPCS || null;
  var rs = o.renderState || {};
  var ps = o.positionState || {};
  var selFrets = o.selectedFrets || null;
  var labelFn = o.labelFn || function(pc, iv) { return SCALE_DEGREE_NAMES[iv]; };
  var chordMode = o.chordMode || false;
  var solo = o.solo || false;
  var W = o.width || 564;
  var mobile = o.isMobile || false;
  var landscape = o.isLandscape || false;
  var padRange = o.padRange || null;
  var C = o.colors || PAD_INST_COLORS;
  var onClick = o.onFretClick || null;
  var ghostForms = o.ghostForms || null;
  var curFretSet = o.currentFretSet || null;

  // Derived
  var numFrets = 21;
  var leftM = 16;
  var topM = solo ? 10 : 6;
  var fretW = Math.floor((W - leftM - 12) / numFrets);
  var strH = solo ? (numStr <= 4 ? 28 : 22) : 14;
  var nutX = leftM;
  var maxStrIdx = numStr - 1;
  var H = topM + maxStrIdx * strH + (solo ? 30 : 22);
  var thickFrom = numStr - 2;

  var ivPcsSet = pcsSet.size > 0
    ? new Set(Array.from(pcsSet).map(function(pc) { return ((pc - rootPC) % 12 + 12) % 12; }))
    : null;

  var g3 = rs.guide3PCS || new Set();
  var g7 = rs.guide7PCS || new Set();
  var tp = rs.tensionPCS || new Set();
  var av = rs.avoidPCS || new Set();
  var om = rs.omittedPCS || new Set();
  var posActive = ps.enabled || false;
  var alternatives = ps.alternatives || [];
  var currentAlt = ps.currentAlt || 0;

  var NS = 'http://www.w3.org/2000/svg';

  // Clear
  svg.innerHTML = '';

  // ViewBox
  var vbX = posActive ? -3 : 0;
  svg.setAttribute('viewBox', vbX + ' 0 ' + (W - vbX) + ' ' + H);
  if (mobile || landscape) {
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.style.width = '100%'; svg.style.height = 'auto';
  } else {
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.style.width = ''; svg.style.height = '';
  }

  // --- Nut ---
  var nutLine = document.createElementNS(NS, 'line');
  nutLine.setAttribute('x1', nutX); nutLine.setAttribute('y1', topM);
  nutLine.setAttribute('x2', nutX); nutLine.setAttribute('y2', topM + maxStrIdx * strH);
  nutLine.setAttribute('stroke', '#ccc'); nutLine.setAttribute('stroke-width', 4);
  svg.appendChild(nutLine);

  // --- Fret lines ---
  for (var f = 1; f <= numFrets; f++) {
    var fx = nutX + f * fretW;
    var line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', fx); line.setAttribute('y1', topM);
    line.setAttribute('x2', fx); line.setAttribute('y2', topM + maxStrIdx * strH);
    line.setAttribute('stroke', '#555'); line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
  }

  // --- String lines ---
  for (var s = 0; s < numStr; s++) {
    var sy = topM + s * strH;
    var sLine = document.createElementNS(NS, 'line');
    sLine.setAttribute('x1', nutX); sLine.setAttribute('y1', sy);
    sLine.setAttribute('x2', nutX + numFrets * fretW); sLine.setAttribute('y2', sy);
    sLine.setAttribute('stroke', '#888');
    sLine.setAttribute('stroke-width', s >= thickFrom ? 2 : (numStr <= 4 ? 1.5 : 1));
    svg.appendChild(sLine);
  }

  // --- Fret markers ---
  var markerFrets = [3, 5, 7, 9, 15, 17, 19, 21];
  var doubleMarker = [12];
  var midStr = maxStrIdx / 2;
  markerFrets.forEach(function(mf) {
    var mx = nutX + (mf - 0.5) * fretW;
    var dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', mx); dot.setAttribute('cy', topM + midStr * strH);
    dot.setAttribute('r', 2.5); dot.setAttribute('fill', '#444');
    svg.appendChild(dot);
  });
  doubleMarker.forEach(function(mf) {
    var mx = nutX + (mf - 0.5) * fretW;
    var offsets = numStr <= 4
      ? [topM + 0.5 * strH, topM + (maxStrIdx - 0.5) * strH]
      : [topM + 1.5 * strH, topM + 3.5 * strH];
    offsets.forEach(function(dy) {
      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', mx); dot.setAttribute('cy', dy);
      dot.setAttribute('r', 2.5); dot.setAttribute('fill', '#444');
      svg.appendChild(dot);
    });
  });

  // --- String names (with open-string colored circle indicator) ---
  for (var sn = 0; sn < numStr; sn++) {
    var snY = topM + sn * strH;
    var isOpen = posActive && selFrets && selFrets[sn] === 0;
    if (isOpen) {
      var openPC = tuning[sn] % 12;
      var dotColor = openPC === rootPC ? C.root
        : g3.has(openPC) ? C.guide3
        : g7.has(openPC) ? C.guide7
        : tp.has(openPC) ? C.tension
        : C.chord;
      var circ = document.createElementNS(NS, 'circle');
      circ.setAttribute('cx', nutX - 9); circ.setAttribute('cy', snY);
      circ.setAttribute('r', solo ? 9 : 7);
      circ.setAttribute('fill', dotColor);
      svg.appendChild(circ);
    }
    var nameT = document.createElementNS(NS, 'text');
    nameT.setAttribute('x', nutX - 9); nameT.setAttribute('y', snY + 4);
    nameT.setAttribute('text-anchor', 'middle');
    nameT.setAttribute('font-size', '10px');
    nameT.setAttribute('fill', isOpen ? '#fff' : '#aaa');
    nameT.setAttribute('font-weight', '700');
    nameT.textContent = strNames[sn];
    svg.appendChild(nameT);
  }

  // --- Fret numbers ---
  for (var fn = 1; fn <= numFrets; fn++) {
    var fnX = nutX + (fn - 0.5) * fretW;
    var fnT = document.createElementNS(NS, 'text');
    fnT.setAttribute('x', fnX); fnT.setAttribute('y', topM + maxStrIdx * strH + 14);
    fnT.setAttribute('text-anchor', 'middle');
    fnT.setAttribute('font-size', '8px'); fnT.setAttribute('fill', '#888');
    fnT.textContent = fn;
    svg.appendChild(fnT);
  }

  // --- Pad range highlight ---
  if (padRange) {
    for (var pr = 0; pr < numStr; pr++) {
      var prY = topM + pr * strH;
      var minF = null, maxF = null;
      for (var pf = 0; pf <= numFrets; pf++) {
        var midi = tuning[pr] + pf;
        if (midi >= padRange.lo && midi <= padRange.hi) {
          if (minF === null) minF = pf;
          maxF = pf;
        }
      }
      if (minF !== null) {
        var rx1 = minF === 0 ? 0 : nutX + (minF - 1) * fretW;
        var rx2 = nutX + maxF * fretW;
        var rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', rx1);
        rect.setAttribute('y', prY - strH / 2);
        rect.setAttribute('width', rx2 - rx1);
        rect.setAttribute('height', strH);
        rect.setAttribute('fill', C.padRange);
        rect.setAttribute('opacity', '0.1');
        svg.appendChild(rect);
      }
    }
  }

  // --- Note dots ---
  for (var ds = 0; ds < numStr; ds++) {
    var dsOpenPC = tuning[ds] % 12;
    var dsY = topM + ds * strH;
    for (var df = 0; df <= numFrets; df++) {
      var dpc = (dsOpenPC + df) % 12;
      var isBass = bassPC !== null && dpc === bassPC;
      var isOvl = !pcsSet.has(dpc) && !isBass && ovlPCS && ovlPCS.has(dpc);
      if (!pcsSet.has(dpc) && !isBass && !isOvl && !om.has(dpc)) continue;
      var isRoot = dpc === rootPC && !om.has(dpc);
      var isOmitted = om.has(dpc);
      var isGuide3 = chordMode && g3.has(dpc) && !isRoot && !tp.has(dpc);
      var isGuide7 = chordMode && g7.has(dpc) && !isRoot && !tp.has(dpc);
      var isTension = chordMode && tp.has(dpc) && !isRoot && !isGuide3 && !isGuide7;
      var isAvoid = chordMode && av.has(dpc) && !isRoot;
      var dfx = df === 0 ? nutX - 2 : nutX + (df - 0.5) * fretW;
      var dr = df === 0 ? (solo ? 7 : 5) : (solo ? 10 : 7);

      // Position mode: hide frets not in selected form
      if (posActive && selFrets && selFrets[ds] !== df) continue;
      // Position mode: skip fret-0 dot — string name indicator replaces it
      if (posActive && df === 0 && selFrets && selFrets[ds] === 0) continue;

      var ndot = document.createElementNS(NS, 'circle');
      ndot.setAttribute('cx', dfx); ndot.setAttribute('cy', dsY);
      ndot.setAttribute('r', dr);
      var dColor, dTextColor;
      if (isOvl) {
        var isChar = ovlCharPCS && ovlCharPCS.has(dpc);
        ndot.setAttribute('fill', isChar ? C.overlayChar : C.overlay);
        ndot.setAttribute('opacity', isChar ? '0.5' : '0.4');
        dTextColor = C.overlayText;
      } else if (isOmitted) {
        dColor = C.omitted; dTextColor = '#fff';
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.5');
      } else if (isRoot) {
        dColor = C.root; dTextColor = C.rootText;
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.9');
      } else if (isBass) {
        dColor = C.bass; dTextColor = C.bassText;
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.9');
      } else if (isGuide3) {
        dColor = C.guide3; dTextColor = '#fff';
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.9');
      } else if (isGuide7) {
        dColor = C.guide7; dTextColor = '#fff';
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.9');
      } else if (isAvoid) {
        dColor = C.avoid; dTextColor = '#fff';
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.9');
      } else if (isTension) {
        dColor = C.tension; dTextColor = '#fff';
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.9');
      } else {
        dColor = C.chord; dTextColor = '#000';
        ndot.setAttribute('fill', dColor); ndot.setAttribute('opacity', '0.9');
      }
      svg.appendChild(ndot);

      // Label inside dot
      if (df > 0) {
        var div = ((dpc - rootPC) + 12) % 12;
        var labelText = labelFn(dpc, div);
        var lt = document.createElementNS(NS, 'text');
        lt.setAttribute('x', dfx); lt.setAttribute('y', dsY + (solo ? 4 : 3));
        lt.setAttribute('text-anchor', 'middle');
        var lfs = solo ? (labelText.length > 2 ? '7px' : '9px') : (labelText.length > 2 ? '5px' : '6px');
        lt.setAttribute('font-size', lfs);
        lt.setAttribute('fill', dTextColor);
        lt.setAttribute('font-weight', '700');
        lt.textContent = labelText;
        svg.appendChild(lt);
      }
    }
  }

  // --- Ghost alternative forms ---
  if (ghostForms && ghostForms.length > 0 && curFretSet) {
    var altRendered = new Set();
    ghostForms.forEach(function(form) {
      for (var gs = 0; gs < numStr; gs++) {
        if (form.frets[gs] === null) continue;
        var gKey = gs * 100 + form.frets[gs];
        if (curFretSet.has(gKey) || altRendered.has(gKey)) continue;
        altRendered.add(gKey);
        var gf = form.frets[gs];
        var gsy = topM + gs * strH;
        var gfx = gf === 0 ? nutX - 2 : nutX + (gf - 0.5) * fretW;
        var gpc = (tuning[gs] % 12 + gf) % 12;
        var gColor = gpc === rootPC ? C.root
          : g3.has(gpc) ? C.guide3
          : g7.has(gpc) ? C.guide7
          : tp.has(gpc) ? C.tension
          : C.chord;
        var gr = solo ? 7 : 5;
        var gDot = document.createElementNS(NS, 'circle');
        gDot.setAttribute('cx', gfx); gDot.setAttribute('cy', gsy);
        gDot.setAttribute('r', gr);
        gDot.setAttribute('fill', gColor);
        gDot.setAttribute('opacity', '0.25');
        svg.appendChild(gDot);
      }
    });
  }

  // --- Selected fret markers (white ring with label) ---
  if (selFrets) {
    for (var ss = 0; ss < numStr; ss++) {
      if (selFrets[ss] === null) continue;
      var sf = selFrets[ss];
      if (sf === 0 && posActive) continue; // open string handled by string name indicator
      var ssY = topM + ss * strH;
      var sfx = sf === 0 ? nutX - 2 : nutX + (sf - 0.5) * fretW;
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', sfx); ring.setAttribute('cy', ssY);
      ring.setAttribute('r', solo ? 12 : 9);
      ring.setAttribute('fill', '#fff'); ring.setAttribute('opacity', '0.95');
      ring.setAttribute('stroke', '#333'); ring.setAttribute('stroke-width', 2);
      svg.appendChild(ring);
      var spc = (tuning[ss] % 12 + sf) % 12;
      var siv = ((spc - rootPC) + 12) % 12;
      var sLabel = labelFn(spc, siv);
      var slt = document.createElementNS(NS, 'text');
      slt.setAttribute('x', sfx); slt.setAttribute('y', ssY + (solo ? 5 : 4));
      slt.setAttribute('text-anchor', 'middle');
      var slfs = solo ? (sLabel.length > 2 ? '8px' : '10px') : (sLabel.length > 2 ? '6px' : '8px');
      slt.setAttribute('font-size', slfs); slt.setAttribute('fill', '#333');
      slt.setAttribute('font-weight', '700');
      slt.textContent = sLabel;
      svg.appendChild(slt);
    }
  }

  // --- Mute X marks (position mode) ---
  if (posActive && alternatives.length > 0) {
    var form = alternatives[currentAlt < alternatives.length ? currentAlt : 0];
    if (form && form.frets) {
      for (var ms = 0; ms < numStr; ms++) {
        if (form.frets[ms] !== null) continue;
        var msY = topM + ms * strH;
        var mx = nutX + fretW * 0.5;
        var sz = solo ? 6 : 4.5;
        var xl1 = document.createElementNS(NS, 'line');
        xl1.setAttribute('x1', mx - sz); xl1.setAttribute('y1', msY - sz);
        xl1.setAttribute('x2', mx + sz); xl1.setAttribute('y2', msY + sz);
        xl1.setAttribute('stroke', C.mute); xl1.setAttribute('stroke-width', 3);
        svg.appendChild(xl1);
        var xl2 = document.createElementNS(NS, 'line');
        xl2.setAttribute('x1', mx + sz); xl2.setAttribute('y1', msY - sz);
        xl2.setAttribute('x2', mx - sz); xl2.setAttribute('y2', msY + sz);
        xl2.setAttribute('stroke', C.mute); xl2.setAttribute('stroke-width', 3);
        svg.appendChild(xl2);
      }
    }
  }

  // --- Clickable hit areas ---
  if (onClick) {
    for (var hs = 0; hs < numStr; hs++) {
      var hsY = topM + hs * strH - strH / 2;
      for (var hf = 0; hf <= numFrets; hf++) {
        var hfx = hf === 0 ? 0 : nutX + (hf - 1) * fretW;
        var hfw = hf === 0 ? nutX : fretW;
        var hit = document.createElementNS(NS, 'rect');
        hit.setAttribute('x', hfx); hit.setAttribute('y', hsY);
        hit.setAttribute('width', hfw); hit.setAttribute('height', strH);
        hit.setAttribute('fill', 'transparent');
        hit.setAttribute('cursor', 'pointer');
        hit.dataset.string = hs;
        hit.dataset.fret = hf;
        hit.addEventListener('click', function() {
          onClick(parseInt(this.dataset.string), parseInt(this.dataset.fret));
        });
        svg.appendChild(hit);
      }
    }
  }
}

// Conditional exports for Node.js (Vitest) — ignored in browser
if (typeof module !== 'undefined') module.exports = {
  padBaseMidi, padMidiNote, padNoteName,
  padDegreeName, padGridViewBox, padComputeBoxes,
  padRenderGrid, padDrawBoxes, padRenderFretboard,
};
