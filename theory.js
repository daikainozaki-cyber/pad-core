// ========================================
// PAD-CORE — Theory Calculations (Pure Functions)
// All functions are pure: no global state reads.
// Required state is passed as arguments.
// ========================================

// Node.js: load data.js exports into global scope (browser: already global via script tag)
if (typeof require !== 'undefined' && typeof SCALES === 'undefined') {
  Object.assign(globalThis, require('./data.js'));
}

// ======== BASIC PITCH MATH ========

function padPitchClass(midi) {
  return ((midi % 12) + 12) % 12;
}

// ======== ENHARMONIC SPELLING ========

function padGetParentMajorKey(scaleIdx, key) {
  var scale = SCALES[scaleIdx];
  if (scale.cat === '○') {
    var DIATONIC = [0, 2, 4, 5, 7, 9, 11];
    return (key - DIATONIC[scale.num - 1] + 12) % 12;
  }
  if (scale.cat === '■') {
    var HM = [0, 2, 3, 5, 7, 8, 11];
    var minorRoot = (key - HM[scale.num - 1] + 12) % 12;
    return (minorRoot + 3) % 12;
  }
  if (scale.cat === '◆') {
    var MM = [0, 2, 3, 5, 7, 9, 11];
    var minorRoot2 = (key - MM[scale.num - 1] + 12) % 12;
    return (minorRoot2 + 3) % 12;
  }
  // Non-modal: minor-like (has b3 without natural 3) → relative major
  if (scale.pcs.includes(3) && !scale.pcs.includes(4)) {
    return (key + 3) % 12;
  }
  return key;
}

function padPcName(pc, scaleIdx, key) {
  var parentKey = padGetParentMajorKey(scaleIdx, key);
  return KEY_SPELLINGS[parentKey][pc];
}

function padNoteNameForKey(pc, key) {
  return KEY_SPELLINGS[padGetParentMajorKey(0, key)][pc];
}

// ======== CIRCLE OF FIFTHS ========

function padFifthsDistance(key1, key2) {
  var d = ((key2 - key1) * 7 + 144) % 12;
  return Math.min(d, 12 - d);
}

// ======== TENSION APPLICATION ========

function padApplyTension(basePCS, mods) {
  var pcs = [].concat(basePCS);
  if (mods.replace3 !== undefined) {
    pcs = pcs.filter(function(p) { return p !== 3 && p !== 4; });
    if (!pcs.includes(mods.replace3)) pcs.push(mods.replace3);
  }
  if (mods.sharp5) {
    var i = pcs.indexOf(7);
    if (i >= 0) pcs[i] = 8;
    else if (!pcs.includes(8)) pcs.push(8);
  }
  if (mods.flat5) {
    var j = pcs.indexOf(7);
    if (j >= 0) pcs[j] = 6;
    else if (!pcs.includes(6)) pcs.push(6);
  }
  if (mods.add) {
    for (var k = 0; k < mods.add.length; k++) {
      var addPC = mods.add[k];
      if (!pcs.some(function(p) { return p % 12 === addPC; })) pcs.push(addPC + 12);
    }
  }
  if (mods.omit3) { pcs = pcs.filter(function(p) { return p !== 3 && p !== 4; }); }
  if (mods.omit5) { pcs = pcs.filter(function(p) { return p !== 6 && p !== 7 && p !== 8; }); }
  return pcs.sort(function(a, b) { return a - b; });
}

// ======== VOICING CALCULATION ========

function padCalcVoicingOffsets(chordPCS, inversion, drop) {
  var voiced = [].concat(chordPCS).sort(function(a, b) { return a - b; });
  for (var i = 0; i < inversion && i < voiced.length; i++) {
    voiced.push(voiced.shift() + 12);
  }
  if (drop === 'drop2' && voiced.length >= 4) {
    voiced[voiced.length - 2] -= 12;
    voiced.sort(function(a, b) { return a - b; });
  } else if (drop === 'drop3' && voiced.length >= 4) {
    voiced[voiced.length - 3] -= 12;
    voiced.sort(function(a, b) { return a - b; });
  }
  var bassInterval = voiced[0];
  var minVal = voiced[0];
  var offsets = voiced.map(function(v) { return v - minVal; });
  return { offsets: offsets, bassInterval: bassInterval, voiced: voiced };
}

