# CrypAlgos Frontend - Codebase Scaling & Performance Optimization Guide

As the CrypAlgos platform scales to handle advanced quantitative analytics, complex visual node charts, and real-time streaming market data, it is critical that our codebase remains performant, lightweight, and responsive.

This document serves as the guide for scaling the Next.js React 19 application, outlining strategies to prevent performance degradation and maximize execution speed.

---

## 🚀 1. Dynamic Imports & Code Splitting

High-complexity editor tools like `@monaco-editor/react` (code editor) and `@xyflow/react` (visual node-graph editor) carry substantial JavaScript payloads. Importing them statically at the root will severely bloat the initial bundle size, impacting Search Engine Optimization (SEO) score and PageSpeed.

### Core Strategy: Next.js `next/dynamic`
Always load heavy, feature-specific modules lazily. Only load them on the client side when the user navigates directly to the strategy builder workspace.

#### Implementation Standard:
```tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load the Strategy Editor Canvas with a placeholder Skeleton loader
const StrategyCanvas = dynamic(
  () => import('@/components/strategy-builder/StrategyCanvas'),
  { 
    ssr: false, // Ensure this heavy client component is never compiled on Server-Side Rendering
    loading: () => <Skeleton className="w-full h-[600px] rounded-xl" />
  }
);

export default function BuilderPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Strategy Builder Workspace</h1>
      <StrategyCanvas />
    </div>
  );
}
```

---

## ⚡️ 2. High-Frequency Real-Time State Partitioning

The `streamer-service` provides sub-second price and trading metrics. Pushing sub-second ticks directly into the global React state or Zustand will trigger full component re-render trees, causing UI lag and browser freeze (re-render thrashing).

### Performance Directives:
1. **Localize High-Frequency Updates**: Keep real-time ticks confined to the specific leaf component displaying the metric. Never bubble real-time tick states to parent layouts.
2. **Ref-based Virtualization**: For high-velocity changes (such as fast chart updating or real-time calculations), store active inputs in React `useRef` rather than `useState` and update DOM nodes directly or throttle component renders.
3. **Throttling state modifications**: Implement dynamic throttling (e.g. using `lodash.throttle` or custom hooks) to limit DOM rendering to a maximum of 30 or 60 frames per second (FPS), rather than matching raw network socket frequencies.

---

## 🔄 3. Server Caching & React Query Configurations

By default, standard React Query settings assume immediate data staleness, triggering network requests on window refocus or path routing. In a data-heavy dashboard, this can cause excessive API load.

### Global Provider Config (`src/lib/providers.tsx`):
Ensure we establish smart default caching windows:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
      gcTime: 1000 * 60 * 30,    // Unused cache is garbage collected after 30 minutes
      refetchOnWindowFocus: false, // Disable aggressive polling on browser focus
      retry: 1, // Max retries before failing
    },
  },
});
```

### Specialized Query Hooks Pattern:
Wrap queries in domain hooks under `src/api-actions/hooks/`:

```typescript
export function useWaitlist(offset = 0, limit = 10, query = "") {
  return useQuery({
    queryKey: ['waitlist', offset, limit, query],
    queryFn: () => fetchWaitlistData(offset, limit, query),
    placeholderData: (previousData) => previousData, // Keep existing layout visible while loading next page
  });
}
```

---

## 🎨 4. Tailwind CSS v4 & Style Compilation

Tailwind CSS v4 introduces significant build-time optimizations and natively processes through CSS files rather than JavaScript hooks.

### Performance Practices:
* **Avoid Dynamic Utility Class Generation**:
  - *Bad*: `<div className={`bg-${color}-500`} />` (Tailwind cannot compile this at build time and will strip the class).
  - *Good*: `<div className={clsx(color === 'red' ? 'bg-red-500' : 'bg-blue-500')} />` or utilize style map records.
* **Component Partitioning**: Keep CSS custom utility properties restricted to root `globals.css` rather than replicating styling classes repeatedly inside React loops.

---

## 🧹 5. DOM & Canvas Optimization (Node Graphs & Recharts)
* **Recharts performance**: Disable heavy visual animations in charts (`isAnimationActive={false}`) for live charts receiving updates to avoid memory leaks.
* **React Flow node optimization**: Ensure all custom nodes utilize `React.memo` to avoid re-drawing the entire node tree unless coordinates or values actively change.
