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

// domReady runs after the frontend has loaded. If DevTools were left open in
// the previous session (devTools in init.json), ensure they are shown. Wails
// OpenInspectorOnStartup covers dev/debug builds; this fallback handles
// production builds and any timing gap after navigation.
func (a *App) domReady(ctx context.Context) {
	if !a.store.DevTools() {
		return
	}
	go a.ensureDevToolsOpen()
}

func (a *App) ensureDevToolsOpen() {
	for attempt := 0; attempt < 8; attempt++ {
		if !a.store.DevTools() || platform.IsDevToolsOpen() {
			return
		}
		if attempt > 0 {
			time.Sleep(200 * time.Millisecond)
		}
		platform.OpenDevTools()
	}
}

// beforeClose persists the current window bounds only. DevTools visibility is
// saved when the user toggles it (ToggleDevTools), not on exit.
func (a *App) beforeClose(ctx context.Context) bool {
	w, h := wruntime.WindowGetSize(ctx)
	x, y := wruntime.WindowGetPosition(ctx)
	a.store.SaveBounds(x, y, w, h)
	return false
}

// ToggleDevTools flips DevTools visibility and persists the new state to
// init.json immediately (traytools-26 / to-diag-trace-go pattern).
func (a *App) ToggleDevTools() {
	next := !a.store.DevTools()
	a.store.SetDevTools(next)
	if next {
		if !platform.IsDevToolsOpen() {
			platform.OpenDevTools()
		}
		return
	}
	platform.CloseDevTools()
}

// shutdown stops native monitoring on exit.
func (a *App) shutdown(ctx context.Context) {
	a.service.Shutdown()
}
