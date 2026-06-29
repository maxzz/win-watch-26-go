# Go implementation inquiry
_Exported on 6/29/2026 at 16:21:42 PDT from Cursor (3.9.16)_

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

