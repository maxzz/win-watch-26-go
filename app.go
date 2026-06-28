package main

import (
	"context"
	"time"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/maxzz/win-watch-26/internal/appstate"
	"github.com/maxzz/win-watch-26/internal/platform"
	"github.com/maxzz/win-watch-26/internal/winwatch"
)

// App wires together application lifecycle: it restores/saves the window
// bounds and stops native background work on shutdown. It also owns the Wails
// runtime context and exposes it to the bound API via Context().
type App struct {
	ctx                  context.Context
	service              *winwatch.Service
	store                *appstate.Store
	openDevToolsOnStartup bool
}

// NewApp constructs the application controller.
func NewApp(service *winwatch.Service, store *appstate.Store, openDevToolsOnStartup bool) *App {
	return &App{
		service:               service,
		store:                 store,
		openDevToolsOnStartup: openDevToolsOnStartup,
	}
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

// domReady runs after the frontend has loaded. Wails only honours
// OpenInspectorOnStartup in dev/debug builds; in production -devtools builds
// we open DevTools here once the WebView2 surface is ready.
func (a *App) domReady(ctx context.Context) {
	if !a.openDevToolsOnStartup || platform.IsDevToolsOpen() {
		return
	}
	go func() {
		// WebView2 may not accept accelerator keys until shortly after DomReady.
		time.Sleep(300 * time.Millisecond)
		if platform.IsDevToolsOpen() {
			return
		}
		platform.OpenDevTools()
	}()
}

// beforeClose persists window bounds and the DevTools-on-startup flag.
// Returning false allows the window to close.
func (a *App) beforeClose(ctx context.Context) bool {
	a.saveWindowOptions(ctx)
	return false
}

func (a *App) saveWindowOptions(ctx context.Context) {
	w, h := wruntime.WindowGetSize(ctx)
	x, y := wruntime.WindowGetPosition(ctx)
	a.store.SaveBounds(x, y, w, h)

	prefs, _ := a.store.Load()
	// Keep an explicit "open on startup" preference, and also remember when
	// DevTools were left open (same approach as traytools-26 / to-diag-trace-go).
	devTools := prefs.DevTools || platform.IsDevToolsOpen()
	a.store.SetDevTools(devTools)
}

// GetDevTools reports whether DevTools should open on startup (init.json).
func (a *App) GetDevTools() bool {
	return a.store.DevTools()
}

// SetDevToolsState sets the DevTools-on-startup flag explicitly (Options dialog).
func (a *App) SetDevToolsState(open bool) {
	a.store.SetDevTools(open)
}

// ToggleDevTools flips DevTools visibility and persists the new state.
// Opening is handled by Wails/WebView2 (Ctrl+Shift+F12); closing uses WM_CLOSE
// on the app-owned DevTools window (same approach as traytools-26 / to-diag-trace-go).
func (a *App) ToggleDevTools() {
	if platform.IsDevToolsOpen() {
		platform.CloseDevTools()
		a.SetDevToolsState(false)
		return
	}
	a.SetDevToolsState(true)
}

// shutdown stops native monitoring on exit.
func (a *App) shutdown(ctx context.Context) {
	a.service.Shutdown()
}
