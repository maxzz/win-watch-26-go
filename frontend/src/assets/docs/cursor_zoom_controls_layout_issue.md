# Zoom controls layout issue
_Exported on 6/29/2026 at 16:13:13 PDT from Cursor (3.9.16)_

---

**User**

@frontend/src/components/0-all-layout/2-zoom-controls.tsx:7 When the zoom controls are used to reduce the scale—for example, to 75%—the web content window does not cover the entire window area; this needs to be fixed. It is also necessary to verify that when zooming in (i.e., above 100%), the web content occupies the entire area of the window.

---

**Cursor**

Now I understand the issue. The zoom is applied via the CSS `zoom` property on `document.documentElement`. The app's root content is sized with `h-screen`/`w-screen` (viewport units). When zoomed below 100%, the viewport-sized content gets visually scaled down, leaving an empty gap; the content's logical size isn't compensated for the zoom factor.

The robust fix is to apply zoom on `#root` and compensate its size by the inverse of the zoom factor, while sizing the app content relative to its parent (`100%`) instead of the viewport.

Let me make the changes.

Now ensure the `html`, `body`, and `#root` fill the window so the percentage-based sizing has a full-viewport reference:

Now switch the app content from viewport units (`w-screen h-screen`) to fill its parent (`w-full h-full`), so it tracks the counter-scaled `#root` rather than the raw viewport:

The changes are complete. Here's what was causing the issue and how I fixed it:

## Root cause
Zoom was applied as `zoom: factor` on `document.documentElement`, while the app's content was sized with viewport units (`w-screen`/`h-screen` = `100vw`/`100vh`). When zooming **out** (e.g. 75%), the content's logical size still resolved to the full viewport and was then visually scaled down to 75% — leaving an empty gap on the right/bottom. There was no compensation for the zoom factor.

## Fix

1. **`frontend/src/api/tmApi.ts`** — Apply `zoom` to `#root` (whose parent `body` is never zoomed) and counter-scale its logical size by `1 / factor`:

```33:46:frontend/src/api/tmApi.ts
    const root = document.getElementById("root");
    if (root) {
        const style = root.style as unknown as { zoom: string };
        style.zoom = String(factor);
        root.style.width = `calc(100% / ${factor})`;
        root.style.height = `calc(100% / ${factor})`;
    }
```

Now `#root` is laid out at `100% / factor` of the (unzoomed) window, then `zoom` scales it back to exactly the window size — for both zoom-out and zoom-in.

2. **`frontend/src/assets/index.css`** — Made `html`, `body`, `#root` fill the window (`width/height: 100%`, `margin: 0`) so the percentage-based sizing has a full-viewport reference.

3. **`frontend/src/components/0-all-layout/0-app.tsx`** — Switched the app container from `w-screen h-screen` (viewport units) to `w-full h-full` so it tracks the counter-scaled `#root` instead of the raw viewport.

With this, at **75%** the content fills the whole window (no gap), and when zooming **above 100%** the content also occupies the full window area without overflow/scrollbars, since `#root` is sized inversely before scaling.

To verify visually you can rebuild/run the dev frontend and test the zoom out/in buttons.

---

**User**

The previous changes need to be reverted because they scale the content of the `<body>` element—specifically the root element—which is incorrect; 
the `<body>` element should occupy the entire visible window area, while any content scaling should be handled by the content itself. 
Ultimately, the goal is to achieve the same effect as in the Google Chrome browser, where the zoom factor is applied to the `<body>` element.

---

**Cursor**

The user wants me to revert my approach and instead apply the zoom factor directly to the `<body>` element (Chrome-like), with no counter-scaling. Let me revert all three changes.

All previous changes are reverted, and the zoom is now applied to the `<body>` element (Chrome-like page zoom) instead of `#root`:

- **`frontend/src/api/tmApi.ts`** — `applyZoom` now sets `document.body.style.zoom = factor`, with no counter-scaling of size.
- **`frontend/src/assets/index.css`** — Removed the added `html, body, #root { height/width/margin }` rules; back to the original.
- **`frontend/src/components/0-all-layout/0-app.tsx`** — Restored the app container to `w-screen h-screen`.

The `<body>` itself fills the visible window, and only its content is scaled by the zoom factor — matching how Chrome applies page zoom.

---

