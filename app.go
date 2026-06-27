package main

import (
	"context"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/maxzz/win-watch-26/internal/appstate"
	"github.com/maxzz/win-watch-26/internal/winwatch"
)

// App wires together application lifecycle: it restores/saves the window
// bounds and stops native background work on shutdown. It also owns the Wails
// runtime context and exposes it to the bound API via Context().
type App struct {
	ctx     context.Context
	service *winwatch.Service
	store   *appstate.BoundsStore
}

// NewApp constructs the application controller.
func NewApp(service *winwatch.Service, store *appstate.BoundsStore) *App {
	return &App{service: service, store: store}
}

// Context returns the current Wails runtime context (nil before startup).
func (a *App) Context() context.Context {
	return a.ctx
}

// startup is invoked by Wails once the runtime context is available.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	if b, ok := a.store.Load(); ok {
		wruntime.WindowSetSize(ctx, b.Width, b.Height)
		wruntime.WindowSetPosition(ctx, b.X, b.Y)
	}
}

// beforeClose persists the current window bounds. Returning false allows the
// window to close.
func (a *App) beforeClose(ctx context.Context) bool {
	w, h := wruntime.WindowGetSize(ctx)
	x, y := wruntime.WindowGetPosition(ctx)
	a.store.Save(appstate.Bounds{X: x, Y: y, Width: w, Height: h})
	return false
}

// shutdown stops native monitoring on exit.
func (a *App) shutdown(ctx context.Context) {
	a.service.Shutdown()
}