function padGetBassCase(bassPC, rootPC, chordPCS) {
  var bassIv = ((bassPC - rootPC) % 12 + 12) % 12;
  var sorted = Array.from(new Set(chordPCS.map(function(iv) { return iv % 12; }))).sort(function(a, b) { return a - b; });
  var idx = sorted.indexOf(bassIv);
  return { isChordTone: idx >= 0, inversionIndex: idx >= 0 ? idx : null };
}

function padApplyOnChordBass(voiced, rootPC, bassPC) {
  var bassIv = ((bassPC - rootPC) % 12 + 12) % 12;
  var lowestPC = ((voiced[0] % 12) + 12) % 12;
  if (lowestPC === bassIv) return voiced;
  var bassVal = bassIv;
  while (bassVal >= voiced[0]) bassVal -= 12;
  return [bassVal].concat(voiced).sort(function(a, b) { return a - b; });
}

function padGetShellIntervals(qualityPCS, shellMode, extension, fullPCS) {
  var thirdIv = null, seventhIv = null;
  if (qualityPCS) {
    if (qualityPCS.includes(4)) thirdIv = 4;
    else if (qualityPCS.includes(3)) thirdIv = 3;
    if (qualityPCS.includes(11)) seventhIv = 11;
    else if (qualityPCS.includes(10)) seventhIv = 10;
    else if (qualityPCS.includes(9) && !qualityPCS.includes(10) && !qualityPCS.includes(11)) {
      seventhIv = 9;
    }
  }
  if (thirdIv === null || seventhIv === null) return null;
  var intervals = [0, thirdIv, seventhIv];
  if (fullPCS) {
    fullPCS.filter(function(iv) { return iv >= 12; }).forEach(function(iv) {
      if (!intervals.includes(iv)) intervals.push(iv);
    });
  }
  if (extension > 0 && fullPCS) {
    var shellSet = new Set(intervals.map(function(iv) { return iv % 12; }));
    var extras = fullPCS.filter(function(iv) { return !shellSet.has(iv); }).sort(function(a, b) {
      var at = a >= 12 ? 0 : 1;
      var bt = b >= 12 ? 0 : 1;
      if (at !== bt) return at - bt;
      return a - b;
    });
    var extCount = Math.min(extension, extras.length);
    for (var i = 0; i < extCount; i++) intervals.push(extras[i]);
  }
  if (shellMode === '173') {
    intervals = intervals.map(function(iv) { return iv === thirdIv ? iv + 12 : iv; });
  }
  intervals.sort(function(a, b) { return a - b; });
  return intervals;
}

// ======== VOICING POSITION SEARCH ========

function padCalcAllVoicingPositions(bassRow, bassCol, offsets, gridRows, gridCols, bm, rowInterval, maxResults) {
  if (maxResults === undefined) maxResults = 10;
  var bassMidi = bm + bassRow * rowInterval + bassCol;
  var candidates = offsets.slice(1).map(function(offset) {
    var targetMidi = bassMidi + offset;
    var positions = [];
    for (var r = 0; r < gridRows; r++) {
      var c = targetMidi - bm - r * rowInterval;
      if (c >= 0 && c < gridCols) positions.push({ row: r, col: c });
    }
    return positions;
  });
  if (candidates.some(function(c) { return c.length === 0; })) return [];
  var bassPos = { row: bassRow, col: bassCol };
  var results = [];
  function search(idx, chosen) {
    if (idx === candidates.length) {
      var all = [bassPos].concat(chosen);
      var minR = Math.min.apply(null, all.map(function(p) { return p.row; }));
      var maxR = Math.max.apply(null, all.map(function(p) { return p.row; }));
      var minC = Math.min.apply(null, all.map(function(p) { return p.col; }));
      var maxC = Math.max.apply(null, all.map(function(p) { return p.col; }));
      var rowSpan = maxR - minR + 1, colSpan = maxC - minC + 1;
      if (rowSpan > 5 || colSpan > 6) return;
      var maxDim = Math.max(rowSpan, colSpan);
      var area = rowSpan * colSpan;
      results.push({ positions: all, minRow: minR, maxRow: maxR, minCol: minC, maxCol: maxC, maxDim: maxDim, area: area });
      return;
    }
    for (var p = 0; p < candidates[idx].length; p++) search(idx + 1, chosen.concat([candidates[idx][p]]));
  }
  search(0, []);
  results.sort(function(a, b) { return a.maxDim - b.maxDim || a.area - b.area; });
  return results.slice(0, maxResults);
}

