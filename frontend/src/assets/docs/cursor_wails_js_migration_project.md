# Wails.js migration project
_Exported on 6/27/2026 at 15:52:30 PDT from Cursor (3.9.8)_

---

**User**

I have a project built with Electron and Node.js that utilizes a Node.js native API. 
The project is here C:\y\w\2-web\0-dp\win-watch-25
The project needs to be migrated to Wails.js while keeping the user interface virtually unchanged (making only the minimal adjustments required for the transition), and the plugin for interacting with the native API must be rewritten in Go.
The ultimate goal is to have an application that runs only on Windows but takes up significantly less space than an Electron app.	

The project is not yet finalized and will be expanded in the future, so it is essential to keep the modules as independent of one another as possible—in other words, to maintain a well-structured project. 
Since this project uses React, any new functionality must utilize state management—not standard React state, but rather a dedicated solution with Jotai and valtio libraries.

The new project should use pnpm and be ready to be hosted on github.

Feel free to ask any necessary questions, particularly regarding the architecture and project layout.

---

**Cursor**

I'll research the existing project to understand its structure, the native API it uses, and the UI before proposing a migration plan. Let me explore both the source project and the current workspace.

PowerShell shell. Let me use the dedicated tools instead.

The current workspace is empty (fresh start). The source project already uses pnpm workspaces. Let me explore its structure deeply.

Now let me explore the three main parts: the Electron app (React + main), the NAPI plugin API surface, and the native C++ code.

This is a substantial project. Let me examine the key interface surfaces: the native API (binding.cpp + headers), the preload bridge, the main process, and the renderer's current state management.

I have the full native API surface (10 functions). Now let me look at the native headers, the Electron main process, the preload IPC bridge, and the current renderer state management.

The renderer already uses Jotai. Now let me read the preload bridge and main-process IPC layer — these define the exact contract the Go/Wails backend must replicate.

Now let me look at the IPC handlers implementation, the electron package.json (dependency stack), and how the renderer accesses `tmApi`.

Let me see how the renderer accesses `tmApi`, and check the renderer entry point and the active-window hook.

The renderer calls a global `tmApi` (only ~8 files). Let me review the remaining main-process responsibilities (shortcuts, ini options, window bounds, zoom) and the renderer entry/config to fully scope the migration.

Let me gauge the native code complexity (the biggest rewrite risk) and check the renderer entry.

I now have a thorough understanding of the project. Let me check the local toolchain availability while I prepare my questions.

I now have a thorough understanding of the project. Here's what I found:

- **Source stack**: Electron + React 19 + Tailwind v4 + shadcn/Radix + Jotai (with `jotai-valtio`, `jotai-family`, `jotai-effect`) + Valtio + Motion + Sonner. So Jotai/Valtio are already in use.
- **Native layer**: ~1000 lines of C++ (`native/`) using Microsoft UI Automation (COM) + Win32, exposed through a NAPI addon with **10 functions + 1 event callback** (`getTopLevelWindows`, `getControlTree`, `start/stopMonitoring`, `invokeControl`, `highlightRect`, `hideHighlight`, `getWindowRect`, `getControlCurrentBounds`, `isWindowHandleValid`, and the `active-window-changed` push event).
- **Renderer ↔ backend contract**: the renderer calls a single global `tmApi` (the `WinWatchApi` interface), referenced in only ~8 files. This is the clean seam to retarget onto Wails.
- **Main-process extras** beyond native: window-bounds persistence (`init.json`), zoom (WebContents zoom), global shortcuts (zoom + `Ctrl+,` → open Options), quit.
- **Toolchain present**: Go 1.26.3, Wails v2.12.0, Node 24, pnpm 10. No `gcc`/C compiler (so cgo is not available; pure-Go COM interop via `go-ole` is the natural path).

Before I write the plan, two decisions meaningfully shape the architecture.

**Wails migration: key architecture decisions**

> **Which Wails version should the new project target? (v2.12.0 is already installed on this machine; v3 is still pre-release.)**
> - Wails v2 (Recommended) - stable, installed, mature docs/bindings ✔
> - Wails v3 (alpha) - newer architecture, better multi-window, but pre-release and not yet installed

> **What should this migration effort deliver? The Go rewrite of the UI Automation native layer (go-ole COM interop) is the largest and riskiest piece.**
> - Phased (Recommended) - scaffold full Wails project + port the React UI + Go backend with the complete tmApi binding surface, implementing native UIA methods incrementally (getTopLevelWindows/monitoring/highlight first, deeper control-tree details next) ✔
> - Full port in one pass - everything working end-to-end including the complete control-tree/invoke/bounds UIA reimplementation before handing back
> - Scaffold + structure only - project layout, build config, frontend wired to stubbed Go bindings; native implemented later

