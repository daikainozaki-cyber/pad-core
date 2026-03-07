# pad-core/circle.js 抽出指示書

## 目的

既存の五度圏アプリ (`~/circle-of-fifths/index.html`, 1542行シングルファイル) から
SVG描画ロジックを抽出し、pad-core の新モジュール `circle.js` として実装する。

pad-core は git submodule として 64 Pad Explorer、Master Rhythm Chart、将来の PADDAW で共有される。
**全アプリで同じ五度圏描画を使う** ためのSSOT。

---

## 入力ファイル

`~/circle-of-fifths/index.html` — 全コードがここに入っている。

### 構造（行番号の目安）

| 範囲 | 内容 | 抽出対象 |
|------|------|----------|
| 1-453 | HTML + CSS | **不要**（各アプリが自前で持つ） |
| 534-557 | `keys` 配列、`noteNames` 配列 | **抽出** |
| 559-563 | `getNoteName()` | **抽出** |
| 566-568 | 色定数 (TONIC/SUB/DOM) | **抽出** |
| 570-828 | ダイアトニック度数定義、コード進行プリセット | **進行プリセットは除外**。度数定義は抽出 |
| 830-843 | SVGサイズ定数 | **パラメータ化して抽出** |
| 846-848 | 状態変数 (currentKey等) | **不要**（アプリ側の状態） |
| 850-872 | `polarToCartesian()`, `createSegmentPath()` | **抽出**（純粋関数） |
| 874-937 | セグメント描画ループ | **抽出**（`padRenderCircleOfFifths`に統合） |
| 939-970 | 中央円・タイトル描画 | **抽出** |
| 972-1085 | スケールモード切替ボタン | **抽出**（オプション） |
| 1087-1233 | `selectKey()` — 度数円表示 + 情報パネル更新 | **度数円描画のみ抽出**、情報パネルは除外 |
| 1236-1317 | `updateDiatonicTable()` | **除外**（テーブルUIはアプリ固有） |
| 1319-1542 | 進行表示、モバイルスクロール | **除外** |

---

## 出力ファイル

### `~/pad-core/circle.js`

```
// ========================================
// PAD-CORE — Circle of Fifths (Pure SVG Rendering)
// ========================================
```

### 必須エクスポート

| 関数 | 引数 | 説明 |
|------|------|------|
| `padCircleKeys` | — | `keys` 配列を返す（定数） |
| `padCircleNoteNames` | — | `noteNames` 配列を返す（定数） |
| `padCircleGetNoteName` | `(index, useSharp)` | 音名取得 |
| `padCirclePolarToCartesian` | `(cx, cy, radius, angleDeg)` | 極座標→直交座標 |
| `padCircleCreateSegmentPath` | `(cx, cy, innerR, outerR, startAngle, endAngle)` | SVGパスのd属性文字列 |
| `padRenderCircleOfFifths` | `(svgEl, options)` | **メイン関数**（後述） |

### `padRenderCircleOfFifths(svgEl, options)` の仕様

```javascript
// options:
// {
//   selectedKeyIndex: number | null,  // 0-11, 五度圏上の位置
//   selectedType: 'major' | 'minor' | null,
//   scaleMode: 'natural' | 'harmonic' | 'melodic',  // マイナー時のみ
//   size: number,          // SVG幅高さ (default: 700)
//   showDegrees: boolean,  // 度数円を表示するか (default: true)
//   showScaleModeButtons: boolean,  // Melodic/Harmonicボタン (default: true)
//   showTitle: boolean,    // 中央タイトル (default: true)
//   onKeySelect: function(keyIndex, type) {},  // セグメントクリック時コールバック
//   onScaleModeChange: function(newMode) {},   // スケールモード変更コールバック
//   colors: {              // カスタム色 (default: 既存アプリと同じ)
//     tonic: '#ff9800',
//     subdominant: '#42a5f5',
//     dominant: '#ef5350',
//     majorSegment: '#388e3c',
//     minorSegment: '#81c784',
//     selectedStroke: '#ff6f00',
//   }
// }
//
// 戻り値: { update(newOptions), destroy() }
//   update: 選択キー変更時に再描画（SVGクリアせず差分更新）
//   destroy: イベントリスナー解除
```

### 度数データ（定数としてエクスポート）

```javascript
var PAD_CIRCLE_MAJOR_DEGREES = [ /* majorCircleChords 相当 */ ];
var PAD_CIRCLE_MINOR_DEGREES = [ /* minorCircleChords 相当 */ ];
// ダイアトニックコード定義（テーブル用）
var PAD_CIRCLE_MAJOR_DIATONIC = [ /* majorDegrees 相当 */ ];
var PAD_CIRCLE_MINOR_DIATONIC_NATURAL = [ /* minorDegreesNatural */ ];
var PAD_CIRCLE_MINOR_DIATONIC_HARMONIC = [ /* minorDegreesHarmonic */ ];
var PAD_CIRCLE_MINOR_DIATONIC_MELODIC = [ /* minorDegreesMelodic */ ];
```

**進行プリセット (`majorProgressions`, `minorProgressions`) は含めない。**
アプリ固有のUI（テーブル、進行表示）に密結合しているため、各アプリが自前で持つ。

---

## pad-core コーディング規約（必須）

既存の `render.js` と `theory.js` に合わせること。

1. **`var` を使う**（`const`/`let` は使わない）。pad-core は ES5 互換
2. **関数名は `pad` プレフィックス** — `padCircleXxx`, `padRenderCircleOfFifths`
3. **グローバル状態を読まない**。全て引数で受ける（pure function）
4. **DOM依存は `svgEl` のみ**。`document.getElementById` 等は使わない
5. **SVG要素は `document.createElementNS('http://www.w3.org/2000/svg', tag)` で生成**
6. **Node.js互換ヘッダー**:
   ```javascript
   if (typeof require !== 'undefined' && typeof PAD_CIRCLE_KEYS === 'undefined') {
     Object.assign(globalThis, require('./data.js'));
   }
   ```
7. **Node.js互換フッター**:
   ```javascript
   if (typeof module !== 'undefined') module.exports = {
     padCircleKeys: PAD_CIRCLE_KEYS,
     padCircleNoteNames: PAD_CIRCLE_NOTE_NAMES,
     // ... 全エクスポート
   };
   ```
8. **テスト**: `~/pad-core/tests/circle.test.js` を作成（Vitest）
   - `polarToCartesian` の座標計算
   - `createSegmentPath` のSVGパス生成
   - `getNoteName` の♯/♭分岐
   - 度数配列の要素数・構造

---

## テストの実行

```bash
cd ~/pad-core && npx vitest run
```

既存テスト（81件）が壊れないこと。

---

## やらないこと

- CSS は含めない（各アプリが `.segment-major:hover` 等を自前で定義）
- 進行プリセット (`majorProgressions` 等) は含めない
- ダイアトニックテーブルのDOM生成は含めない（度数データだけ提供）
- index.html の書き換えはしない（既存アプリはそのまま動く）
- pad-core の他ファイル（data.js, theory.js, render.js）は変更しない

---

## 完了条件

1. `~/pad-core/circle.js` が存在する
2. `npx vitest run` で全テスト通過（既存81件 + circle新規テスト）
3. `padRenderCircleOfFifths(svgEl, { size: 200 })` でコンパクト版が描画できる
4. `onKeySelect` コールバックでアプリ側がキー変更を受け取れる
5. Node.js で `require('./circle.js')` して関数・定数にアクセスできる