// ======== CHORD CONTEXT KEY ========

function padChordContextKey(root, scaleIdx, key) {
  var scale = SCALES[scaleIdx];
  var rootIv = ((root - key) % 12 + 12) % 12;
  if (scale.pcs.includes(rootIv)) {
    return padGetParentMajorKey(scaleIdx, key);
  }
  return root;
}

// ======== CHORD NAME GENERATION ========

function padGetBuilderChordName(root, quality, tension, bass, scaleIdx, key) {
  if (root === null) return '';
  var rootKey = padChordContextKey(root, scaleIdx, key);
  var name = KEY_SPELLINGS[rootKey][root];
  if (quality) name += quality.name;
  if (tension) {
    var tl = tension.label.replace(/\)\n\(/g, ',').replace(/\n/g, '');
    var has7th = quality && (
      quality.pcs.includes(10) || quality.pcs.includes(11) ||
      (quality.pcs.includes(9) && quality.pcs.includes(6))
    );
    if (has7th) {
      if (tl === 'b5') {
        tl = '#11';
      } else if (tl.indexOf('b5(') === 0 || tl.indexOf('b5,') === 0) {
        var inner = tl.slice(2).replace(/[()]/g, '');
        var parts = inner.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        parts.push('#11');
        var ORDER = {'b9':1,'#9':2,'9':3,'11':4,'#11':5,'b13':6,'13':7};
        parts.sort(function(a, b) { return (ORDER[a] || 99) - (ORDER[b] || 99); });
        tl = parts.join(',');
      }
    }
    if (quality && quality.name !== '') {
      if (tl === 'aug') {
        tl = '(#5)';
      } else if (tl.indexOf('aug(') === 0) {
        var inner2 = tl.slice(4, -1);
        var parts2 = inner2.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        parts2.push('#5');
        var ORDER2 = {'#5':0,'b9':1,'#9':2,'9':3,'11':4,'#11':5,'b13':6,'13':7};
        parts2.sort(function(a, b) { return (ORDER2[a] || 99) - (ORDER2[b] || 99); });
        tl = '(' + parts2.join(',') + ')';
      }
    }
    var noWrap = tl.indexOf('(') === 0 || tl.indexOf('sus') === 0 || tl.indexOf('aug') === 0 ||
                 tl.indexOf('add') === 0 || tl.indexOf('b5') === 0 || tl.indexOf('6') === 0;
    if (noWrap) {
      name += tl;
    } else {
      name += '(' + tl + ')';
    }
  }
  if (bass !== null) {
    name += '/' + KEY_SPELLINGS[rootKey][bass];
  }
  return name;
}

// ======== DIATONIC CHORDS (Triads & Tetrads) ========

