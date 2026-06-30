# Go implementation inquiry
_Exported on 6/29/2026 at 16:39:39 PDT from Cursor (3.9.16)_

---

**User**

@frontend/src/types/winwatch-api.d.ts:47 where is this implementation on Go side?

---

**Cursor**

Tracing `zoomAction` from the TypeScript definition to its Go implementation.




There is **no Go method named `zoomAction`**. That name is part of the legacy Electron `tmApi` contract in the TypeScript types; in the Wails app it is handled entirely in the frontend shim, which then calls separate Go methods.

### Call chain

1. **Type contract** — `winwatch-api.d.ts` line 47 (Electron-era surface)

2. **Shim implementation** — `frontend/src/api/tmApi.ts`  
   `zoomAction` → `handleZoom` → `applyZoom` → **`SetZoomLevel(level)`** (Wails binding)

```61:65:frontend/src/api/tmApi.ts
function handleZoom(action: "in" | "out" | "reset"): number {
    if (action === "in") return applyZoom(currentZoomLevel + ZOOM_STEP);
    if (action === "out") return applyZoom(currentZoomLevel - ZOOM_STEP);
    return applyZoom(0);
}
```

```130:131:frontend/src/api/tmApi.ts
    zoomAction: (action) => Promise.resolve(handleZoom(action)),
    getZoomLevel: () => Promise.resolve(currentZoomLevel),
```

3. **Go entry points** — `app.go` on the `App` struct (bound via Wails as `main.App`, not `bindings.Api`):

```68:79:app.go
// SetZoomLevel applies a zoom level (in 1.2^level steps; 0 == 100%) to the
// WebView2 using its native page zoom, and persists it for the next launch.
// This is the runtime counterpart to the windows.ZoomFactor startup option.
func (a *App) SetZoomLevel(level float64) {
	setWebviewZoom(a.ctx, math.Pow(1.2, level))
	a.store.SetZoom(level)
}

// GetZoomLevel returns the persisted zoom level so the frontend can display the
// correct percentage on startup (the factor itself is already applied natively).
func (a *App) GetZoomLevel() float64 {
	return a.store.Zoom()
}
```

4. **Native WebView2 zoom** — `zoom_windows.go` (`setWebviewZoom` → `chromium.PutZoomFactor`)

5. **Persistence** — `internal/appstate/bounds.go` (`Store.Zoom` / `Store.SetZoom`)

6. **Startup zoom** — `main.go` reads persisted level and sets `windows.ZoomFactor`

### Summary

| Layer | What handles zoom |
|-------|-------------------|
| `zoomAction` | Frontend shim only (`tmApi.ts`) — computes in/out/reset level |
| Go API | `App.SetZoomLevel` / `App.GetZoomLevel` in `app.go` |
| WebView2 | `setWebviewZoom` in `zoom_windows.go` |
| Storage | `internal/appstate/bounds.go` |

`internal/bindings/api.go` does **not** expose zoom; those methods live on `App` in the main package, imported in the frontend as:

```typescript
import { SetZoomLevel, GetZoomLevel } from "../../wailsjs/go/main/App";
```

---

**User**

Plase guard "isBackgroundAvailable" so that app UI can run in browser without .exe. Of course, in this case, some functionality will be unavailable, but the advantage is the ability to customize the appearance of the user interface.

---

**Cursor**

Searching for how the app detects the Wails backend and where we need guards.




Implementing browser-mode detection and splitting the tmApi shim so Wails bindings load only when the Go backend is present.




The app can now run in a plain browser via `pnpm dev` without the Wails `.exe`.

### What was added

**`isBackgroundAvailable()`** — detects Wails (`window.go` + `window.runtime`):

```1:16:frontend/src/api/isBackgroundAvailable.ts
// True when the page runs inside Wails with the Go backend bound (window.go +
// window.runtime). False in a plain browser (e.g. `pnpm dev` / Vite on :5173).
export function isBackgroundAvailable(): boolean {
    ...
}
```

**Split tmApi shim** — dynamic import picks the right backend at startup:
- **`tmApi.wails.ts`** — existing Wails/Go bindings (unchanged behavior in the desktop app)
- **`tmApi.browser.ts`** — no-op stubs for native APIs; zoom still works via CSS + `localStorage`
- **`tmApi.ts`** — async `installTmApi()` selects one or the other

**Guards**
- `useActiveWindow` / `useMonitorActiveWindow` — skip monitoring when no backend
- `useAppStartInitialize` — skip window-list refresh in browser
- Top menu **Exit** — hidden without backend
- Header shows a **Browser preview** badge when running without the `.exe`

### Usage

```bash
cd frontend
pnpm dev    # http://localhost:5173 — UI/theming work, no UIA
```

In browser mode: window list, control tree, highlight, invoke, and monitoring are unavailable (empty/no-op). Zoom (`Ctrl +/-/0`), options (`Ctrl+,`), theme toggle, and layout panels still work for UI customization.

In the desktop app (`wails dev` / built `.exe`), behavior is unchanged — `isBackgroundAvailable()` is true and the full Go backend is used.

---

**User**

@frontend/src/api/isBackgroundAvailable.ts:3 is that possible to keep this function as local but expose contant that will be initialized when this module is loaded? I don't see the reason to make these checks every time, or am I wrong?

---

**Cursor**

You're right — the Wails bindings are fixed at page load, so a one-time check is enough. Checking usages and refactoring to expose a module-level constant.




You're right — Wails injects `window.go` before the frontend runs, and it doesn't change afterward. A module-load constant is sufficient.




You're right — repeated checks aren't needed here.

Wails injects `window.go` and `window.runtime` before your bundle runs, and they stay put for the page lifetime. Nothing in this app toggles them later, so one evaluation at module load is enough.

The module now looks like:

```typescript
function detectBackgroundAvailable(): boolean { ... }

export const isBackgroundAvailable = detectBackgroundAvailable();
```

Call sites use `isBackgroundAvailable` as a boolean (no `()`). The only edge case where a function would matter is if bindings could appear asynchronously after load — that doesn't happen with Wails, and `installTmApi()` already imports this module before React renders, so the timing is safe.

