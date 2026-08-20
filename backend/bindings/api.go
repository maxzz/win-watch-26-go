// Package bindings exposes the Wails-bound API surface. It mirrors the exact
// method set the React renderer expects (the former Electron `tmApi`), keeping
// the JSON-string contract, and delegates to the framework-independent
// winwatch.Service. Active-window changes are pushed to the frontend via the
// Wails runtime event bus.
package bindings

import (
	"context"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/maxzz/win-watch-26/backend/fileicon"
	"github.com/maxzz/win-watch-26/backend/winlaunch"
	"github.com/maxzz/win-watch-26/backend/winwatch"
)

// EventActiveWindowChanged is the event name the frontend subscribes to.
const EventActiveWindowChanged = "active-window-changed"

// EventWindowPicker is streamed while the window-finder drag is active.
const EventWindowPicker = "window-picker"

// Api is the struct bound into the frontend by Wails. The Wails runtime
// context is obtained lazily through ctxFn so that no context-setter method is
// exported to the frontend.
type Api struct {
	ctxFn   func() context.Context
	service *winwatch.Service
	quitFn  func()
}

// NewApi creates the bound API around a winwatch service. ctxFn must return the
// current Wails runtime context (available after startup) or nil. quitFn is the
// explicit-exit path (RequestExit) so menu Exit does not hide-to-tray.
func NewApi(service *winwatch.Service, ctxFn func() context.Context, quitFn func()) *Api {
	return &Api{service: service, ctxFn: ctxFn, quitFn: quitFn}
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

// GetWindowDetailInfo returns JSON with detailed Win32 window properties.
func (a *Api) GetWindowDetailInfo(handle string) string {
	return a.service.GetWindowDetailInfo(handle)
}

// GetControlAccInteract returns JSON with UIA patterns and MSAA actions
// for the control identified by handle + runtimeId.
func (a *Api) GetControlAccInteract(handle, runtimeId string) string {
	return a.service.GetControlAccInteract(handle, runtimeId)
}

// ExecuteAccAction runs a UIA or MSAA action. kind is "uia" or "msaa".
func (a *Api) ExecuteAccAction(handle, runtimeId, kind, actionId, value string) string {
	return a.service.ExecuteAccAction(handle, runtimeId, kind, actionId, value)
}

// RevealInExplorer opens File Explorer with path selected (highlighted).
func (a *Api) RevealInExplorer(path string) error {
	return winlaunch.RevealInExplorer(path)
}

// GetFileIcons accepts a JSON string array of file paths and returns a JSON
// array of {path, dataUrl, error?} entries (PNG data URLs with transparency).
func (a *Api) GetFileIcons(pathsJSON string) string {
	return fileicon.ExtractManyJSON(pathsJSON)
}

// StartWindowPicker begins a window-finder drag. Move/up payloads are emitted
// as EventWindowPicker JSON strings; the UI is not blocked.
func (a *Api) StartWindowPicker() bool {
	return a.service.StartWindowPicker(func(payload string) {
		if ctx := a.ctx(); ctx != nil {
			wruntime.EventsEmit(ctx, EventWindowPicker, payload)
		}
	})
}

// StopWindowPicker cancels an in-progress window-finder drag.
func (a *Api) StopWindowPicker() bool {
	return a.service.StopWindowPicker()
}

// QuitApp quits the application via RequestExit so close-to-tray is not used.
func (a *Api) QuitApp() {
	if a.quitFn != nil {
		a.quitFn()
		return
	}
	if ctx := a.ctx(); ctx != nil {
		wruntime.Quit(ctx)
	}
}
