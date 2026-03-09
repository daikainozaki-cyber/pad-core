// ========================================
// PAD-CORE — Incremental Chord Input (Pure Functions)
// Candidate generation and dropdown rendering for real-time chord name input.
// No application state reads. Memory slots passed as parameter.
// ========================================

// Node.js: load dependencies (browser: already global via script tag)
if (typeof require !== 'undefined' && typeof PAD_QUALITY_KEYS === 'undefined') {
  Object.assign(globalThis, require('./data.js'));
  Object.assign(globalThis, require('./theory.js'));
}

// ======== HELPERS ========

// Count tensions in a quality string (parenthesized or inline)
function _padTensionCount(q) {
  var m = q.match(/\(([^)]+)\)/);
  if (!m) {
    var base = q.replace(/^(m7b5|m7|maj7|dim7|aug7|7|m6|6|dim|aug|m|M7|sus[24]?)/, '');
    return base.length > 0 ? 1 : 0;
  }
  return m[1].split(',').length;
}

// ======== CANDIDATE GENERATION ========

/**
 * Generate chord name candidates from incremental text input.
 * @param {string} input - User input text
 * @param {Array|null} memorySlots - Array of {name, ...} or null (for memory recall by number)
 * @returns {Array<{type, name, quality?, exactMatch?, index?, label?}>}
 */
