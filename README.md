# WinWatch (Wails + Go)

A Windows UI Automation Monitor: inspect top-level windows, walk their UI
Automation control trees, monitor the active (foreground) window, highlight
controls on screen and invoke them.

This is a [Wails v2](https://wails.io) + Go port of the original Electron +
Node.js (NAPI/C++) application. The React UI is virtually unchanged; the native
UI Automation layer was rewritten in **pure Go** (no cgo) and the result is a
single Windows executable that is dramatically smaller than the Electron build
(~12 MB vs ~150+ MB).

## Table of contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
  - [Architecture](#architecture)
  - [Native layer (pure Go)](#native-layer-pure-go)
- [Migration notes / known differences](#migration-notes--known-differences)
- [License](#license)

## Requirements

- Windows 10/11 (x64). This app is Windows-only by design.
- [Go](https://go.dev/) 1.26+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation) v2.12+
  (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/) 10+
- The [WebView2 runtime](https://developer.microsoft.com/microsoft-edge/webview2/)
  (preinstalled on current Windows; the build can also bundle it)

No C/C++ compiler is required: the native UI Automation and Win32 code is
implemented with `golang.org/x/sys/windows` and direct COM vtable calls.

## Getting started

```bash
# install frontend dependencies (from the repo root)
pnpm install

# run in development (hot-reloading frontend + Go backend)
pnpm dev

# build a release executable -> build/bin/wwatch26.exe
# (devtools enabled; honours the saved "open on startup" preference)
pnpm build

# build an optimised production executable without -debug
# (devtools can still be toggled with Ctrl+Shift+F12, but won't auto-open on startup)
pnpm build:prod
```

### Developer tools

The WebView2 developer tools can be toggled from **Options... → Developer →
"Open developer tools on startup"**. The preference is stored host-side in
`%AppData%/WinWatch/init.json` (field `devTools`) and is kept in sync when you
toggle DevTools with **Ctrl+Shift+F12** or **Ctrl+Shift+I** (same approach as
`traytools-26` / `to-diag-trace-go`).

On startup the host reads `devTools` and:

1. Sets Wails `OpenInspectorOnStartup` (requires a `-debug` build or `pnpm dev`).
2. Runs a **DomReady fallback** that tries to open DevTools when the flag is set but
   the inspector is not open yet (best-effort for `pnpm build:prod`).

Use `pnpm build` (includes `-debug -devtools`) or `pnpm dev` when you want the saved
"open on startup" preference to take effect. `pnpm build:prod` keeps a smaller binary
but Wails cannot programmatically open DevTools on startup without `-debug`.

Build with `-devtools` (`pnpm build`, `pnpm build:prod`, or `pnpm dev`) so DevTools can be
opened at all in release executables.

## Project structure

```
win-watch-26-go/
├─ main.go                  Wails bootstrap (embeds frontend/dist, window options, Bind)
├─ app.go                   App lifecycle: window-bounds restore/save, shutdown
├─ wails.json               Wails config (frontend commands use pnpm)
├─ internal/
│  ├─ winwatch/             The native "plugin" - framework-independent
│  │  ├─ service.go         Public Go API (returns the same JSON as the old C++ addon)
│  │  ├─ win32/             Win32 syscalls: window enumeration, foreground monitor, highlight overlay
│  │  └─ uia/               UI Automation via direct COM vtable calls (control tree, invoke, bounds)
│  ├─ appstate/             Host persistence (window bounds JSON in %AppData%)
│  └─ bindings/             Wails-bound API (mirrors the former `tmApi`) + runtime events
└─ frontend/                React app (pnpm package)
   ├─ src/                  Ported renderer (components, Jotai/Valtio store, utils, assets)
   │  └─ api/tmApi.ts       Shim mapping the global `tmApi` onto Wails bindings + events
   ├─ wailsjs/              Generated Go bindings + runtime (regenerated on build)
   └─ vite.config.ts        Vite + React + Tailwind v4, `@renderer` alias -> src
```

### Architecture

The renderer calls a single global, `tmApi` (the `WinWatchApi` interface). In
the Wails build that global is provided by `frontend/src/api/tmApi.ts`, which
delegates to the generated Wails bindings (`frontend/wailsjs/go/bindings/Api`)
and the Wails runtime event bus.

```
React UI ──window.tmApi.*──► tmApi shim ──► wailsjs bindings ──► bindings.Api (Go)
                                  │                                     │
                                  └── EventsOn("active-window-changed") │
                                                                        ▼
                                                            winwatch.Service
                                                          (win32 + uia, pure Go)
```

- **State management**: the UI uses [Jotai](https://jotai.org/) atoms together
  with [Valtio](https://valtio.dev/) proxies (e.g. `frontend/src/store`). New
  functionality should follow the same pattern rather than `useState`.
- **JSON contract preserved**: backend methods return the same JSON strings the
  original C++ addon produced, so the renderer's parsing logic is unchanged.

### Native layer (pure Go)

`internal/winwatch` reimplements the original C++ DLL + NAPI addon:

| Capability               | Implementation                                             |
| ------------------------ | ---------------------------------------------------------- |
| Top-level window list    | `EnumWindows` + window text/class/process/rect (`win32`)   |
| Active-window monitoring  | `SetWinEventHook(EVENT_SYSTEM_FOREGROUND, ...)` (`win32`)  |
| Highlight overlay        | Layered window + GDI on a dedicated message-loop goroutine |
| Control tree / invoke    | `IUIAutomation` via direct COM vtable calls (`uia`)        |

## Migration notes / known differences

- **Zoom** and the **Ctrl+,** (open Options) shortcut were Electron
  main-process features; they are reimplemented in the frontend (CSS zoom + a
  `keydown` listener in `tmApi.ts`).
- **`hasHtmlAccess`** (IAccessible/IHTMLElement probing) from the original
  control-tree walker is not ported and is reported as `false`.
- `uiAccess=true` / Authenticode code-signing (from the original packaging) are
  out of scope for this port.

## License

ISC
