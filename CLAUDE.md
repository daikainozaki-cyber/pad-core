# pad-core

## This repo is
Theory calculations, data definitions, and pad rendering pure functions library.
**SSOT for the entire pad ecosystem.**

## Dependencies
None.

## Depends on me
- 64-pad-visualizer (Web)
- master-rhythm-chart (Web)
- 64-pad-clap (future: CLAP plugin)
- 64-pad-vst (future: VST3/AU/Standalone)

## Build type
Library (ES module + script tag compatible via conditional `module.exports`)

## Module structure
| File | Content |
|------|---------|
| `data.js` | Constants: SCALES, KEY_SPELLINGS, BUILDER_QUALITIES, TENSION_ROWS, GRID, etc. |
| `theory.js` | Pure theory functions: voicing, chord naming, parent scale search, etc. |
| `render.js` | SVG pad rendering: grid, boxes, degree names. Uses `PAD = GRID` alias. |

## Conventions
- All shared functions use `pad*` prefix (padPitchClass, padCalcVoicingOffsets, etc.)
- All functions are **pure** — no global state reads, state passed as arguments
- Internal helpers use `_` prefix (_psKeyName, _getParentScaleAbsPCS)
- Browser: loaded via `<script>` tag, functions become globals
- Node: `if (typeof module !== 'undefined') module.exports = {...}`

## Testing
```
npm test        # vitest run (62 tests)
npm run test:watch  # vitest watch mode
```

## 現在地（自動更新）
- 状態: 2026-05-23 時点で chord detection / spelling / UST / candidate ranking の大改修を実施済み。Web consumer では V6.4.2、Desktop consumer では v1.5.0 として反映済み。`G B A D` は `Gadd9 / B` 系を優先し、minor7+b13 へ誤判定しない test を追加済み。
- 残作業: 1.5.x で Guitar engine の候補順位調整と Double Stop layer の理論支援を追加する可能性が高い。特に 5度 bass の guitar shape は優先度を落とし、一般的な実用表記を上位にする。
- 正規ルール: pad-core が理論計算 SSOT。App 側で chord detection / degree / UST 判定を再定義しない。UST は「shell + upper triad」の教育表示であり、shell がないものを安易に UST と呼ばない。minor7 に b13/b6 tension を足した candidate は原則作らない。
- 次: Double Stop layer 仕様メモに沿って、Major / Mixolydian / Major Pentatonic の 3rd/4th/6th ペア生成を pure helper として切り出せるか検討する。
- 注意: `△` は UST 分数表示内の major triad marker に限定する。通常 chord display は既存の `maj`/`Maj` 表記規約を維持する。key context に応じて `A#` より `Bb` が自然な場合は flat spelling を優先する。
- 判断待ち: Guitar engine / Double Stop layer の具体 UI 実装順。

## Referential integrity rules
- **This repo is the SSOT for theory calculations.** Write changes here only.
- Changes here affect all dependent apps. Run their tests too.
- App-side code must NOT redefine theory functions. Use thin adapters that call pad-core.
- Integration method: git submodule only. No npm, no copy.