function padGetDiatonicTetrads(scalePCS, key, noteCount) {
  if (scalePCS.length !== 7) return [];
  if (noteCount === undefined) noteCount = 4;
  var ROMAN = ['I','II','III','IV','V','VI','VII'];
  var tetrads = [];
  for (var i = 0; i < 7; i++) {
    var rootIv = scalePCS[i];
    var i3 = ((scalePCS[(i + 2) % 7] - rootIv) + 12) % 12;
    var i5 = ((scalePCS[(i + 4) % 7] - rootIv) + 12) % 12;
    var i7 = ((scalePCS[(i + 6) % 7] - rootIv) + 12) % 12;

    var pcs, quality;
    if (noteCount === 3) {
      pcs = [0, i3, i5];
      quality = null;
      for (var r = 0; r < BUILDER_QUALITIES.length; r++) {
        for (var c = 0; c < BUILDER_QUALITIES[r].length; c++) {
          var q = BUILDER_QUALITIES[r][c];
          if (q && q.pcs.length === 3 &&
              q.pcs[1] === i3 && q.pcs[2] === i5) {
            quality = q; break;
          }
        }
        if (quality) break;
      }
      if (!quality) quality = {name:'?', label:'?', pcs: pcs};
    } else {
      pcs = [0, i3, i5, i7];
      quality = null;
      for (var r = 0; r < BUILDER_QUALITIES.length; r++) {
        for (var c = 0; c < BUILDER_QUALITIES[r].length; c++) {
          var q = BUILDER_QUALITIES[r][c];
          if (q && q.pcs.length === 4 &&
              q.pcs[1] === i3 && q.pcs[2] === i5 && q.pcs[3] === i7) {
            quality = q; break;
          }
        }
        if (quality) break;
      }
      if (!quality && i3 === 4 && i5 === 8 && i7 === 11) {
        quality = {name:'aug\u25B37', label:'aug\u25B37', pcs:[0,4,8,11]};
      }
      if (!quality) quality = {name:'?', label:'?', pcs: pcs};
    }

    var rootPC = (rootIv + key) % 12;
    var parentKey = padGetParentMajorKey(0, key);
    var chordName = KEY_SPELLINGS[parentKey][rootPC] + quality.name;

    var roman = ROMAN[i];
    var suffix;
    if (noteCount === 3) {
      // Triad roman numerals: same convention as tetrads (upper + suffix)
      switch (quality.name) {
        case '':    suffix = ''; break;              // Major triad
        case 'm':   suffix = 'm'; break;
        case 'dim': suffix = 'dim'; break;
        case 'aug': suffix = '+'; break;
        default:    suffix = ''; break;
      }
    } else {
      switch (quality.name) {
        case '\u25B37': suffix = '\u25B37'; break;
        case '7':       suffix = '7'; break;
        case 'm7':      roman = roman.toLowerCase(); suffix = '7'; break;
        case 'm\u25B37': roman = roman.toLowerCase(); suffix = '\u25B37'; break;
        case 'm7(b5)':  roman = roman.toLowerCase(); suffix = '\u00F87'; break;
        case 'dim7':    roman = roman.toLowerCase(); suffix = '\u00B07'; break;
        case 'aug\u25B37': suffix = '+\u25B37'; break;
        default:        suffix = ''; break;
      }
    }
    var degree = roman + suffix;

    tetrads.push({ rootPC: rootPC, pcs: pcs, quality: quality, chordName: chordName, degree: degree });
  }
  return tetrads;
}

// ======== DIATONIC CHORD DATABASE ========

function _psKeyName(entry) {
  var relMajor = entry.system === '○' ? entry.parentKey : (entry.parentKey + 3) % 12;
  return FLAT_MAJOR_KEYS.has(relMajor) ? NOTE_NAMES_FLAT[entry.parentKey] : NOTE_NAMES_SHARP[entry.parentKey];
}

function _getParentScaleAbsPCS(entry) {
  var scalePCS;
  if (entry.system === '○') scalePCS = SCALES[0].pcs;
  else if (entry.system === 'NM') scalePCS = SCALES[5].pcs;
  else if (entry.system === '■') scalePCS = SCALES[7].pcs;
  else scalePCS = SCALES[14].pcs;
  return new Set(scalePCS.map(function(pc) { return (pc + entry.parentKey) % 12; }));
}

function _psDegreeLabel(degreeNum, quality) {
  var ROMAN = ['I','II','III','IV','V','VI','VII'];
  var roman = ROMAN[degreeNum - 1];
  var name = quality.name;
  if (name.indexOf('m') === 0 || name === 'dim' || name === 'dim7') {
    roman = roman.toLowerCase();
  }
  var suffix = '';
  switch (name) {
    case '\u25B37': suffix = '\u25B37'; break;
    case '7': suffix = '7'; break;
    case 'm7': suffix = '7'; break;
    case 'm\u25B37': suffix = '\u25B37'; break;
    case 'm7(b5)': suffix = '\u00F87'; break;
    case 'dim7': suffix = '\u00B07'; break;
    case 'aug\u25B37': suffix = '+\u25B37'; break;
    default: break;
  }
  return roman + suffix;
}