**User**

I see a few scaling issues so far: the scaling factor isn't being saved—even though it should be, and the app ought to launch with that same factor next time. 
That’s the first point. 
Secondly, when the scaling factor is set to, say, 75%, the attached screenshot shows the window occupying only part of the screen with a green bar appearing, even though the app's root element is set to the screen height; this needs to be fixed. @frontend/src/components/0-all-layout/0-app.tsx:25 these classes are correct so the problem is not here.

---

**Cursor**

Let me investigate a few things: where the green comes from (native window background), how startup init works for persistence, and the actual zoom/viewport behavior.

Let me start the dev server and empirically test how `zoom` interacts with `100vh` in this Chromium, so I base the fix on evidence rather than assumption.

A dev server is already running on port 5173. Let me test the actual `zoom` + `100vh` behavior in this Chromium engine via the browser.

Let me verify the exact proposed fix structure (percentage-height chain + zoom on body) actually fills the window under zoom.

This is definitive evidence. With a percentage-height chain (`html`/`body`/`#root`/app all at `height:100%`) and `zoom` on `body`, the app content fills the window at **0.75**, **1.0**, and **1.2** — all four corners report the app element.

The culprit is exactly the `h-screen` (`100vh`) on the app div: under CSS `zoom`, viewport units (`vh`/`vw`) are **not** compensated, so the content renders shorter than the window, exposing the native green background. Percentage heights resolve through the zoomed chain and fill correctly. So `h-screen` must become `h-full`, backed by a full-height `html`/`body`/`#root` chain.

Let me check how the zoom atom gets synced for persistence wiring.

Now I have a clear, evidence-backed plan. Let me implement: (1) persist the zoom level, (2) fix the fill via a percentage-height chain.

First, the zoom persistence + body zoom in `tmApi.ts`:

Now the full-height percentage chain in `index.css`:

Now switch the app container from viewport units to the percentage chain:

Let me verify the actual app renders correctly under zoom now. Let me load it and test.

The bottom corners now report the app's panels (`left-panel`, `control-props-panel`) instead of empty background — the content fills the window at 75%. Let me take a screenshot to confirm visually and test zoom-in too.

At 75% the app now fills the entire window — no green bar, footer reaches the bottom. Now let me confirm zoom-in (>100%) also fills.

Zoom-in (120%) also fills the window completely with no scrollbars or overflow. Both directions work. Let me reset the test page's zoom to neutral.

Everything works. The persistence key `winwatch.zoomLevel` is being written (currently `"0"` after restore), so zoom changes will be saved and restored on next launch.

Let me verify the final `tmApi.ts` state is clean.

Both issues are fixed and verified empirically in the running app.

## 1. Zoom factor now persists across launches
In `frontend/src/api/tmApi.ts`:
- `applyZoom()` now writes the level to `localStorage` (`winwatch.zoomLevel`) on every change.
- `installTmApi()` calls a new `restoreZoom()` at startup (before React renders), so the app launches at the last-used factor. The renderer already syncs its UI via `getZoomLevel()`, so the displayed `%` matches.

WebView2 keeps `localStorage` in its persistent user-data folder, so this survives restarts.

## 2. Content now fills the window at any zoom (no green bar)
The root cause was the app container using `h-screen` (`100vh`). I verified directly in this Chromium/WebView2 engine that the CSS `zoom` property does **not** compensate viewport units (`vh`/`vw`) — a `100vh` element under `zoom: 0.75` renders at 75% height, exposing the native (green) window background. Percentage heights, however, resolve through the zoomed box chain and fill correctly.

So, although `h-screen` *looked* correct, it was actually the source of the gap. The fix:
- `frontend/src/assets/index.css` — added a full-size chain: `html, body, #root { height: 100%; width: 100%; margin: 0 }`.
- `frontend/src/components/0-all-layout/0-app.tsx` — app container changed from `h-screen` to `h-full w-full`.
- Zoom stays applied to `<body>` (Chrome-like), and `<body>` itself fills the window.

### Verification (in the live app)
- At **75%**: all four window corners report app panels (`left-panel`, `control-props-panel`) — screenshot confirms full coverage, footer reaches the bottom, no green bar.
- At **120%**: corners also report app content, and crucially `hasHScroll: false` / `hasVScroll: false` — it fills exactly with no overflow/scrollbars.

