# QuantumOrbitLoader — CrypAlgos

Institutional fintech loader. Motion-first, logo-agnostic.  
Swap `◉` for the CrypAlgos symbol when branding is ready — animations stay unchanged.

---

## Files

```
components/
  QuantumOrbitLoader.tsx          # Component + all sub-components
  QuantumOrbitLoader.module.css   # CSS Module (animations, variants, dark mode)
```

---

## Installation

No extra dependencies — uses only React + CSS Modules (both built into Next.js).

Copy both files into your `components/` folder (or wherever you keep shared UI).

---

## API

```tsx
<QuantumOrbitLoader
  size?    = "sm" | "md" | "lg" | "xl"   // default: "md"
  variant? = "default" | "inline" | "research" | "fullscreen"  // default: "default"
  text?    = string       // fixed status text; omit to cycle through defaults
  progress?= { label: string; value: number }[]  // research variant only
  className?= string      // appended to outermost element
/>
```

### Sizes

| Prop   | px  |
|--------|-----|
| `sm`   | 32  |
| `md`   | 64  |
| `lg`   | 120 |
| `xl`   | 200 |

Particle labels (BTC / ETH / SOL / Data) appear automatically at `lg` and `xl`.

---

## Usage examples

### Inline — inside strategy cards or table rows
```tsx
<QuantumOrbitLoader variant="inline" text="BTC/USD Momentum Strategy" />
```

### Default — standalone with cycling status
```tsx
<QuantumOrbitLoader size="md" />
```

### Default — with fixed text
```tsx
<QuantumOrbitLoader size="md" text="Running backtest..." />
```

### Research — backtest / optimisation / Monte Carlo
```tsx
<QuantumOrbitLoader
  variant="research"
  text="Running backtest..."
  progress={[
    { label: "Backtest",    value: 80 },
    { label: "Walkforward", value: 34 },
    { label: "Monte Carlo", value: 12 },
  ]}
/>
```

### Fullscreen — strategy / report opening
```tsx
// Renders as position:fixed overlay — no portal needed
{isLoading && (
  <QuantumOrbitLoader
    variant="fullscreen"
    text="Preparing research artifacts..."
  />
)}
```

---

## Swapping the logo

The core glyph is a single character in `QuantumOrbitLoader.tsx`:

```tsx
<span className={styles.coreGlyph} style={{ fontSize: coreFontPx }}>
  ◉
</span>
```

Replace with your SVG symbol when ready:

```tsx
<CrypAlgosSymbol width={coreFontPx} height={coreFontPx} />
```

The `corePulse` animation (scale 0.98 → 1.02) is applied to the `.coreGlyph` class —  
wrap your SVG in a `<span className={styles.coreGlyph}>` to inherit it automatically.

---

## Motion spec

| Element          | Animation          | Duration  |
|------------------|--------------------|-----------|
| Outer orbit      | Clockwise 360°     | 10 s      |
| Inner orbit      | Counter-clockwise  | 7 s       |
| Core glyph       | Pulse scale ±2%    | 3.5 s     |
| Particles        | Opacity 0.4 → 1.0  | 2.0–2.4 s |
| Status text      | Fade + slide       | 3.5 s     |
| Progress fill    | Width 0 → value    | 2.4 s     |

All animations respect `prefers-reduced-motion: reduce`.

---

## Dark mode

Handled entirely via `@media (prefers-color-scheme: dark)` in the CSS Module.  
No JavaScript theme toggling required.