var DIATONIC_CHORD_DB = (function() {
  var db = {};
  var SYSTEMS = [
    { cat: '○', label: 'Major', baseIdx: 0, scalePCS: SCALES[0].pcs },
    { cat: '■', label: 'Harm.Min', baseIdx: 7, scalePCS: SCALES[7].pcs },
    { cat: '◆', label: 'Mel.Min', baseIdx: 14, scalePCS: SCALES[14].pcs },
  ];
  for (var s = 0; s < SYSTEMS.length; s++) {
    var sys = SYSTEMS[s];
    for (var key = 0; key < 12; key++) {
      var tetrads = padGetDiatonicTetrads(sys.scalePCS, key);
      for (var i = 0; i < tetrads.length; i++) {
        var t = tetrads[i];
        var degreeNum = i + 1;
        if (!db[t.rootPC]) db[t.rootPC] = [];
        db[t.rootPC].push({
          parentKey: key, system: sys.cat, systemLabel: sys.label,
          degreeNum: degreeNum, scaleName: SCALES[sys.baseIdx + i].name,
          scaleIdx: sys.baseIdx + i, rootPC: t.rootPC,
          quality: t.quality, tetradPCS: t.quality.pcs,
        });
        if (sys.cat === '○') {
          db[t.rootPC].push({
            parentKey: (key + 9) % 12, system: 'NM', systemLabel: 'Nat.Min',
            degreeNum: ((degreeNum + 1) % 7) + 1,
            scaleName: SCALES[i].name, scaleIdx: i, rootPC: t.rootPC,
            quality: t.quality, tetradPCS: t.quality.pcs,
          });
        }
      }
    }
  }
  return db;
})();

// ======== PARENT SCALE REVERSE LOOKUP ========