function padGenerateCandidates(input, memorySlots) {
  if (!input) return [];

  // Number only → memory recall
  if (/^\d+$/.test(input) && memorySlots) {
    var idx = parseInt(input) - 1;
    if (idx >= 0 && idx < memorySlots.length && memorySlots[idx]) {
      return [{
        type: 'memory',
        index: idx,
        name: memorySlots[idx].name,
        label: input + ': ' + memorySlots[idx].name,
      }];
    }
    var results = [];
    for (var i = 0; i < memorySlots.length; i++) {
      var slotNum = String(i + 1);
      if (slotNum.indexOf(input) === 0 && memorySlots[i]) {
        results.push({
          type: 'memory',
          index: i,
          name: memorySlots[i].name,
          label: slotNum + ': ' + memorySlots[i].name,
        });
      }
    }
    return results;
  }

  // Root extraction (C, C#, Db etc)
  var rootMatch = input.match(/^([A-Ga-g])([#b]?)/);
  if (!rootMatch) return [];

  var rootWasLower = rootMatch[1] === rootMatch[1].toLowerCase();
  var rootStr = rootMatch[1].toUpperCase() + rootMatch[2];
  var qualityInput = input.slice(rootMatch[0].length);

  // Slash chord branch
  var slashIdx = qualityInput.indexOf('/');
  if (slashIdx >= 0) {
    var quality = qualityInput.slice(0, slashIdx);
    var bassInput = qualityInput.slice(slashIdx + 1);
    return padGenerateSlashCandidates(rootStr, quality, bassInput);
  }

  // QUALITY_KEYS prefix match (with interval dedup)
  var candidates = [];
  var seenIntervals = {};
  var qualityKeys = PAD_QUALITY_KEYS;
  for (var k = 0; k < qualityKeys.length; k++) {
    var qKey = qualityKeys[k];
    if (qKey.indexOf(qualityInput) === 0 || qKey.toLowerCase().indexOf(qualityInput.toLowerCase()) === 0) {
      var fullName = rootStr + qKey;
      var parsed = padParseChordName(fullName);
      if (parsed) {
        // Dedup by intervals (same voicing = same chord)
        var dedupKey = parsed.intervals.slice().sort(function(a,b){return a-b;}).join(',') +
                       ':' + (parsed.bass === null ? '' : parsed.bass);
        if (!seenIntervals[dedupKey]) {
          seenIntervals[dedupKey] = true;
          candidates.push({
            type: 'chord',
            name: parsed.displayName,
            quality: qKey,
            exactMatch: qKey === qualityInput || qKey.toLowerCase() === qualityInput.toLowerCase(),
          });
        }
      }
    }
  }

  // Sort: exact match → minor/major boost → fewer tensions → shorter quality
  var wantMinor = (rootWasLower && !qualityInput) ||
                  (qualityInput.length > 0 && qualityInput[0] === 'm');
  var wantMajor = qualityInput.length > 0 && qualityInput[0] === 'M';

  candidates.sort(function(a, b) {
    if (a.exactMatch !== b.exactMatch) return (b.exactMatch ? 1 : 0) - (a.exactMatch ? 1 : 0);
    if (wantMinor) {
      var aM = a.quality[0] === 'm' ? 1 : 0;
      var bM = b.quality[0] === 'm' ? 1 : 0;
      if (aM !== bM) return bM - aM;
    } else if (wantMajor) {
      var aJ = (a.quality[0] === 'M' || a.quality.indexOf('maj') === 0) ? 1 : 0;
      var bJ = (b.quality[0] === 'M' || b.quality.indexOf('maj') === 0) ? 1 : 0;
      if (aJ !== bJ) return bJ - aJ;
    }
    // Fewer tensions first (base → single → double → triple)
    var tA = _padTensionCount(a.quality);
    var tB = _padTensionCount(b.quality);
    if (tA !== tB) return tA - tB;
    return a.quality.length - b.quality.length;
  });

  return candidates.slice(0, 15);
}

/**
 * Generate slash chord (on-chord bass) candidates.
 */
function padGenerateSlashCandidates(rootStr, quality, bassInput) {
  var baseCheck = rootStr + quality;
  if (quality && !padParseChordName(baseCheck)) return [];

  var bassNotes = [];
  for (var i = 0; i < NOTE_NAMES_SHARP.length; i++) {
    var n = NOTE_NAMES_SHARP[i];
    if (!bassInput || n.toLowerCase().indexOf(bassInput.toLowerCase()) === 0) {
      bassNotes.push(n);
    }
  }

  var results = [];
  for (var j = 0; j < bassNotes.length; j++) {
    var fullName = rootStr + quality + '/' + bassNotes[j];
    var parsed = padParseChordName(fullName);
    if (parsed) results.push({ type: 'chord', name: parsed.displayName });
  }
  return results.slice(0, 12);
}

/**
 * Generate extension candidates (→ key for deeper chord types).
 */
function padGenerateExtensionCandidates(baseName) {
  var rootMatch = baseName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return [];
  var rootStr = rootMatch[1];
  var baseQuality = baseName.slice(rootStr.length);

  var candidates = [];
  var qualityKeys = PAD_QUALITY_KEYS;
  for (var k = 0; k < qualityKeys.length; k++) {
    var qKey = qualityKeys[k];
    if (qKey.length > baseQuality.length && qKey.indexOf(baseQuality) === 0) {
      var fullName = rootStr + qKey;
      var parsed = padParseChordName(fullName);
      if (parsed) {
        candidates.push({ type: 'chord', name: parsed.displayName, quality: qKey });
      }
    }
  }
  candidates.sort(function(a, b) { return a.quality.length - b.quality.length; });
  candidates.push({ type: 'action', name: baseName + '/...', label: '\u2192 \u30AA\u30F3\u30B3\u30FC\u30C9' });
  return candidates.slice(0, 12);
}

// ======== DROPDOWN RENDERING ========

/**
 * Render candidate dropdown into a container element.
 * @param {HTMLElement} container - Dropdown container
 * @param {Array} candidates - From padGenerateCandidates
 * @param {number} selectedIndex - Currently selected index
 * @param {function} onCommit - (candidate) => void
 * @returns {{ updateSelection: function, close: function }}
 */
function padRenderDropdown(container, candidates, selectedIndex, onCommit) {
  if (!container) return { updateSelection: function() {}, close: function() {} };

  if (candidates.length === 0) {
    container.innerHTML = '';
    container.classList.remove('active');
    return { updateSelection: function() {}, close: function() {} };
  }

  container.innerHTML = '';
  container.classList.add('active');

  candidates.forEach(function(c, i) {
    var div = document.createElement('div');
    div.className = 'incremental-candidate' + (i === selectedIndex ? ' selected' : '');
    div.textContent = c.label || c.name;
    div.addEventListener('mousedown', function(e) {
      e.preventDefault();
      onCommit(c);
    });
    div.addEventListener('mouseenter', function() {
      // Update visual selection on hover
      var items = container.querySelectorAll('.incremental-candidate');
      items.forEach(function(el, j) {
        el.classList.toggle('selected', j === i);
      });
    });
    container.appendChild(div);
  });

  return {
    updateSelection: function(newIndex) {
      var items = container.querySelectorAll('.incremental-candidate');
      items.forEach(function(el, j) {
        el.classList.toggle('selected', j === newIndex);
      });
    },
    close: function() {
      container.innerHTML = '';
      container.classList.remove('active');
    },
  };
}

// Conditional exports for Node.js (Vitest) — ignored in browser
if (typeof module !== 'undefined') module.exports = {
  padGenerateCandidates, padGenerateSlashCandidates,
  padGenerateExtensionCandidates, padRenderDropdown,
};
