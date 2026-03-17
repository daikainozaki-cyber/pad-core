# Guitar Chord Form Quality Improvement

## Goal
Improve `padEnumGuitarChordForms()` in `pad-core/theory.js` to produce more realistic, playable guitar voicings.

## Source Files
- **Main**: `~/pad-core/theory.js` lines 676-802 (`padEnumGuitarChordForms`)
- **Tests**: `~/pad-core/tests/theory.test.js`
- **Consumer**: `~/64-pad-visualizer/` (uses pad-core as git submodule)
- **Render**: `~/64-pad-visualizer/render.js` (guitar diagram display)

## Current Implementation
Brute-force enumeration: all fret combinations per string -> filter (root required, 3rd required) -> score (rootInBass, stringCount, avgFret, span, gaps) -> sort -> top N.

## Improvements (priority order)

### 1. Unison Avoidance (same MIDI pitch)
- Reject forms where two strings produce the **exact same MIDI note**
- Octave duplicates (same pitch class, different octave) are OK
- Add in the `si === numStrings` block where notePCs is computed

### 2. Fifth Omission (optional notes)
- When chord has 4+ notes, the perfect 5th (interval 7) is optional
- Don't require it; don't penalize its absence
- Reference: hyvyys/chord-fingering approach
- This allows more compact voicings

### 3. Barre Chord Constraints
- **Ask urinami-san** for the specific rules. General guidelines from design notes:
  - Index finger barre: don't play 1st string (highest) in many positions
  - Middle/ring finger mini-barre: limited to 2-3 adjacent strings
  - Barre detection: multiple strings at same fret = barre candidate
- This needs interactive discussion with urinami-san (has PDF reference)

### 4. Rootless Voicings (optional, jazz)
- New option: `allowRootless: true`
- Currently `if (!notePCs[rootPC]) return;` rejects rootless
- When enabled: skip root check, but display separately (different group)
- Scoring: rootless voicings get lower base score than rooted ones

## Conventions
- **pad-core is SSOT**: all theory logic here, never in app repos
- **Function prefix**: `pad*` on all exported functions
- **Module loading**: `Object.assign(globalThis, require(...))` pattern in Node
- **Tests**: Vitest. Run `cd ~/pad-core && npx vitest run`
- **No dependencies**: pure functions only
- **var not let/const**: pad-core uses `var` for browser compat (no build step)

## NotebookLM Reference
- Music Theory notebook: `aef51e6b-818f-42cd-b1dc-efecc0346ee5`
- Contains: jazz chord voicing books, guitar theory PDFs
- Use `notebook_query` to look up barre chord rules, voice leading principles, 5th omission conventions

## Testing Strategy
- Add tests for each improvement
- Test unison: Cm chord should not have two identical MIDI notes in any form
- Test 5th omission: C7 forms should exist without G
- Test rootless: when enabled, forms without root should appear
- Existing 103 tests must still pass

## Completion Conditions
1. All existing tests pass
2. New tests added for each improvement
3. `padEnumGuitarChordForms` produces better-ranked forms
4. Changes committed to pad-core repo
5. Submodule updated in 64-pad-visualizer (but NOT deployed without urinami-san approval)

## What to Ask Urinami-san
- Barre chord rules (he has a PDF with specific logic)
- Scoring preferences (which voicings should rank higher?)
- Any voicings that currently appear that shouldn't
- Any voicings that are missing that should appear