function padFindParentScales(rootPC, chordIntervals, currentKey) {
  var entries = DIATONIC_CHORD_DB[rootPC];
  if (!entries) return [];
  var results = [];
  var strictKeys = new Set();

  var isMaj6 = chordIntervals.has(4) && chordIntervals.has(9) &&
    !chordIntervals.has(10) && !chordIntervals.has(11);
  var flat7AbsPC = (rootPC + 10) % 12;

  for (var e = 0; e < entries.length; e++) {
    var entry = entries[e];
    var scaleAbsPCS = _getParentScaleAbsPCS(entry);
    var allIn = true;
    var iter = chordIntervals.values();
    var next = iter.next();
    while (!next.done) {
      var absPC = (next.value + rootPC) % 12;
      if (!scaleAbsPCS.has(absPC)) { allIn = false; break; }
      next = iter.next();
    }
    if (!allIn) continue;
    if (isMaj6 && scaleAbsPCS.has(flat7AbsPC)) continue;
    var key = entry.parentKey + ':' + entry.scaleIdx;
    strictKeys.add(key);
    var sat = SCALE_AVAIL_TENSIONS[entry.scaleIdx];
    var avoidCount = (sat && sat.avoid) ? sat.avoid.length : 0;
    results.push({
      parentKey: entry.parentKey, parentKeyName: _psKeyName(entry),
      system: entry.system, systemLabel: entry.systemLabel,
      degree: _psDegreeLabel(entry.degreeNum, entry.quality),
      degreeNum: entry.degreeNum, scaleName: entry.scaleName,
      scaleIdx: entry.scaleIdx, distance: padFifthsDistance(currentKey, entry.parentKey),
      omit5Match: false, avoidCount: avoidCount,
    });
  }

  if (chordIntervals.has(7)) {
    var omit5Intervals = new Set(chordIntervals);
    omit5Intervals.delete(7);
    for (var e2 = 0; e2 < entries.length; e2++) {
      var entry2 = entries[e2];
      var key2 = entry2.parentKey + ':' + entry2.scaleIdx;
      if (strictKeys.has(key2)) continue;
      var scaleAbsPCS2 = _getParentScaleAbsPCS(entry2);
      var allIn2 = true;
      var iter2 = omit5Intervals.values();
      var next2 = iter2.next();
      while (!next2.done) {
        var absPC2 = (next2.value + rootPC) % 12;
        if (!scaleAbsPCS2.has(absPC2)) { allIn2 = false; break; }
        next2 = iter2.next();
      }
      if (!allIn2) continue;
      if (isMaj6 && scaleAbsPCS2.has(flat7AbsPC)) continue;
      var sat2 = SCALE_AVAIL_TENSIONS[entry2.scaleIdx];
      var avoidCount2 = (sat2 && sat2.avoid) ? sat2.avoid.length : 0;
      results.push({
        parentKey: entry2.parentKey, parentKeyName: _psKeyName(entry2),
        system: entry2.system, systemLabel: entry2.systemLabel,
        degree: _psDegreeLabel(entry2.degreeNum, entry2.quality),
        degreeNum: entry2.degreeNum, scaleName: entry2.scaleName,
        scaleIdx: entry2.scaleIdx, distance: padFifthsDistance(currentKey, entry2.parentKey),
        omit5Match: true, avoidCount: avoidCount2,
      });
    }
  }

  // Non-diatonic scales (symmetric)
  var NON_DIATONIC_SCALES = [
    { scaleIdx: 25, needsAll: [10] },
    { scaleIdx: 26, needsAll: [4, 10] },
    { scaleIdx: 27, needsAll: [3, 6] },
  ];
  var ndMatched = new Set();
  for (var n = 0; n < NON_DIATONIC_SCALES.length; n++) {
    var nd = NON_DIATONIC_SCALES[n];
    if (nd.needsAll && !nd.needsAll.every(function(iv) { return chordIntervals.has(iv); })) continue;
    var scalePCSSet = new Set(SCALES[nd.scaleIdx].pcs);
    var allIn3 = true;
    var iter3 = chordIntervals.values();
    var next3 = iter3.next();
    while (!next3.done) {
      if (!scalePCSSet.has(next3.value % 12)) { allIn3 = false; break; }
      next3 = iter3.next();
    }
    if (!allIn3) continue;
    ndMatched.add(nd.scaleIdx);
    var sat3 = SCALE_AVAIL_TENSIONS[nd.scaleIdx];
    var avoidCount3 = (sat3 && sat3.avoid) ? sat3.avoid.length : 0;
    results.push({
      parentKey: rootPC, parentKeyName: '',
      system: '', systemLabel: '',
      degree: '', degreeNum: 0,
      scaleName: SCALES[nd.scaleIdx].name,
      scaleIdx: nd.scaleIdx, distance: 0,
      omit5Match: false, avoidCount: avoidCount3,
    });
  }
  if (chordIntervals.has(7)) {
    var omit5Ivs = new Set(chordIntervals);
    omit5Ivs.delete(7);
    for (var n2 = 0; n2 < NON_DIATONIC_SCALES.length; n2++) {
      var nd2 = NON_DIATONIC_SCALES[n2];
      if (ndMatched.has(nd2.scaleIdx)) continue;
      if (nd2.needsAll && !nd2.needsAll.every(function(iv) { return omit5Ivs.has(iv); })) continue;
      var scalePCSSet2 = new Set(SCALES[nd2.scaleIdx].pcs);
      var allIn4 = true;
      var iter4 = omit5Ivs.values();
      var next4 = iter4.next();
      while (!next4.done) {
        if (!scalePCSSet2.has(next4.value % 12)) { allIn4 = false; break; }
        next4 = iter4.next();
      }
      if (!allIn4) continue;
      var sat4 = SCALE_AVAIL_TENSIONS[nd2.scaleIdx];
      var avoidCount4 = (sat4 && sat4.avoid) ? sat4.avoid.length : 0;
      results.push({
        parentKey: rootPC, parentKeyName: '',
        system: '', systemLabel: '',
        degree: '', degreeNum: 0,
        scaleName: SCALES[nd2.scaleIdx].name,
        scaleIdx: nd2.scaleIdx, distance: 0,
        omit5Match: true, avoidCount: avoidCount4,
      });
    }
  }

  var SYS_ORDER = { '○': 0, 'NM': 1, '■': 2, '◆': 3 };
  results.sort(function(a, b) {
    return (a.omit5Match - b.omit5Match) ||
      (a.distance - b.distance) || (SYS_ORDER[a.system] || 99) - (SYS_ORDER[b.system] || 99) || (a.degreeNum - b.degreeNum);
  });
  return results;
}

// ======== GUITAR/BASS CHORD FORM ENUMERATION ========

