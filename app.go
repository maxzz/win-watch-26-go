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

// beforeClose persists window bounds. Returning false allows the window to close.
func (a *App) beforeClose(ctx context.Context) bool {
	w, h := wruntime.WindowGetSize(ctx)
	x, y := wruntime.WindowGetPosition(ctx)
	a.store.SaveBounds(x, y, w, h)
	return false
}

// ToggleDevTools flips DevTools visibility and persists the new state immediately.
// Opening is handled by Wails/WebView2 (Ctrl+Shift+F12); closing uses WM_CLOSE
// on the app-owned DevTools window (same approach as traytools-26 / to-diag-trace-go).
func (a *App) ToggleDevTools() {
	if platform.IsDevToolsOpen() {
		platform.CloseDevTools()
		a.saveDevToolsState(false)
		return
	}
	a.saveDevToolsState(true)
}

func (a *App) saveDevToolsState(open bool) {
	a.store.SetDevTools(open)
}

// shutdown stops native monitoring on exit.
func (a *App) shutdown(ctx context.Context) {
	a.service.Shutdown()
}