> **Confirm the native implementation strategy in Go (no C compiler is installed, so cgo is unavailable):**
> - Pure Go via go-ole + golang.org/x/sys/windows (Recommended) - true rewrite, no C/C++, no cgo; UIA through COM interop ✔
> - Interim: load the existing prebuilt WindowMonitor.dll via syscall while the Go UIA code is written, then remove it
> - Install a C compiler and wrap/keep C++ via cgo (heavier, against the 'rewrite in Go' goal)

Both decisions are clear: Wails v2, phased delivery, pure-Go `go-ole`. Let me confirm a few frontend specifics (settings persistence via Valtio, shadcn/Tailwind config) so the plan is accurate.

I now have everything I need. Settings persist via `localStorage` (unchanged under WebView2), the renderer accesses a global `tmApi`, and the `@renderer` alias maps to the renderer source root. Here is the migration plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll start implementing. Let me first set up the todos and gather the full picture of what I need to port.

Let me gather the full renderer file tree and check for any Electron/Node-specific imports in the renderer that need adaptation.

No real Electron/Node imports in the renderer (matches are just variable names) — it's cleanly portable. Let me read a few config/entry files I'll need to adapt, then scaffold.

Let me read the native `Utils.h` (handle hex format) and the renderer's `handles.ts` to match formats exactly, plus the remaining native sources I'll port.

Now let me read the two largest native files (`ControlTree.cpp` for UIA and `ControlHighlighter.cpp` for the overlay) so I can port them accurately.

Now the highlighter (overlay window) implementation.

I now have the complete native picture. Let me check the window-creation defaults and the highlight/zoom renderer usage so the Go window options and shim match, then start scaffolding.

I have everything I need. Let me scaffold the Go project. First initialize the module and create the directory structure.

Now let me write the Go backend. Starting with the `win32` syscall layer (the foundation).

Now the highlight overlay window (layered window + GDI) in the `win32` package.

Now the active-window monitor (`SetWinEventHook` + message loop).

I need to fix the callback creation — `windows.NewCallback` requires all `uintptr`-sized params. Let me correct it.

Now the most involved piece: the UI Automation layer via direct COM vtable calls (`internal/winwatch/uia`).

I left some placeholder helpers. Let me fix the worker and use `runtime` + the `win32` package properly.

Now let me add JSON tags to `win32.Rect` (the renderer expects lowercase keys), then write the service.

Now the app-state (bounds persistence), the Wails bindings, and the app/main entry points.

Now the `App` lifecycle and `main.go`.

Now the Wails config, the embed placeholder, and then fetch Go dependencies.

Now let me try building the Go backend to catch compile errors early.

The Go backend compiles. Let me add the remaining scaffold files (`.gitignore`, `pnpm-workspace.yaml`), then run `go vet`.

The vet warnings are the expected "possible misuse of unsafe.Pointer" from manual COM vtable calls on native memory — they don't affect the build (`go build` and Wails don't run vet). Moving on to the frontend port.

Let me copy the renderer source tree and assets into the new frontend, and check for public assets.

Let me locate the favicon and check how public assets are referenced.

Now the frontend config files. Let me read the CSS entry first, then write `package.json`, `vite.config.ts`, `tsconfig`, and `index.html`.

Now let me check which ambient global types the renderer relies on, then create the shim and global types.

Now update `main.tsx` to install the shim before rendering.

Now let me generate the Wails JS bindings so the shim's imports resolve.

Bindings generated. Let me verify the generated API signatures match my shim.

The generated `SetContext` is being bound (pulling in a `context` model import). Let me refactor to capture the context via a closure instead of a bound method, keeping the API surface clean.

Now update `app.go` and `main.go` for the new wiring.

Need to remove the now-unused `bindings` import in `app.go`.

Bindings are clean now. Let me install the frontend dependencies with pnpm.

Now the critical test — type-check and build the ported frontend.

Most errors cluster into fixable causes. The key one: `tmApi.d.ts` sitting next to `tmApi.ts` makes TS treat it as that module's declaration file (module-scoped, not global). Let me investigate the `PA` and `Getter` globals in the original project.