function padEnumGuitarChordForms(chordPCS, rootPC, tuning, maxFrets, maxSpan, options) {
  if (!options) options = {};
  var minNotes = options.minNotes !== undefined ? options.minNotes : 3;
  var maxResults = options.maxResults !== undefined ? options.maxResults : 15;

  // Compute absolute pitch class set
  var chordAbsPCS = {};
  for (var i = 0; i < chordPCS.length; i++) {
    chordAbsPCS[(rootPC + (chordPCS[i] % 12)) % 12] = true;
  }

  // Check if chord has a 3rd (for filtering)
  var has3 = false, has4 = false;
  for (var i = 0; i < chordPCS.length; i++) {
    var iv = chordPCS[i] % 12;
    if (iv === 3) has3 = true;
    if (iv === 4) has4 = true;
  }
  var hasThirdInChord = has3 || has4;
  var third3PC = (rootPC + 3) % 12;
  var third4PC = (rootPC + 4) % 12;

  var numStrings = tuning.length;

  // Build candidate frets per string: [null(mute), valid frets...]
  var candidates = [];
  for (var s = 0; s < numStrings; s++) {
    var openPC = tuning[s] % 12;
    var cands = [null];
    for (var f = 0; f <= maxFrets; f++) {
      if (chordAbsPCS[(openPC + f) % 12]) cands.push(f);
    }
    candidates.push(cands);
  }

  var results = [];
  var chosen = new Array(numStrings);

  function search(si, fMin, fMax, count) {
    if (si === numStrings) {
      if (count < minNotes) return;
      var span = (fMin <= fMax) ? fMax - fMin + 1 : 0;
      if (span > maxSpan) return;

      // Collect pitch classes and find bass (lowest MIDI)
      var notePCs = {};
      var lowestMidi = Infinity, lowestPC = -1;
      for (var i = 0; i < numStrings; i++) {
        if (chosen[i] !== null) {
          var midi = tuning[i] + chosen[i];
          notePCs[midi % 12] = true;
          if (midi < lowestMidi) { lowestMidi = midi; lowestPC = midi % 12; }
        }
      }

      // Filter: must have root
      if (!notePCs[rootPC]) return;
      // Filter: must have 3rd if chord defines one
      if (hasThirdInChord && !notePCs[third3PC] && !notePCs[third4PC]) return;

      // Count gaps (muted strings between outermost sounding strings)
      var hiStr = -1, loStr = -1; // hiStr = lowest index (highest pitch)
      for (var i = 0; i < numStrings; i++) {
        if (chosen[i] !== null) {
          if (hiStr === -1) hiStr = i;
          loStr = i;
        }
      }
      var gaps = 0;
      for (var i = hiStr + 1; i < loStr; i++) {
        if (chosen[i] === null) gaps++;
      }

      results.push({
        frets: chosen.slice(),
        bassPC: lowestPC,
        rootInBass: lowestPC === rootPC,
        stringCount: count,
        span: span,
        gaps: gaps,
      });
      return;
    }

    var remaining = numStrings - si - 1;
    var cands = candidates[si];
    for (var c = 0; c < cands.length; c++) {
      var fret = cands[c];
      var newMin = fMin, newMax = fMax, newCount = count;

      if (fret !== null) {
        newCount++;
        if (fret > 0) {
          newMin = Math.min(fMin, fret);
          newMax = Math.max(fMax, fret);
          if (newMax - newMin + 1 > maxSpan) continue;
        }
      }
      if (newCount + remaining < minNotes) continue;

      chosen[si] = fret;
      search(si + 1, newMin, newMax, newCount);
    }
  }

  search(0, Infinity, 0, 0);

  // Sort by weighted score (higher = better)
  // Balances string count against fret position so open chords rank well
  function sortScore(r) {
    var avgFret = 0, n = 0;
    for (var i = 0; i < r.frets.length; i++) {
      if (r.frets[i] !== null && r.frets[i] > 0) { avgFret += r.frets[i]; n++; }
    }
    avgFret = n > 0 ? avgFret / n : 0;
    return (r.rootInBass ? 1000 : 0)
      + r.stringCount * 30
      - avgFret * 20
      - r.span * 10
      - r.gaps * 15;
  }
  results.sort(function(a, b) {
    return sortScore(b) - sortScore(a);
  });

  return results.slice(0, maxResults);
}

// Conditional exports for Node.js (Vitest) — ignored in browser
if (typeof module !== 'undefined') module.exports = {
  padPitchClass, padGetParentMajorKey, padPcName, padNoteNameForKey,
  padFifthsDistance, padApplyTension,
  padCalcVoicingOffsets, padGetBassCase, padApplyOnChordBass,
  padGetShellIntervals, padCalcAllVoicingPositions,
  padChordContextKey, padGetBuilderChordName,
  padGetDiatonicTetrads, padFindParentScales,
  padEnumGuitarChordForms,
  DIATONIC_CHORD_DB,
};
