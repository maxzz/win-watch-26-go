# Project configuration updates
_Exported on 6/27/2026 at 16:35:40 PDT from Cursor (3.9.8)_

---

**User**

Add package.json to the root project and add scripts section. To @README.md add TOC

---

**Cursor**

I'll inspect the project layout and README so we can add a root `package.json` with scripts and a TOC in the README.


Creating root `package.json` with scripts that mirror the README workflow, and adding a TOC to the README.


Done. Here’s what changed:

### Root `package.json`

Added at the repo root with scripts that wrap the Wails and frontend workflows:

| Script | Command |
|--------|---------|
| `dev` | `wails dev` |
| `build` | `wails build` |
| `frontend:dev` | `pnpm --filter frontend dev` |
| `frontend:build` | `pnpm --filter frontend build` |
| `frontend:preview` | `pnpm --filter frontend preview` |

`pnpm install` now treats the repo as a 2-package workspace (root + `frontend`).

### `README.md`

- Added a **Table of contents** after the intro with links to all major sections (including nested Architecture and Native layer).
- Updated **Getting started** to use `pnpm dev` and `pnpm build` so it matches the new root scripts.

---

**User**

How to fix this warning?

---

**Cursor**

Checking the Vite config and bundle setup to recommend the best fix for the chunk-size warning.


This is Vite’s default **500 kB chunk-size warning**, not a build failure. Your main JS is **~615 kB** — only slightly over the limit — which is normal for a React app with Radix UI, `motion`, `lucide-react`, Jotai, etc.

For a **Wails desktop app**, that size is fine: everything loads locally from disk in WebView2, so there’s no network penalty like on the web.

## Options (pick based on goal)

### 1. Silence the warning (simplest, good for Wails)

If you’re happy with the bundle size and just want a clean build log:

```ts
// frontend/vite.config.ts
export default defineConfig({
    // ...
    build: {
        chunkSizeWarningLimit: 700, // or 1000
    },
});
```

This doesn’t change the output — only the threshold.

---

### 2. Split vendor code (best if you want smaller chunks)

Add `manualChunks` so React and heavy UI libs aren’t all in one file:

```ts
build: {
    rollupOptions: {
        output: {
            manualChunks(id) {
                if (id.includes("node_modules")) {
                    if (id.includes("react-dom") || id.includes("/react/")) {
                        return "react";
                    }
                    if (id.includes("@radix-ui")) {
                        return "radix";
                    }
                    if (id.includes("motion") || id.includes("framer-motion")) {
                        return "motion";
                    }
                    if (id.includes("lucide-react")) {
                        return "lucide";
                    }
                    return "vendor";
                }
            },
        },
    },
},
```

That usually removes the warning and can help caching for the **gh-pages** demo (`frontend:to-npm`).

---

### 3. Lazy-load rarely used UI (more work, smaller initial load)

Your app is a single page with no router. You could lazy-load dialogs (Options, About) with `React.lazy`:

```tsx
const DialogOptions = React.lazy(() => import("./4-dialogs/1-dialog-options"));
```

That only helps if those components pull in a lot of code and aren’t shown on startup.

---

## Recommendation

| Context | What to do |
|--------|------------|
| **Wails `.exe`** | Option 1 — raise the limit; 615 kB is not a problem |
| **gh-pages demo** | Option 2 — `manualChunks` for cleaner chunks and caching |
| **Want smallest first paint** | Option 3 on top of option 2 |

If you want, I can add option 1 or 2 to `frontend/vite.config.ts` for you.

---

**User**

OK, fix it please.

---

**Cursor**

I'll add vendor chunk splitting in `vite.config.ts` and verify the build no longer warns.


Added vendor chunk splitting to `frontend/vite.config.ts`. The build now completes without the warning:

| Chunk | Size |
|-------|------|
| `react` | 211 kB |
| `motion` | 125 kB |
| `radix` | 90 kB |
| `index` (app code) | 85 kB |
| `vendor` (everything else) | 78 kB |
| `lucide` | 16 kB |

The largest chunk is now ~211 kB (well under 500 kB), and the gh-pages demo gets better caching since vendor libs are in separate files.