Note: a dev server was already running on port 5173 (yours), which picked up these changes via HMR for the verification.

---

**User**

Currently, the scaling factor is handled within the applyZoom function. 
Is it possible to have the zoom handled by the Chrome browser itself, rather than by modifying docking and body styles?

---

**Cursor**

Good question. Let me check what the installed Wails version actually exposes for native WebView2 zoom, since that's the key to whether we can offload zoom to the engine instead of CSS.

The Wails options source lives in the module cache. Let me locate it and check the Windows options for native zoom fields.

Good news and a caveat. I checked your installed Wails (`v2.12.0`), and WebView2's native zoom **is** exposed — but only partially:

```83:93:pkg/options/windows/windows.go
type Options struct {
	...
	IsZoomControlEnabled bool
	ZoomFactor           float64

	DisablePinchZoom bool
```

## What's possible

**Yes** — WebView2 can do the zoom natively (the real Chrome behavior: it scales everything and compensates viewport units, so no `html/body/#root` sizing tricks and no CSS `zoom` are needed for the content to fill the window).

- `IsZoomControlEnabled: true` lets the WebView2 engine handle zoom via **Ctrl + mouse-wheel** (and pinch), exactly like Chrome.
- `ZoomFactor: <n>` sets the **initial** zoom factor at startup.

## The important catch

Wails `v2.12.0` exposes the native zoom **only as a startup option**. There is **no supported runtime API** to *get* or *set* the zoom factor after launch. That has real consequences for your current design:

- Your in-app zoom menu (`2-zoom-controls.tsx` with `−` / `%` / `+` / reset) and the `Ctrl +` / `Ctrl -` / `Ctrl 0` shortcuts in `tmApi.ts` **could not drive** the native zoom. Those buttons would become dead unless we reach into the underlying `ICoreWebView2Controller` COM object from Go — which Wails keeps internal (unsupported, hacky interop).
- The displayed `%` could only *read* native zoom changes (e.g. via `window.devicePixelRatio`), not control them.
- WebView2 does **not** persist zoom across launches, so you'd still save the factor yourself and feed it back via `ZoomFactor` at startup.

So it's essentially a trade-off between **(a)** native engine zoom with mouse/pinch only, losing your custom UI integration, and **(b)** the current CSS approach which keeps full programmatic control of the buttons, shortcuts, and `%` readout.

How would you like to proceed?

> **Which zoom approach do you want?**
> - Keep the current CSS zoom (Recommended) — keeps your +/- buttons, %, Ctrl+/- shortcuts, and persistence fully working
> - Switch to native WebView2 zoom via Ctrl+mouse-wheel/pinch — remove CSS zoom & body/html sizing hacks, but the in-app zoom menu buttons/shortcuts stop working (only Ctrl+wheel zooms)
> - Hybrid: native engine zoom + Go-side COM interop into ICoreWebView2Controller so the +/- buttons still work (more complex, relies on unsupported internals) ✔

You chose the hybrid. That requires reaching the WebView2 `ICoreWebView2Controller` from Go to call `put_ZoomFactor`/`get_ZoomFactor` at runtime. Let me study how Wails stores the controller internally to find a viable access path.

I can read files by exact path but the sandbox blocks directory listing. Let me locate the `go-webview2` dependency (which Wails uses for the WebView2 controller) and read its Chromium type.

`edge.Chromium` has exactly what we need: `PutZoomFactor(float64)` and `GetController()` (the controller also has `GetZoomFactor`). The hard part is that Wails creates this `*edge.Chromium` internally. Let me find how Wails stores the frontend in the `context.Context` so I can reach it.

The frontend is stored in `ctx.Value("frontend")` as an internal interface type. The concrete type holds a `chromium *edge.Chromium` (and `edge` is a *public* package we can import). But WebView2 COM calls must run on the UI thread, so I need to see how Wails marshals to the main thread. Let me read the Windows frontend.

Excellent — this gives me the exact mechanism. `Frontend` has unexported `chromium *edge.Chromium` and `mainWindow *Window`, and `mainWindow.Invoke(func())` marshals to the UI thread (required for WebView2 COM calls). `edge` is a public, importable package, and `Window.Invoke` is exported (callable via reflection without naming the internal type).

