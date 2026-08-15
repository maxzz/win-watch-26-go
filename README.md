# WinWatch (Wails + Go)

A Windows UI Automation inspector: see any desktop app the way accessibility
and automation APIs see it.

## Table of contents

- [About](#about)
- [Project structure](#project-structure)
  - [Architecture](#architecture)
  - [Native layer (pure Go)](#native-layer-pure-go)
- [Migration notes / known differences](#migration-notes--known-differences)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [License](#license)

## About

Windows apps do not expose a DOM. Buttons, tabs, and trees live behind
[UI Automation](https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32)
and Win32 — useful for accessibility, test automation, and debugging, and
almost invisible without a dedicated inspector.

**WinWatch** (UI Automation Monitor) is that inspector. Pick a top-level
window, walk its live control tree, read names, roles, bounds, and process
details, draw a highlight on the real screen, and invoke a control when you
need to prove it is the one you think it is.

- **Follow focus** — the window list tracks the foreground app as you click
  around the desktop.
- **Auto-highlight** — the selected control is outlined on screen so you can
  match tree nodes to pixels.
- **Three-pane inspector** — top-level windows, the UIA control tree, and
  Accessibility / General / Window Extra properties.
- **Invoke** — fire the default action on a control without writing a script.
- **Light and dark** — the same workspace in either theme.

WinWatch is also a research instrument for people who build *other* tools
that have to live inside real applications. Most desktop software never
ships a public API. The only stable surface is the UI itself: windows,
controls, names, automation IDs, bounds, and the process that owns them.
Before you can fill a login dialog, scrape a status field, drive a vendor
console from a script, or write an accessibility check, you need a map of
that surface — not a screenshot, the live tree the OS actually exposes.

That map is what WinWatch produces. You attach to a running app, walk its
control tree, and collect the identifiers your integrator will need:
window class and handle, process path and PID, control type, Automation
ID, runtime ID, enabled/visible state, and on-screen rectangle. Highlight
proves you have the right node. Invoke proves the default action is
reachable. The property pane is the notebook you fill before you write a
line of automation.

From there you can design a companion: a password manager that targets a
native dialog, a test harness that clicks through a UI with no API, an
RPA-style workflow, or an in-house helper that talks to software you do
not own. WinWatch does not replace those tools — it is how you learn the
application well enough to build them.

This is a [Wails v2](https://wails.io) + Go port of the original Electron +
Node.js (NAPI/C++) application. The React UI is virtually unchanged; the native
UI Automation layer was rewritten in **pure Go** (no cgo). The result is a
single Windows executable that is dramatically smaller than the Electron build
(~12 MB vs ~150+ MB), and you do not need a C/C++ compiler to build it.

<p align="center">
  <img src="docs/preview-light.png" alt="WinWatch in light theme: top-level windows, control tree, and properties" width="48%">
  &nbsp;
  <img src="docs/preview-dark.png" alt="WinWatch in dark theme: the same three-pane inspector" width="48%">
</p>

<p align="center">
  <em>Light and dark themes — windows, controls, and properties side by side.</em>
</p>

## Project structure

```
win-watch-26-go/
├─ main.go                  Wails bootstrap (embeds frontend/dist, window options, Bind)
├─ wails.json               Wails config (frontend commands use pnpm)
├─ backend/                 Go application code (same layout as traytools-26)
│  ├─ app.go                App lifecycle: window-bounds restore/save, shutdown
│  ├─ winwatch/             The native "plugin" - framework-independent
│  │  ├─ service.go         Public Go API (returns the same JSON as the old C++ addon)
│  │  ├─ win32/             Win32 syscalls: window enumeration, foreground monitor, highlight overlay
│  │  ├─ uia/               UI Automation via direct COM vtable calls (control tree, invoke, bounds)
│  │  └─ windowdetail/      Win32 window + process properties (General / Window Extra tabs)
│  ├─ fileicon/             Extract file icons as PNG data URLs
│  ├─ winlaunch/            Reveal a path in File Explorer
│  ├─ platform/             DevTools window detect/close
│  ├─ appstate/             Host persistence (window bounds, zoom, DevTools in %AppData%)
│  └─ bindings/             Wails-bound API (mirrors the former `tmApi`) + runtime events
└─ frontend/                React app (pnpm package)
   ├─ src/                  Ported renderer (components, Jotai/Valtio store, utils, assets)
   │  └─ api/
   │     ├─ tmApi.ts        Bootstrap: Wails bindings or a browser stub
   │     ├─ tmApi.wails.ts  Maps `tmApi` onto generated Wails bindings + events
   │     └─ tmApi.browser.ts Layout/theming stub (native calls are no-ops)
   ├─ wailsjs/              Generated Go bindings + runtime (regenerated on build)
   └─ vite.config.ts        Vite + React + Tailwind v4, `@renderer` alias -> src
```

### Architecture

The renderer calls a single global, `tmApi` (the `WinWatchApi` interface). In
the Wails build that global is provided by `frontend/src/api/tmApi.wails.ts`,
which delegates to the generated Wails bindings
(`frontend/wailsjs/go/bindings/Api`) and the Wails runtime event bus. Under
Vite alone, `tmApi.browser.ts` supplies a stub so the UI can be styled without
the native backend.

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

`backend/winwatch` reimplements the original C++ DLL + NAPI addon:

| Capability               | Implementation                                             |
| ------------------------ | ---------------------------------------------------------- |
| Top-level window list    | `EnumWindows` + window text/class/process/rect (`win32`)   |
| Active-window monitoring  | `SetWinEventHook(EVENT_SYSTEM_FOREGROUND, ...)` (`win32`)  |
| Highlight overlay        | Layered window + GDI on a dedicated message-loop goroutine |
| Control tree / invoke    | `IUIAutomation` via direct COM vtable calls (`uia`)        |

## Migration notes / known differences

- **Zoom** and the **Ctrl+,** (open Options) shortcut were Electron
  main-process features. Zoom is now native WebView2 page zoom
  (`App.SetZoomLevel`, persisted as `zoomLevel` in `init.json`). **Ctrl+,**
  remains a `keydown` listener in `tmApi.wails.ts`.
- **`hasHtmlAccess`** (IAccessible/IHTMLElement probing) from the original
  control-tree walker is not ported and is reported as `false`.
- `uiAccess=true` / Authenticode code-signing (from the original packaging) are
  out of scope for this port.

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
pnpm build
```

### Developer tools

Toggle DevTools with **Ctrl+Shift+F12** or **Ctrl+Shift+I** (same approach as
`traytools-26` / `to-diag-trace-go`). Each toggle saves whether DevTools are open
to `%AppData%/WinWatch/init.json` (`devTools`). On the next launch, Wails
`OpenInspectorOnStartup` restores that state.

The `pnpm build` script uses `-debug -devtools` with a GUI subsystem linker flag
so DevTools can reopen on startup without attaching a console window.

## License

MIT
