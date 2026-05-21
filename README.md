# CrypAlgos Quantitative Command Center

A high-performance, visual, and analytical Next.js platform designed for strategy building, trade execution modeling, and portfolio analytics in the CrypAlgos ecosystem.

---

## 🌟 Overview

The frontend application (`app`) operates as the primary visualization portal and algorithm design workbench. It enables quantitative traders to build, compile, and execute algorithmic strategies via interactive node graphs, monitor live portfolio metrics, and participate in pre-launch Priority Waitlists.

---

## ⚡️ Technology Stack

We construct a highly resilient client experience utilizing a modern, optimized web architecture:

| Core Technology | Scope | Library Details |
| :--- | :--- | :--- |
| **Framework Engine** | React 19 / Next.js 16 (App Router) | High-performance routing & edge features |
| **Visual Node Canvas** | Quantitative Strategy Logic | `@xyflow/react` (React Flow) |
| **Code IDE Core** | Syntax highlighting, code editing | `@monaco-editor/react` |
| **Server State** | Caching, dynamic network queries | `@tanstack/react-query` (v5) |
| **Client Store** | Lightweight global state sync | `zustand` (v5) |
| **URL Query State** | URL-synchronized filters & sorting | `nuqs` (v2) |
| **Styling Layout** | Dark quantitative theme, animations | Tailwind CSS v4 / Radix / KokonutUI |
| **Request Interceptor**| Base URL mapping & auth tokens | `axios` |
| **Validation Forms** | Declarative payload validation | `react-hook-form` / `zod` |

---

## 🔌 Environment Setup

Before launching the local server, create a `.env` file in the root of the `app` folder (reference [/.env.sample](/.env.sample)):

```env
# The direct API entrypoint pointing to the active FastAPI local core
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api/v1
```

---

## 🚀 Development Quick Start

The project supports both `bun` (recommended) and `npm` package managers.

### 1. Install Dependencies
```bash
# Using bun
bun install

# Or using standard npm
npm install
```

### 2. Run the Development Server
```bash
# Using bun
bun run dev

# Or using standard npm
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

### 3. Build & Compile Production Target
To ensure strict type safety, styling sheets compilation, and bundle code-splitting are flawless:
```bash
npm run build
```

---

## 📂 Developer Guides & Knowledge Transfer Index

To eliminate duplicate onboardings and ensure that future developers and AI coding agents operate with complete context, we maintain a dedicated technical suite:

*   📖 **[Architectural Blueprint](/docs/architecture.md)**: Deep dive into directory structures, route group classifications, and state management strategies.
*   📖 **[Quantitative Strategy Builder](/docs/strategy_builder.md)**: Visual node-graph canvases, Zustand flow states, Monaco Editor synchronization, and optimized rendering guides.
*   📖 **[Performance & Scaling Guide](/docs/scaling.md)**: Optimized bundle configurations, dynamic imports code splitting, high-frequency tick rendering, and caching defaults.
*   📖 **[Contributing Guidelines](/docs/contributing.md)**: Theme variable setups in CSS, dynamic class merging practices, component definitions, and Git pipelines.
*   📖 **[Developer Do's & Don'ts Checklist](/docs/best_practices.md)**: Best practices and strict restrictions regarding typing, color styling, forms validation, and state isolation.