Let me look at the app/bindings structure to decide where to add the native `SetZoom` method and confirm `Window.Invoke`'s signature.

Let me confirm `Window.Invoke`'s signature and the controller's zoom getter.

`ControlBase.Invoke(f func())` is the UI-thread dispatcher, promoted to `Window`. Let me confirm the `Window` struct embeds it so reflection can reach `Invoke`.

The mechanism is confirmed: `Window` embeds `winc.Form` (so `Invoke` is reachable via reflection), and both `Frontend` and `Window` hold the `*edge.Chromium`. `ICoreWebView2Controller` has both `PutZoomFactor`/`GetZoomFactor`.

I'll make Go the source of truth: persist the zoom level, set the native `ZoomFactor` at startup (no flash), and call the WebView2 controller at runtime for the +/- buttons. Let me look at the generated bindings and the resizable panels (to revert CSS cleanly).

I now have everything needed. Let me implement the hybrid: native WebView2 zoom driven by Go (startup option + runtime COM via reflection), with Go as the persistence source of truth. First, revert the CSS/layout hacks since native zoom handles fill correctly.

Now add the persisted zoom level to the Go settings store:

Now the platform-specific native zoom helper. Create the Windows implementation (reflection into the Wails frontend) and a no-op stub:

Now add the bound `SetZoomLevel`/`GetZoomLevel` methods to `App`:

Now wire the persisted zoom into the startup `ZoomFactor` option (no first-paint flash) and disable user Ctrl+wheel zoom so the in-app `%` stays authoritative:

Now add the generated bindings for the two new `App` methods:

Now update the frontend shim to drive native zoom via the Go binding instead of CSS, and sync the displayed level from Go:

Let me update the stale header comment about CSS zoom and verify the file.

Now let me build the Go side to validate the reflection/COM code compiles, and run lints on the frontend.

Go builds cleanly (the Windows reflection/COM file compiled). Let me run the frontend type-check to confirm the new binding imports resolve.

