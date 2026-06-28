// Package bindings exposes the Wails-bound API surface. It mirrors the exact
// method set the React renderer expects (the former Electron `tmApi`), keeping
// the JSON-string contract, and delegates to the framework-independent
// winwatch.Service. Active-window changes are pushed to the frontend via the
// Wails runtime event bus.
package bindings

import (
	"context"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/maxzz/win-watch-26/internal/appstate"
	"github.com/maxzz/win-watch-26/internal/winwatch"
)

// EventActiveWindowChanged is the event name the frontend subscribes to.
const EventActiveWindowChanged = "active-window-changed"

// Api is the struct bound into the frontend by Wails. The Wails runtime
// context is obtained lazily through ctxFn so that no context-setter method is
// exported to the frontend.
type Api struct {
	ctxFn   func() context.Context
	service *winwatch.Service
	store   *appstate.Store
}

// NewApi creates the bound API around a winwatch service. ctxFn must return the
// current Wails runtime context (available after startup) or nil. store is used
// to persist host-level preferences (e.g. the developer-tools flag).
func NewApi(service *winwatch.Service, ctxFn func() context.Context, store *appstate.Store) *Api {
	return &Api{service: service, ctxFn: ctxFn, store: store}
}

func (a *Api) ctx() context.Context {
	if a.ctxFn == nil {
		return nil
	}
	return a.ctxFn()
}

// GetTopLevelWindows returns the JSON array of top-level windows.
func (a *Api) GetTopLevelWindows(excludeOwnAppWindows bool) string {
	return a.service.GetTopLevelWindows(excludeOwnAppWindows)
}

// GetControlTree returns the control-view tree JSON for a window handle.
func (a *Api) GetControlTree(handle string) string {
	return a.service.GetControlTree(handle)
}

// StartMonitoring begins foreground monitoring; the handle is accepted for
// API compatibility but ignored. Changes are emitted as runtime events.
func (a *Api) StartMonitoring(handle string) bool {
	return a.service.StartMonitoring(func(payload string) {
		if ctx := a.ctx(); ctx != nil {
			wruntime.EventsEmit(ctx, EventActiveWindowChanged, payload)
		}
	})
}

// StopMonitoring stops foreground monitoring.
func (a *Api) StopMonitoring() bool {
	return a.service.StopMonitoring()
}

// InvokeControl invokes a control by runtime id.
func (a *Api) InvokeControl(handle, runtimeId string) bool {
	return a.service.InvokeControl(handle, runtimeId)
}

// HighlightRect outlines a rectangle on screen. color is RGB (0xRRGGBB).
func (a *Api) HighlightRect(left, top, right, bottom, color, borderWidth, blinkCount int) {
	a.service.HighlightRect(left, top, right, bottom, color, borderWidth, blinkCount)
}

// HideHighlight hides the highlight overlay.
func (a *Api) HideHighlight() {
	a.service.HideHighlight()
}

// GetWindowRect returns the JSON rectangle of a window, or "null".
func (a *Api) GetWindowRect(handle string) string {
	return a.service.GetWindowRect(handle)
}

// GetControlCurrentBounds returns the JSON bounds of a control, or "null".
func (a *Api) GetControlCurrentBounds(handle, runtimeId string) string {
	return a.service.GetControlCurrentBounds(handle, runtimeId)
}

// IsWindowHandleValid reports whether a window handle is valid.
func (a *Api) IsWindowHandleValid(handle string) bool {
	return a.service.IsWindowHandleValid(handle)
}

// GetDevTools reports whether the developer tools are configured to open on
// startup (persisted in init.json).
func (a *Api) GetDevTools() bool {
	if a.store == nil {
		return false
	}
	return a.store.DevTools()
}

// SetDevTools persists whether the developer tools should open automatically on
// startup. The change takes effect on the next application launch.
func (a *Api) SetDevTools(enabled bool) {
	if a.store == nil {
		return
	}
	a.store.SetDevTools(enabled)
}

// QuitApp quits the application.
func (a *Api) QuitApp() {
	if ctx := a.ctx(); ctx != nil {
		wruntime.Quit(ctx)
	}
}