The `PA` and `Getter` globals live in `electron/src/vite-typescript/jotai-types.d.ts` (outside the copied tree). Let me read it and the other files in that folder.

These are global ambient types kept outside the renderer tree. Let me recreate the needed ones, fix the `tmApi.d.ts` module-pairing issue, and adjust `tsconfig`.

Now update `tsconfig` to stop type-checking the generated `wailsjs` JS.

The frontend builds cleanly (the red text is just PowerShell echoing the chunk-size warning to stderr; exit code 0). Let me update progress and run a full `wails build` to validate end-to-end integration.

The full build succeeded, producing `WinWatch.exe`. Let me check its size (a key goal vs Electron).

11.5 MB single exe — versus Electron's 150+ MB. Let me do a launch smoke test to confirm the app starts and the native window enumeration doesn't crash.

The app launches and runs without crashing (WebView2 loads, React renders, `EnumWindows` runs on startup). Let me check what Wails generated under `build/` and finalize the icon/manifest and README.

Wails generated default icon and manifest. Now let me write the README and run `go mod tidy` to finalize the module.

Let me harden the monitor's message loop — out-of-context WinEvent hooks need full message pumping (dispatch), which I omitted.

Let me do a final production build and launch smoke test to confirm everything works after the fixes.

All todos are complete. Let me do a final lint check on the files I authored.

All eight to-dos are complete. The Electron + NAPI/C++ app has been migrated to a working Wails v2 + Go application.

## Summary

**Result:** `wails build` produces a single `build/bin/WinWatch.exe` at **11.5 MB** (vs Electron's ~150+ MB). It launches and runs without crashing; `go build`, the TypeScript `tsc` check, and the Vite production build all pass.

### What was built

**Go backend (pure Go, no cgo):**
- [`internal/winwatch/win32`](C:/y/w/2-web/0-dp/win-watch-26-go/internal/winwatch/win32) — `EnumWindows` window list, foreground monitoring via `SetWinEventHook`, and the layered GDI highlight overlay (each on its own OS-locked message-loop goroutine).
- [`internal/winwatch/uia`](C:/y/w/2-web/0-dp/win-watch-26-go/internal/winwatch/uia) — UI Automation through direct COM vtable calls: control-tree walk, invoke/toggle, and current bounds, all serialized onto one MTA thread.
- [`internal/winwatch/service.go`](C:/y/w/2-web/0-dp/win-watch-26-go/internal/winwatch/service.go) — framework-independent API returning the **same JSON** the old C++ addon produced.
- [`internal/bindings/api.go`](C:/y/w/2-web/0-dp/win-watch-26-go/internal/bindings/api.go) — Wails-bound surface mirroring the old `tmApi`, emitting `active-window-changed` over the runtime event bus.
- [`internal/appstate/bounds.go`](C:/y/w/2-web/0-dp/win-watch-26-go/internal/appstate/bounds.go) + [`app.go`](C:/y/w/2-web/0-dp/win-watch-26-go/app.go) — window-bounds persistence and lifecycle.

**Frontend (React UI virtually unchanged):**
- The renderer was copied into [`frontend/src`](C:/y/w/2-web/0-dp/win-watch-26-go/frontend/src) (Jotai + Valtio store preserved).
- [`frontend/src/api/tmApi.ts`](C:/y/w/2-web/0-dp/win-watch-26-go/frontend/src/api/tmApi.ts) is the only real adaptation — a shim that maps the global `tmApi` onto Wails bindings/events, plus CSS zoom and the `Ctrl+,` shortcut (formerly Electron main-process features).
- Global ambient types (`PA`, `Getter`, `Rect4`, etc.) that lived outside the renderer were re-added under `frontend/src/types`.

**Tooling:** pnpm workspace, `wails.json` wired to pnpm, `.gitignore`, and a comprehensive [`README.md`](C:/y/w/2-web/0-dp/win-watch-26-go/README.md). GitHub-ready (I did not run `git init`/commit, per your control).

### Notes
- The 4 remaining lint items are `go vet` "possible misuse of unsafe.Pointer" warnings inherent to manual COM vtable calls on native (non-GC) memory — they don't affect the build.
- Per the plan, two minor known gaps: `hasHtmlAccess` is reported as `false` (HTML/IAccessible probing not ported), and `uiAccess`/code-signing are out of scope.

I verified startup non-interactively (process stays alive, exercising `EnumWindows`), but I couldn't drive the native window's UI from here — running `wails dev` and clicking through window/control selection + highlight is the recommended final visual parity check against the Electron app.