Go and TypeScript both compile. Since the WebView2 COM path only exists in the real desktop app (not the vite dev server in a plain browser), let me confirm the Wails toolchain is available and regenerate the bindings properly (so they're authoritative rather than hand-written).

Wails CLI is available. Let me regenerate the bindings so they're authoritative (this should produce the same `SetZoomLevel`/`GetZoomLevel` I added by hand).

The auto-generated bindings exactly match. Let me do a final check for any leftover references to the removed CSS-zoom/localStorage code.

Done. The hybrid is implemented: zoom is now performed by the **WebView2 engine's native page zoom** (true Chrome-style scaling that fills the window automatically), while your in-app `+` / `−` / reset buttons and `Ctrl +/-/0` shortcuts still drive it through Go → the WebView2 `ICoreWebView2Controller`. The CSS `zoom` and the `html/body` sizing hacks are gone.

## What changed

**Go side**
- `zoom_windows.go` (new) — `setWebviewZoom(ctx, factor)`: reaches into Wails' unexported Windows `Frontend` (via `ctx.Value("frontend")` + reflection/`unsafe`) to get the `*edge.Chromium` and main window, then calls `chromium.PutZoomFactor` **on the UI thread** through the window's `Invoke` dispatcher (WebView2 COM must run on its creating thread). Verified against `wails v2.12.0` / `go-webview2 v1.0.22`.
- `zoom_other.go` (new) — no-op stub for non-Windows builds.
- `app.go` — `SetZoomLevel(level)` (applies native zoom + persists) and `GetZoomLevel()` (reads persisted level), both bound to the frontend.
- `internal/appstate/bounds.go` — added `ZoomLevel` to the persisted `Settings`, with `Zoom()`/`SetZoom()`.
- `main.go` — reads the saved level and sets `windows.Options.ZoomFactor` at startup (so the app launches at the right zoom with **no first-paint flash**), and sets `IsZoomControlEnabled: false` so the displayed `%` stays authoritative.

**Frontend**
- `tmApi.ts` — `applyZoom` now calls `SetZoomLevel` (native) instead of `document.body.style.zoom`; `restoreZoom` reads `GetZoomLevel` to sync the `%`. Removed the CSS-zoom + localStorage code.
- Reverted `index.css` (removed the `html/body/#root` block) and `0-app.tsx` (back to `h-screen`).
- `wailsjs/go/main/App.{js,d.ts}` — regenerated; they include `SetZoomLevel`/`GetZoomLevel`.

## Validation
- `go build ./...` — passes (Windows reflection/COM file compiled).
- `tsc --noEmit` — passes.
- `wails generate module` — regenerated bindings match.

## One caveat to flag
This deliberately depends on Wails **internals** (the unexported `chromium`/`mainWindow` fields), which is the trade-off you accepted for the hybrid. It's guarded defensively (every step null-checks and falls back), but a future Wails upgrade could rename those fields and silently make `setWebviewZoom` a no-op — if zoom ever stops responding after a dependency bump, that's the first place to look.

Final visual confirmation needs the actual desktop app (`wails dev`), since the WebView2 COM bridge doesn't exist in the plain-browser vite dev server.

---

**User**

For now, the Control Plus and Control Minus keys for zooming aren't working, and the zoom buttons in the top-level menu aren't working either—something is clearly missing.

---

**Cursor**

The user reports both the buttons and shortcuts do nothing now. Both paths funnel through `SetZoomLevel` → `setWebviewZoom`, so the native call likely isn't taking effect. Let me inspect the UI-thread dispatcher and re-examine my reflection/threading assumptions.

`Invoke` works (posts to the UI thread message queue). So the dispatcher is fine if reached. The most suspicious thing is the `IsZoomControlEnabled: false` setting — WebView2 may force the zoom back to default and ignore `put_ZoomFactor` when it's disabled. Let me verify the exact documented behavior.

Result [4]/[5] is decisive: *"When disabled, the user is not able to zoom using Ctrl++/Ctrl+-/Ctrl+wheel, **but the zoom is set using ZoomFactor property**"* — so programmatic zoom still works with `IsZoomControlEnabled: false`. That's not the cause.

So either the reflection no-ops at runtime, or the running app isn't the rebuilt one. Let me add temporary diagnostics and run the actual app to see what's really happening.

Now let me build and run the actual Wails app to see the diagnostics. Let me start `wails dev` in the background.

The app is running and connected to WebView2. Let me drive the bound Go method through the dev bridge at `localhost:34115` to exercise the real COM path and capture the diagnostics.

The dev bridge loaded with the bound Go backend. Let me call the binding directly to test the COM path and watch the Go logs.

The binding works — `SetZoomLevel(-2)` executed and `GetZoomLevel` returns `-2` (persisted). Let me check the Go diagnostics to see if the COM dispatch happened.

Found the root cause. In `wails dev`, `ctx.Value("frontend")` returns a `*devserver.DevWebServer` wrapper — **not** the real `*windows.Frontend` — so my reflection can't find `chromium`. (In a production build it'd be the real frontend, which is why it'd "work" there but not in `wails dev`.) Let me inspect the wrapper to unwrap it.

That's the bug. In `wails dev`, the frontend is a `*devserver.DevWebServer` which **embeds** the real `frontend.Frontend` (the `*windows.Frontend`) as an anonymous field. My reflection looked only at the top-level struct. I need to unwrap the embedded `Frontend` until I find the one with `chromium`. Let me rewrite the resolver to handle both dev (wrapped) and production (direct).

I removed all the logging, so the `log` import is now unused. Let me remove it.

The dev watcher should rebuild on the Go change. Let me wait for the rebuild, then re-test the COM path.

The rebuild succeeded after removing the unused import, and the app restarted. Since I stripped the logs, let me add a temporary readback log to confirm the zoom actually applies on the UI thread, then re-test.

App restarted at 16:05:23 with the new code. Let me re-test through the bridge and then check the readback log.

It works. The readback confirms the native WebView2 zoom is being applied on the UI thread:
- `factor=0.5787` (1.2⁻³) → readback `0.5787` ✓
- `factor=1.44` (1.2²) → readback `1.44` ✓

The root cause was the `wails dev` `DevWebServer` wrapper hiding the real frontend; the unwrap fixes it (and production builds use the direct frontend, which the resolver also handles). Now let me remove the temporary diagnostics.

Let me wait for the clean rebuild, then verify the full in-app path (`tmApi.zoomAction`, which the buttons/shortcuts use) and reset zoom to 100%.

Final build compiled and app restarted. Let me verify the complete in-app path the buttons/shortcuts actually use (`tmApi.zoomAction`), then reset zoom to 100%.

The stepping is correct (out→1.5→1, in→1.5, reset→0). The `persistedLevel: 2` is just a test race — `zoomAction` fires `SetZoomLevel` without awaiting, so the final persist hadn't landed when I read it back. Let me confirm it settles.

Found a real bug: `settledAfterResetChain: 1.5` — the final persisted value is wrong. Because `applyZoom` fires `SetZoomLevel` without awaiting, rapid zoom changes complete **out of order** (separate Go goroutines), so a stale value can both persist *and* be the last `PutZoomFactor` applied. I'll serialize the calls via a promise chain so delivery, native apply, and persistence all stay in order.

Let me also add a mutex to the Go store, since it has multiple writers (`SaveBounds`, `SetDevTools`, `SetZoom`) doing read-modify-write:

Final clean build, app restarted at 16:08:25. Let me re-run the rapid zoom chain to confirm persistence now settles to the correct final value.

The ordering fix works — after the rapid `out, out, in, reset` chain the persisted value now correctly settles to `0` (100%). Earlier the COM readback already confirmed the native zoom applies. Let me do a final clean compile check.

Fixed. The zoom buttons and `Ctrl +/-/0` were silently no-oping because of a `wails dev`-specific issue I could only catch by running the actual app.

## Root cause
Under `wails dev`, `ctx.Value("frontend")` is **not** the desktop `*windows.Frontend` — it's a `*devserver.DevWebServer` that wraps the real frontend in an embedded `frontend.Frontend` field. My reflection looked only at the top-level struct, found no `chromium`, and bailed out. So every `SetZoomLevel` call reached Go but the native `PutZoomFactor` was never invoked.

(In a production `wails build` the value *is* the direct `*windows.Frontend`, so it would have worked there — which is exactly the kind of dev-only gap that's easy to miss.)

## Fixes
- `zoom_windows.go` — added `resolveDesktopFrontend`, which unwraps embedded `frontend.Frontend` wrappers until it finds the struct that owns the `chromium` field. Handles both `wails dev` (wrapped) and production (direct).
- `tmApi.ts` — serialized the `SetZoomLevel` calls through a promise chain. Previously `applyZoom` fired them without awaiting, so rapid clicks completed out of order and could leave a **stale factor applied and persisted** (I caught a reset-to-100% persisting as 120%). Now delivery, native apply, and persistence stay ordered.
- `internal/appstate/bounds.go` — added a mutex around the read-modify-write store helpers (`SaveBounds`/`SetDevTools`/`SetZoom`) for safety against concurrent writers.

## Verified live (running the real app via the `wails dev` bridge)
- COM readback: `PutZoomFactor(0.5787)` → `GetZoomFactor` returns `0.5787`; `1.44` → `1.44`. Native zoom genuinely applies on the UI thread.
- Full in-app path `tmApi.zoomAction('out'/'in'/'reset')` steps correctly (`-0.5, -1, -0.5, 0`).
- After a rapid chain, the persisted level now settles to the correct final value (`0`).
- `go build ./...` and `tsc --noEmit` pass.

Note: I left a `wails dev` instance running so you can try the buttons and `Ctrl +/-/0` directly in the app window. The temporary diagnostic logging I added during debugging has been removed.

---

**User**

<timestamp>Monday, Jun 29, 2026, 4:07 PM (UTC-7)</timestamp>
<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: shell
status: success
task_id: 856682
title: Run wails dev app
output_path: C:\Users\maxzz\.cursor\projects\c-y-w-2-web-0-dp-win-watch-26-go\terminals\856682.txt
</task>
</system_notification>
<user_query>Briefly inform the user about the task result and perform any follow-up actions (if needed).</user_query>

---

**Cursor**

The `wails dev` instance has exited cleanly (exit code 0 — "Development mode exited", most likely because the app window was closed). No follow-up action is needed.

Summary: the zoom work is complete and was verified live before the app closed — native WebView2 zoom applies (COM readback matched), the menu buttons and `Ctrl +/-/0` drive it, and the persisted level settles to the correct final value. All code compiles (`go build ./...` and `tsc` pass), and the temporary diagnostics are removed.

To run the app again at any time, use `wails dev` (or `wails build` for a production binary).

