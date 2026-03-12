// ========================================
// PAD-CORE — Theory Calculations (Pure Functions)
// All functions are pure: no global state reads.
// Required state is passed as arguments.
// ========================================

// Node.js: load data.js exports into global scope (browser: already global via script tag)
if (typeof require !== 'undefined' && typeof SCALES === 'undefined') {
  Object.assign(globalThis, require('./data.js'));
}

// ======== CHORD NAME PARSING ========

function padParseRoot(str) {
  if (!str || str.length === 0) return null;
  var first = str[0].toUpperCase();
  if (first < 'A' || first > 'G') return null;
  var name = first;
  if (str.length > 1) {
    var second = str[1];
    if (second === '#' || second === '\u266F') name += '#';      // # or ♯
    else if (second === 'b' || second === '\u266D') name += 'b'; // b or ♭
  }
  var pc = PAD_ROOT_TO_PC[name];
  return pc !== undefined ? { pc: pc, len: name.length } : null;
}

function padParseChordName(input) {
  if (!input) return null;
  input = input.trim();
  if (!input) return null;

  // Normalize: uppercase first letter
  input = input[0].toUpperCase() + input.slice(1);

  // 1. Extract bass note (slash chord: /X at end)
  var bass = null;
  var mainPart = input;
  var slashIdx = input.lastIndexOf('/');
  if (slashIdx > 0) {
    var bassStr = input.slice(slashIdx + 1);
    var bassResult = padParseRoot(bassStr);
    if (bassResult && bassResult.len === bassStr.length) {
      bass = bassResult.pc;
      mainPart = input.slice(0, slashIdx);
    }
  }

  // 2. Parse root note
  var rootResult = padParseRoot(mainPart);
  if (!rootResult) return null;

  // 3. Extract quality string (everything after root)
  var qualityStr = mainPart.slice(rootResult.len);

  // 4. Match quality (longest match first)
  var matchedKey = null;
  for (var i = 0; i < PAD_QUALITY_KEYS.length; i++) {
    if (qualityStr === PAD_QUALITY_KEYS[i]) {
      matchedKey = PAD_QUALITY_KEYS[i];
      break;
    }
  }

  // 4b. Fallback: compound tension like "m7(9,11)" or "7(b9,#11)"
  if (matchedKey === null) {
    var parenMatch = qualityStr.match(/^(.*?)\(([^)]+)\)$/);
    if (parenMatch) {
      var baseQ = parenMatch[1];
      var tensionStr = parenMatch[2];
      if (PAD_QUALITY_INTERVALS[baseQ] !== undefined) {
        var TENSION_MAP = {
          '9': 14, 'b9': 13, '#9': 15,
          '11': 17, '#11': 18,
          '13': 21, 'b13': 20,
          '#5': 8, 'b5': 6,
        };
        var baseIntervals = PAD_QUALITY_INTERVALS[baseQ].slice();
        var tensions = tensionStr.split(',').map(function(s) { return s.trim(); });
        var valid = true;
        for (var t = 0; t < tensions.length; t++) {
          var iv = TENSION_MAP[tensions[t]];
          if (iv === undefined) { valid = false; break; }
          if (tensions[t] === 'b5' || tensions[t] === '#5') {
            var idx = baseIntervals.indexOf(7);
            if (idx >= 0) baseIntervals[idx] = iv;
            else if (baseIntervals.indexOf(iv) < 0) baseIntervals.push(iv);
          } else {
            if (baseIntervals.indexOf(iv) < 0) baseIntervals.push(iv);
          }
        }
        if (valid) {
          baseIntervals.sort(function(a, b) { return a - b; });
          var rootName = mainPart.slice(0, rootResult.len);
          var displayQuality = PAD_QUALITY_DISPLAY[baseQ] || baseQ;
          var displayName = rootName + displayQuality + '(' + tensions.join(',') + ')';
          if (bass !== null) {
            var bassStr2 = input.slice(input.lastIndexOf('/') + 1);
            displayName += '/' + bassStr2[0].toUpperCase() + bassStr2.slice(1);
          }
          return {
            root: rootResult.pc,
            quality: qualityStr,
            intervals: baseIntervals,
            bass: bass,
            displayName: displayName,
          };
        }
      }
    }
  }

  if (matchedKey === null) return null;

  var intervals = PAD_QUALITY_INTERVALS[matchedKey];

  // Build canonical display name (resolve aliases)
  var rootName2 = mainPart.slice(0, rootResult.len);
  var displayQuality2 = PAD_QUALITY_DISPLAY[matchedKey] || matchedKey;
  var displayName2 = rootName2 + displayQuality2;
  if (bass !== null) {
    var bassStr3 = input.slice(input.lastIndexOf('/') + 1);
    displayName2 += '/' + bassStr3[0].toUpperCase() + bassStr3.slice(1);
  }

  return {
    root: rootResult.pc,
    quality: matchedKey,
    intervals: intervals.slice(),
    bass: bass,
    displayName: displayName2,
  };
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
  var allowRootless = !!options.allowRootless;
  var noOpen = !!options.noOpen; // funk/soul: no open strings (can't mute for tight rhythm)

  // Scoring weights: override via options.weights for genre presets (bossa/jazz/funk)
  var W = options.weights || {};
  var wRootBass   = W.rootBass   !== undefined ? W.rootBass   : 120;
  var wFifthBass  = W.fifthBass  !== undefined ? W.fifthBass  : 100;
  var wRootStr6   = W.rootStr6   !== undefined ? W.rootStr6   : 50;
  var wRootStr5   = W.rootStr5   !== undefined ? W.rootStr5   : 30;
  var wRootStr4   = W.rootStr4   !== undefined ? W.rootStr4   : 20;
  var wTop4       = W.top4       !== undefined ? W.top4       : 30;
  var wGuideTone  = W.guideTone  !== undefined ? W.guideTone  : 40;
  var wOpenStr    = W.openStr    !== undefined ? W.openStr    : 15;
  var wStringCount= W.stringCount!== undefined ? W.stringCount: 30;
  var wAvgFret    = W.avgFret    !== undefined ? W.avgFret    : 15;
  var wSpan       = W.span       !== undefined ? W.span       : 10;
  var wGaps       = W.gaps       !== undefined ? W.gaps       : 15;
  var wFullFret   = W.fullFret   !== undefined ? W.fullFret   : 15;

  // Fifth is optional when chord has tensions (9th+), since guitar has only 6 strings.
  // BUT: altered 5ths (b5=6, #5=8) that REPLACE the natural 5th define chord quality
  // (dim, m7b5, aug) and must NOT be omitted.
  // When both natural 5th and b5/#5 coexist (e.g. #11 = compound b5), 5th is still optional.
  var hasTensions = false;
  var hasNatural5th = false;
  var hasAltered5th = false;
  for (var i = 0; i < chordPCS.length; i++) {
    if (chordPCS[i] >= 13) hasTensions = true;
    var iv = chordPCS[i] % 12;
    if (iv === 7) hasNatural5th = true;
    if (iv === 6 || iv === 8) hasAltered5th = true;
  }
  var alteredFifthIsChordTone = hasAltered5th && !hasNatural5th;
  // Fifth is optional when: tensions (9th+), 7th/6th present (R37 shell is standard),
  // or fifthOptional option. Guitar has 4 fingers = 5th is first to drop.
  var has7or6 = false;
  for (var i = 0; i < chordPCS.length; i++) {
    var iv = chordPCS[i] % 12;
    if (iv === 9 || iv === 10 || iv === 11) has7or6 = true;
  }
  var fifthIsOptional = (hasTensions || has7or6 || !!options.fifthOptional) && !alteredFifthIsChordTone;

  // Compute absolute pitch class set
  var chordAbsPCS = {};
  for (var i = 0; i < chordPCS.length; i++) {
    chordAbsPCS[(rootPC + (chordPCS[i] % 12)) % 12] = true;
  }

  // Check if chord has a 3rd, 6th, 7th (for filtering and guide tone bonus)
  var has3 = false, has4 = false, has6thInChord = false, has7thInChord = false;
  for (var i = 0; i < chordPCS.length; i++) {
    var iv = chordPCS[i] % 12;
    if (iv === 3) has3 = true;
    if (iv === 4) has4 = true;
    if (iv === 9) has6thInChord = true;
    if (iv === 10 || iv === 11) has7thInChord = true;
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
    for (var f = (noOpen ? 1 : 0); f <= maxFrets; f++) {
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

      // Collect pitch classes, MIDI notes, and find bass (lowest MIDI)
      var notePCs = {};
      var midiNotes = {};
      var lowestMidi = Infinity, lowestPC = -1;
      for (var i = 0; i < numStrings; i++) {
        if (chosen[i] !== null) {
          var midi = tuning[i] + chosen[i];
          notePCs[midi % 12] = true;
          // Unison avoidance: reject exact same MIDI note on two strings
          if (midiNotes[midi]) return;
          midiNotes[midi] = true;
          if (midi < lowestMidi) { lowestMidi = midi; lowestPC = midi % 12; }
        }
      }

      // Filter: must have root (unless rootless allowed)
      var isRootless = !notePCs[rootPC];
      if (isRootless && !allowRootless) return;
      // Filter: must have 3rd if chord defines one
      if (hasThirdInChord && !notePCs[third3PC] && !notePCs[third4PC]) return;
      // Filter: non-tension chords require all pitch classes present
      // Tension chords (9th+) allow 5th omission for playability
      if (!fifthIsOptional) {
        for (var pc in chordAbsPCS) {
          if (isRootless && parseInt(pc) === rootPC) continue;
          if (!notePCs[pc]) return;
        }
      }

      // Finger unit feasibility: max 4 fingers available
      // Lowest fret = barre candidate (1 unit even if non-adjacent strings)
      // Higher frets: each contiguous group of strings = 1 unit
      var fretGroups = {};
      var minFrettedFret = Infinity;
      for (var i = 0; i < numStrings; i++) {
        if (chosen[i] !== null && chosen[i] > 0) {
          if (!fretGroups[chosen[i]]) fretGroups[chosen[i]] = [];
          fretGroups[chosen[i]].push(i);
          if (chosen[i] < minFrettedFret) minFrettedFret = chosen[i];
        }
      }
      var fingerUnits = 0;
      for (var fret in fretGroups) {
        if (parseInt(fret) === minFrettedFret) {
          fingerUnits += 1; // barre candidate: 1 unit
        } else {
          var strs = fretGroups[fret].slice().sort(function(a, b) { return a - b; });
          var groups = 1;
          for (var i = 1; i < strs.length; i++) {
            if (strs[i] !== strs[i - 1] + 1) groups++;
          }
          fingerUnits += groups;
        }
      }
      if (fingerUnits > 4) return;

      // Above-barre spread check: notes above the barre must be within a
      // reasonable window. Relaxed when fret difference is small (1-2 frets)
      // because fingers can reach across the neck at adjacent frets easily
      // (e.g. G chord 320003: fret 3 on strings 1 and 6, barre at fret 2).
      if (minFrettedFret < Infinity) {
        var aboveMinStr = -1, aboveMaxStr = -1, maxAboveFret = 0;
        for (var i = 0; i < numStrings; i++) {
          if (chosen[i] !== null && chosen[i] > minFrettedFret) {
            if (aboveMinStr === -1) aboveMinStr = i;
            aboveMaxStr = i;
            if (chosen[i] > maxAboveFret) maxAboveFret = chosen[i];
          }
        }
        var aboveSpread = aboveMaxStr - aboveMinStr;
        var aboveFretDiff = maxAboveFret - minFrettedFret;
        // Wide spread only OK if fret difference is small (1-2 frets)
        if (aboveSpread > 3 && aboveFretDiff > 2) return;
      }

      // Count gaps (muted strings between outermost sounding strings)
      // Also count "open gaps": muted string adjacent to an open string
      // = fingerpicking only (can't strum/mute cleanly)
      var hiStr = -1, loStr = -1; // hiStr = lowest index (highest pitch)
      for (var i = 0; i < numStrings; i++) {
        if (chosen[i] !== null) {
          if (hiStr === -1) hiStr = i;
          loStr = i;
        }
      }
      var gaps = 0, openGaps = 0;
      for (var i = hiStr + 1; i < loStr; i++) {
        if (chosen[i] === null) {
          gaps++;
          // Check if adjacent sounding strings include an open string
          var prevOpen = (i > 0 && chosen[i - 1] === 0);
          var nextOpen = false;
          for (var j = i + 1; j < numStrings; j++) {
            if (chosen[j] !== null) { nextOpen = (chosen[j] === 0); break; }
          }
          if (prevOpen || nextOpen) openGaps++;
        }
      }

      // Sandwiched open: open string between two fretted strings.
      // Open string vibration clashes with fretted notes — uncommon technique.
      var sandwichedOpen = 0;
      for (var i = hiStr; i <= loStr; i++) {
        if (chosen[i] !== 0) continue;
        // Find nearest sounding string on each side
        var leftFretted = false, rightFretted = false;
        for (var j = i - 1; j >= 0; j--) {
          if (chosen[j] === null) continue;
          leftFretted = (chosen[j] > 0); break;
        }
        for (var j = i + 1; j < numStrings; j++) {
          if (chosen[j] === null) continue;
          rightFretted = (chosen[j] > 0); break;
        }
        if (leftFretted && rightFretted) sandwichedOpen++;
      }

      results.push({
        frets: chosen.slice(),
        bassPC: lowestPC,
        bassString: loStr,
        rootInBass: lowestPC === rootPC,
        isRootless: isRootless,
        stringCount: count,
        span: span,
        gaps: gaps,
        openGaps: openGaps,
        sandwichedOpen: sandwichedOpen,
        fingerUnits: fingerUnits,
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
    // Fifth-in-bass bonus: bossa batida plays R+5 on bass strings (thumb)
    // Results in 2nd inversion voicings (C/G, Am/E) as standard bossa forms
    var fifthBassBonus = 0;
    if (!r.rootInBass && wFifthBass > 0) {
      var fifthPC = (rootPC + 7) % 12;
      if (r.bassPC === fifthPC) fifthBassBonus = wFifthBass;
    }

    // CAGED root string bonus: 6th (E form), 5th (A form), 4th (D form)
    var rootStrBonus = 0;
    if (r.rootInBass && numStrings === 6) {
      if (r.bassString === 5) rootStrBonus = wRootStr6;
      else if (r.bassString === 4) rootStrBonus = wRootStr5;
      else if (r.bassString === 3) rootStrBonus = wRootStr4;
    }
    // Top-4-string comping bonus: strings 1-4 only (jazz/funk standard)
    var top4Bonus = 0;
    if (numStrings === 6 && r.frets[4] === null && r.frets[5] === null) {
      var soundingCount = 0;
      for (var i = 0; i < 4; i++) { if (r.frets[i] !== null) soundingCount++; }
      if (soundingCount >= 3) top4Bonus = wTop4;
    }
    // Guide tone bonus: 3rd + 7th (or 3rd + 6th for 6th chords) = harmonically complete
    // Shell voicing core: R37 for 7th chords, R36 for 6th chords (bossa/jazz standard)
    var guideToneBonus = 0;
    var has3rdInForm = false, has7thInForm = false, has6thInForm = false;
    for (var i = 0; i < r.frets.length; i++) {
      if (r.frets[i] !== null) {
        var pc = (tuning[i] + r.frets[i]) % 12;
        if (pc === third3PC || pc === third4PC) has3rdInForm = true;
        var fromRoot = ((pc - rootPC) + 12) % 12;
        if (fromRoot === 10 || fromRoot === 11) has7thInForm = true;
        if (fromRoot === 9) has6thInForm = true;
      }
    }
    // R37 shell (7th chords) or R36 shell (6th chords without 7th)
    if (has3rdInForm && has7thInForm) guideToneBonus = wGuideTone;
    else if (has3rdInForm && has6thInForm && has6thInChord && !has7thInChord) guideToneBonus = wGuideTone;

    // Open string bonus/penalty: sliding scale based on fret position.
    // Pure open chord (avgFret≈1): full bonus. Higher frets: bonus shrinks
    // then flips to penalty. Standard barre always beats scattered open+fret.
    var openBonus = 0;
    var openCount = 0;
    if (!noOpen) {
      for (var i = 0; i < r.frets.length; i++) {
        if (r.frets[i] === 0) openCount++;
      }
      if (openCount > 0) {
        // factor: 1.0 at avgFret=0, 0.0 at avgFret=2.5, negative above
        var openFactor = 1 - (avgFret / 2.5);
        openBonus = openCount * wOpenStr * openFactor;
      }
    }

    // Full-fret bonus: all sounding strings are fretted (no open strings).
    // Rewards standard barre shapes over open-string variants at same position.
    var fullFretBonus = 0;
    if (openCount === 0) fullFretBonus = wFullFret;

    return (r.rootInBass ? wRootBass : 0)
      + fifthBassBonus
      + rootStrBonus
      + top4Bonus
      + guideToneBonus
      + openBonus
      + fullFretBonus
      + r.stringCount * wStringCount
      - avgFret * wAvgFret
      - r.span * wSpan
      - r.gaps * wGaps
      - r.openGaps * 40 // fingerpicking-only: mute between open strings
      - r.sandwichedOpen * 25; // open string vibration clashes with fretted neighbors
  }

  if (allowRootless) {
    // Partition: rooted first, rootless after (each sorted independently)
    var rooted = [], rootless = [];
    for (var i = 0; i < results.length; i++) {
      if (results[i].isRootless) rootless.push(results[i]);
      else rooted.push(results[i]);
    }
    rooted.sort(function(a, b) { return sortScore(b) - sortScore(a); });
    rootless.sort(function(a, b) { return sortScore(b) - sortScore(a); });
    var maxRootless = options.maxRootless !== undefined ? options.maxRootless : 5;
    return rooted.slice(0, maxResults).concat(rootless.slice(0, maxRootless));
  }

  results.sort(function(a, b) {
    return sortScore(b) - sortScore(a);
  });

  return results.slice(0, maxResults);
}

// ======== CHORD DETECTION ========
// Detect chord name from MIDI notes. Returns array of {name, rootPC, score} sorted by score.
// Uses CHORD_DETECT_DB, TRIAD_DETECT_DB, TETRAD_DETECT_DB from data.js.

function padDetectChord(midiNotes) {
  if (midiNotes.length < 2) return [];
  var pcs = [];
  var seen = {};
  for (var i = 0; i < midiNotes.length; i++) {
    var pc = midiNotes[i] % 12;
    if (!seen[pc]) { seen[pc] = true; pcs.push(pc); }
  }
  pcs.sort(function(a, b) { return a - b; });
  if (pcs.length < 2) return [];
  var lowestPC = midiNotes[0];
  for (var i = 1; i < midiNotes.length; i++) {
    if (midiNotes[i] < lowestPC) lowestPC = midiNotes[i];
  }
  lowestPC = lowestPC % 12;
  var candidates = [];
  var seenNames = {};

  for (var ri = 0; ri < pcs.length; ri++) {
    var rootPC = pcs[ri];
    var intervals = {};
    for (var j = 0; j < pcs.length; j++) {
      intervals[((pcs[j] - rootPC) + 12) % 12] = true;
    }
    for (var ci = 0; ci < CHORD_DETECT_DB.length; ci++) {
      var chord = CHORD_DETECT_DB[ci];
      // Exact match (allow 1 extra note)
      if (chord.pcs.length <= pcs.length + 1) {
        var matched = 0;
        for (var k = 0; k < chord.pcs.length; k++) {
          if (intervals[chord.pcs[k]]) matched++;
        }
        if (matched === chord.pcs.length) {
          var extra = pcs.length - chord.pcs.length;
          var isRootPosition = rootPC === lowestPC;
          var score = (isRootPosition ? 100 : 0) + chord.pcs.length * 10 - extra;
          var rootName = NOTE_NAMES_SHARP[rootPC];
          var bass = lowestPC !== rootPC ? ' / ' + NOTE_NAMES_SHARP[lowestPC] : '';
          var name = rootName + chord.name + bass;
          if (!seenNames[name]) {
            seenNames[name] = true;
            candidates.push({ name: name, rootPC: rootPC, score: score });
          }
        }
      }
      // Omit5 match: 4+ note chords containing 5th (7) — also check without 5th
      if (chord.pcs.length >= 4 && chord.pcs.indexOf(7) !== -1) {
        var omit5pcs = [];
        for (var k = 0; k < chord.pcs.length; k++) {
          if (chord.pcs[k] !== 7) omit5pcs.push(chord.pcs[k]);
        }
        if (omit5pcs.length <= pcs.length + 1) {
          var matched = 0;
          for (var k = 0; k < omit5pcs.length; k++) {
            if (intervals[omit5pcs[k]]) matched++;
          }
          if (matched === omit5pcs.length) {
            var extra = pcs.length - omit5pcs.length;
            var isRootPosition = rootPC === lowestPC;
            var score = (isRootPosition ? 100 : 0) + chord.pcs.length * 10 - extra - 5;
            var rootName = NOTE_NAMES_SHARP[rootPC];
            var bass = lowestPC !== rootPC ? ' / ' + NOTE_NAMES_SHARP[lowestPC] : '';
            var omitLabel = chord.pcs.length >= 5 ? '' : '(omit5)';
            var name = rootName + chord.name + omitLabel + bass;
            if (!seenNames[name]) {
              seenNames[name] = true;
              candidates.push({ name: name, rootPC: rootPC, score: score });
            }
          }
        }
      }
    }
  }

  // Bass + Triad detection
  if (pcs.length >= 3) {
    var upperPCs = [];
    for (var i = 0; i < pcs.length; i++) {
      if (pcs[i] !== lowestPC) upperPCs.push(pcs[i]);
    }
    if (upperPCs.length >= 3) {
      for (var ti = 0; ti < upperPCs.length; ti++) {
        var triadRoot = upperPCs[ti];
        var triadIntervals = {};
        for (var j = 0; j < upperPCs.length; j++) {
          triadIntervals[((upperPCs[j] - triadRoot) + 12) % 12] = true;
        }
        for (var di = 0; di < TRIAD_DETECT_DB.length; di++) {
          var triad = TRIAD_DETECT_DB[di];
          var matched = 0;
          for (var k = 0; k < triad.pcs.length; k++) {
            if (triadIntervals[triad.pcs[k]]) matched++;
          }
          if (matched === triad.pcs.length) {
            var triadName = NOTE_NAMES_SHARP[triadRoot] + (triad.name === 'Maj' ? '' : triad.name);
            var bassName = NOTE_NAMES_SHARP[lowestPC];
            var name = triadName + ' / ' + bassName;
            if (!seenNames[name]) {
              seenNames[name] = true;
              var isTriadRoot = triadRoot === lowestPC;
              var score = (isTriadRoot ? 100 : 0) + 25;
              candidates.push({ name: name, rootPC: triadRoot, score: score });
            }
          }
        }
      }
    }
  }

  // Bass + Tetrad detection
  if (pcs.length >= 4) {
    var upperPCs = [];
    for (var i = 0; i < pcs.length; i++) {
      if (pcs[i] !== lowestPC) upperPCs.push(pcs[i]);
    }
    if (upperPCs.length >= 4) {
      for (var ti = 0; ti < upperPCs.length; ti++) {
        var tetRoot = upperPCs[ti];
        var tetIntervals = {};
        for (var j = 0; j < upperPCs.length; j++) {
          tetIntervals[((upperPCs[j] - tetRoot) + 12) % 12] = true;
        }
        for (var di = 0; di < TETRAD_DETECT_DB.length; di++) {
          var tet = TETRAD_DETECT_DB[di];
          var matched = 0;
          for (var k = 0; k < tet.pcs.length; k++) {
            if (tetIntervals[tet.pcs[k]]) matched++;
          }
          if (matched === tet.pcs.length) {
            var tetName = NOTE_NAMES_SHARP[tetRoot] + tet.name;
            var bassName = NOTE_NAMES_SHARP[lowestPC];
            if (tetRoot === lowestPC) continue;
            var name = tetName + ' / ' + bassName;
            if (!seenNames[name]) {
              seenNames[name] = true;
              var score = 30 + tet.pcs.length * 5;
              candidates.push({ name: name, rootPC: tetRoot, score: score });
            }
          }
        }
      }
    }
  }

  // 6th + 7th → 13th tension rename
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    var rootIntervals = {};
    for (var j = 0; j < pcs.length; j++) {
      rootIntervals[((pcs[j] - c.rootPC) + 12) % 12] = true;
    }
    var has7th = rootIntervals[10] || rootIntervals[11];
    if (has7th) {
      var is7 = rootIntervals[10];
      var sfx = is7 ? '7' : '△7';
      c.name = c.name.replace(/^([A-G]#?)6\/9(\(omit5\))?/, '$1' + sfx + '(9,13)');
      c.name = c.name.replace(/^([A-G]#?)m6\/9(\(omit5\))?/, '$1m' + sfx + '(9,13)');
      c.name = c.name.replace(/^([A-G]#?)6(\(omit5\))?/, '$1' + sfx + '(13)');
      c.name = c.name.replace(/^([A-G]#?)m6(\(omit5\))?/, '$1m' + sfx + '(13)');
    }
  }

  candidates.sort(function(a, b) { return b.score - a.score; });
  return candidates.slice(0, 8);
}

// ======== STOCK VOICING MATCHING ========
// Parse stock-voicings.json into flat array of entries with semitone arrays.
// Input: raw JSON object (parsed stock-voicings.json).
// Output: array of { id, name, label, category, subtype, lhSemitones, rhSemitones, allSemitones, pcCount }

function padParseStockVoicings(jsonData) {
  var entries = [];
  var categories = Object.keys(jsonData);
  for (var ci = 0; ci < categories.length; ci++) {
    var cat = categories[ci];
    if (cat === '_meta') continue;
    var subtypes = Object.keys(jsonData[cat]);
    for (var si = 0; si < subtypes.length; si++) {
      var sub = subtypes[si];
      var voicings = jsonData[cat][sub];
      for (var vi = 0; vi < voicings.length; vi++) {
        var v = voicings[vi];
        if ((!v.LH || v.LH.length === 0) && (!v.RH || v.RH.length === 0)) continue;
        var lh = [], rh = [];
        for (var i = 0; i < (v.LH || []).length; i++) {
          var s = DEGREE_TO_SEMITONE[v.LH[i]];
          if (s !== undefined) lh.push(s);
        }
        for (var i = 0; i < (v.RH || []).length; i++) {
          var s = DEGREE_TO_SEMITONE[v.RH[i]];
          if (s !== undefined) rh.push(s);
        }
        var seen = {};
        var all = [];
        for (var i = 0; i < lh.length; i++) {
          if (!seen[lh[i]]) { seen[lh[i]] = true; all.push(lh[i]); }
        }
        for (var i = 0; i < rh.length; i++) {
          if (!seen[rh[i]]) { seen[rh[i]] = true; all.push(rh[i]); }
        }
        entries.push({
          id: v.id, name: v.name, label: v.label,
          category: cat, subtype: sub,
          lhSemitones: lh, rhSemitones: rh,
          allSemitones: all, pcCount: all.length,
        });
      }
    }
  }
  return entries;
}

// Match MIDI notes against stock voicing patterns.
// rootPC: 0-11 (pitch class of root). midiNotes: array of MIDI values.
// stockEntries: output of padParseStockVoicings().
// Returns array of { id, name, label, category, subtype, score, matched, total } sorted by score.

function padMatchStockVoicing(rootPC, midiNotes, stockEntries) {
  if (!midiNotes || midiNotes.length < 2 || !stockEntries) return [];

  // Convert MIDI notes to interval set (semitones from root, mod 12)
  var intervalSet = {};
  var intervalCount = 0;
  for (var i = 0; i < midiNotes.length; i++) {
    var iv = ((midiNotes[i] % 12) - rootPC + 12) % 12;
    if (!intervalSet[iv]) { intervalSet[iv] = true; intervalCount++; }
  }

  var results = [];
  for (var i = 0; i < stockEntries.length; i++) {
    var entry = stockEntries[i];
    var all = entry.allSemitones;
    if (all.length === 0) continue;

    // Count how many of the stock voicing's degrees are in our input
    var matched = 0;
    for (var j = 0; j < all.length; j++) {
      if (intervalSet[all[j]]) matched++;
    }
    if (matched === 0) continue;

    // Jaccard similarity: intersection / union
    var union = intervalCount + all.length - matched;
    var score = matched / union;

    // Exact match bonus
    if (matched === all.length && all.length === intervalCount) score = 1.0;

    if (score < 0.5) continue;

    results.push({
      id: entry.id, name: entry.name, label: entry.label,
      category: entry.category, subtype: entry.subtype,
      score: Math.round(score * 100) / 100,
      matched: matched, total: all.length,
    });
  }

  results.sort(function(a, b) {
    return b.score - a.score || b.matched - a.matched;
  });
  return results.slice(0, 8);
}

// ======== PITCH CLASS CLASSIFICATION ========

/**
 * Classify a pitch class by its role in the current chord context.
 * Returns: 'root' | 'bass' | 'guide3' | 'guide7' | 'tension' | 'inactive'
 * Pure function — no global state reads.
 */
function padClassifyPC(pc, rootPC, bassPC, activePCS, guide3Set, guide7Set) {
  if (!activePCS || !activePCS.has(pc)) return 'inactive';
  if (pc === rootPC) return 'root';
  if (bassPC !== null && bassPC !== undefined && pc === bassPC && pc !== rootPC) return 'bass';
  if (guide3Set && guide3Set.has(pc)) return 'guide3';
  if (guide7Set && guide7Set.has(pc)) return 'guide7';
  return 'tension';
}

/**
 * Get the color for a pitch class classification from a theme object.
 */
function padClassifyColor(classification, theme) {
  return (theme || PAD_THEME_OKABE_ITO)[classification] || (theme || PAD_THEME_OKABE_ITO).inactive;
}

// Conditional exports for Node.js (Vitest) — ignored in browser
if (typeof module !== 'undefined') module.exports = {
  padParseRoot, padParseChordName,
  padPitchClass, padGetParentMajorKey, padPcName, padNoteNameForKey,
  padFifthsDistance, padApplyTension,
  padCalcVoicingOffsets, padGetBassCase, padApplyOnChordBass,
  padGetShellIntervals, padCalcAllVoicingPositions,
  padChordContextKey, padGetBuilderChordName,
  padGetDiatonicTetrads, padFindParentScales,
  padEnumGuitarChordForms, padDetectChord,
  padParseStockVoicings, padMatchStockVoicing,
  padClassifyPC, padClassifyColor,
  DIATONIC_CHORD_DB,
};
