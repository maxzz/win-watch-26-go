package main

import (
	"context"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/maxzz/win-watch-26/internal/appstate"
	"github.com/maxzz/win-watch-26/internal/platform"
	"github.com/maxzz/win-watch-26/internal/winwatch"
)

// App wires together application lifecycle: it restores/saves the window
// bounds and stops native background work on shutdown. It also owns the Wails
// runtime context and exposes it to the bound API via Context().
type App struct {
	ctx     context.Context
	service *winwatch.Service
	store   *appstate.Store
}

// NewApp constructs the application controller.
func NewApp(service *winwatch.Service, store *appstate.Store) *App {
	return &App{service: service, store: store}
}

// Context returns the current Wails runtime context (nil before startup).
func (a *App) Context() context.Context {
	return a.ctx
}

// startup is invoked by Wails once the runtime context is available.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	if s, ok := a.store.Load(); ok && s.BoundsValid() {
		wruntime.WindowSetSize(ctx, s.Width, s.Height)
		wruntime.WindowSetPosition(ctx, s.X, s.Y)
	}
}

// beforeClose persists window bounds and the actual DevTools visibility.
// Querying the OS here is the source of truth: it captures the real state no
// matter how DevTools were closed (the DevTools window's own close button, F12
// inside it, the native Wails hotkey, etc.), which the frontend toggle cannot
// observe. Returning false allows the window to close.
// (Same approach as traytools-26 / to-diag-trace-go.)
func (a *App) beforeClose(ctx context.Context) bool {
	w, h := wruntime.WindowGetSize(ctx)
	x, y := wruntime.WindowGetPosition(ctx)
	a.store.SaveBounds(x, y, w, h)
	a.store.SetDevTools(platform.IsDevToolsOpen())
	return false
}

// ToggleDevTools lets the Ctrl+Shift+F12 / Ctrl+Shift+I shortcuts also *close*
// DevTools: WebView2 only opens the inspector via its native accelerator, so
// when it is already open we close the app-owned DevTools window with WM_CLOSE.
// The persisted state is captured authoritatively in beforeClose (same approach
// as traytools-26 / to-diag-trace-go).
func (a *App) ToggleDevTools() {
	if platform.IsDevToolsOpen() {
		platform.CloseDevTools()
	}
}

// shutdown stops native monitoring on exit.
func (a *App) shutdown(ctx context.Context) {
	a.service.Shutdown()
}
