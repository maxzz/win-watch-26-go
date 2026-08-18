package backend

import (
	"context"
	"math"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/maxzz/win-watch-26/backend/appstate"
	"github.com/maxzz/win-watch-26/backend/hostlife"
	"github.com/maxzz/win-watch-26/backend/platform"
	"github.com/maxzz/win-watch-26/backend/winapp"
	"github.com/maxzz/win-watch-26/backend/winwatch"
)

// App wires together application lifecycle: it restores/saves the window
// bounds and stops native background work on shutdown. It also owns the Wails
// runtime context and exposes it to the bound API via Context().
type App struct {
	ctx     context.Context
	service *winwatch.Service
	store   *appstate.Store
	host    *hostlife.Controller
}

// NewApp constructs the application controller.
func NewApp(service *winwatch.Service, store *appstate.Store) *App {
	return &App{service: service, store: store, host: hostlife.New(store)}
}

// Context returns the current Wails runtime context (nil before startup).
func (a *App) Context() context.Context {
	return a.ctx
}

// Startup is invoked by Wails once the runtime context is available.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.host.SetContext(ctx)

	if s, ok := a.store.Load(); ok && s.BoundsValid() {
		wruntime.WindowSetSize(ctx, s.Width, s.Height)
		// WindowGetPosition saves absolute virtual-screen coords; Wails
		// WindowSetPosition is monitor-relative. Use the traytools probe so
		// restore does not jump to whichever display Windows initially chose.
		winapp.SetWindowPositionAbsolute(ctx, s.X, s.Y)
	}

	a.host.Start()
}

// BeforeClose persists window bounds when the process is actually quitting.
// When quit-on-close is off, the close button hides the window to the tray
// (returning true prevents shutdown). Explicit Exit sets quitRequested first.
func (a *App) BeforeClose(ctx context.Context) bool {
	return a.host.BeforeClose()
}

// ToggleDevTools lets the Ctrl+Shift+F12 / Ctrl+Shift+I shortcuts also *close*
// DevTools: WebView2 only opens the inspector via its native accelerator, so
// when it is already open we close the app-owned DevTools window with WM_CLOSE.
// The persisted state is captured authoritatively in BeforeClose (same approach
// as traytools-26 / to-diag-trace-go).
func (a *App) ToggleDevTools() {
	if platform.IsDevToolsOpen() {
		platform.CloseDevTools()
	}
}

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

// Shutdown stops native monitoring on exit.
func (a *App) Shutdown(ctx context.Context) {
	a.host.Shutdown()
	a.service.Shutdown()
}
