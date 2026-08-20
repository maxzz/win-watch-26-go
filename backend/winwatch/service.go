// Package winwatch is the framework-independent "native plugin": it exposes
// the Windows UI Automation / Win32 functionality (window enumeration,
// foreground monitoring, control-tree inspection, control invocation and the
// highlight overlay) behind a small Go API that returns JSON strings matching
// the original C++ addon. It has no dependency on Wails, so it can be reused
// or tested in isolation.
package winwatch

import (
	"encoding/json"
	"os"
	"sync"

	"github.com/maxzz/win-watch-26/backend/winwatch/accinteract"
	"github.com/maxzz/win-watch-26/backend/winwatch/uia"
	"github.com/maxzz/win-watch-26/backend/winwatch/win32"
	"github.com/maxzz/win-watch-26/backend/winwatch/windowdetail"
	"github.com/maxzz/win-watch-26/backend/winwatch/winpicker"
)

// Service is the entry point to the native functionality.
type Service struct {
	monitor     *win32.Monitor
	highlighter *win32.Highlighter
	automation  *uia.Automation
	picker      *winpicker.Session

	hlOnce sync.Once
}

// New constructs a Service. The highlight overlay window is created lazily on
// first use to avoid creating native windows before the app is ready.
func New() *Service {
	return &Service{
		monitor:    win32.NewMonitor(),
		automation: uia.New(),
		picker:     winpicker.NewSession(),
	}
}

func (s *Service) ensureHighlighter() *win32.Highlighter {
	s.hlOnce.Do(func() {
		s.highlighter = win32.NewHighlighter()
	})
	return s.highlighter
}

// GetTopLevelWindows returns the JSON array of visible top-level windows.
// When excludeOwnAppWindows is true, this process's own windows are omitted.
func (s *Service) GetTopLevelWindows(excludeOwnAppWindows bool) string {
	var exclude uint32
	if excludeOwnAppWindows {
		exclude = uint32(os.Getpid())
	}
	infos := win32.EnumerateTopLevelWindows(exclude)
	data, err := json.Marshal(infos)
	if err != nil {
		return "[]"
	}
	return string(data)
}

// GetControlTree returns the control-view tree (JSON) for a window handle.
func (s *Service) GetControlTree(handle string) string {
	hwnd, ok := win32.TryParseHwnd(handle)
	if !ok {
		return "{}"
	}
	node, ok := s.automation.GetControlTree(uintptr(hwnd))
	if !ok {
		return "{}"
	}
	data, err := json.Marshal(node)
	if err != nil {
		return "{}"
	}
	return string(data)
}

// StartMonitoring begins foreground-window monitoring. The callback receives a
// JSON string of the shape {"handle":"0x..."} on each change.
func (s *Service) StartMonitoring(onChange func(json string)) bool {
	s.monitor.Start(func(hwnd win32.HWND) {
		onChange(`{"handle":"` + win32.HwndToHexString(hwnd) + `"}`)
	})
	return true
}

// StopMonitoring ends foreground-window monitoring.
func (s *Service) StopMonitoring() bool {
	s.monitor.Stop()
	return true
}

// InvokeControl invokes (or toggles) a control by runtime id.
func (s *Service) InvokeControl(handle, runtimeID string) bool {
	hwnd, ok := win32.TryParseHwnd(handle)
	if !ok {
		return false
	}
	return s.automation.InvokeControl(uintptr(hwnd), runtimeID)
}

// HighlightRect outlines a rectangle on screen. color is RGB (0xRRGGBB).
func (s *Service) HighlightRect(left, top, right, bottom, color, borderWidth, blinkCount int) {
	s.ensureHighlighter().Highlight(win32.HighlightParams{
		Left:        left,
		Top:         top,
		Right:       right,
		Bottom:      bottom,
		ColorRGB:    color,
		BorderWidth: borderWidth,
		BlinkCount:  blinkCount,
	})
}

// HideHighlight hides the highlight overlay.
func (s *Service) HideHighlight() {
	s.ensureHighlighter().Hide()
}

// GetWindowRect returns the JSON rectangle of a window, or "null".
// Top-level windows use DWMWA_EXTENDED_FRAME_BOUNDS (visible frame, no shadow).
func (s *Service) GetWindowRect(handle string) string {
	hwnd, ok := win32.TryParseHwnd(handle)
	if !ok {
		return "null"
	}
	r, valid := win32.GetWindowRectOK(hwnd)
	if !valid {
		return "null"
	}
	data, err := json.Marshal(r)
	if err != nil {
		return "null"
	}
	return string(data)
}

// GetControlCurrentBounds returns the JSON bounds of a control, or "null".
func (s *Service) GetControlCurrentBounds(handle, runtimeID string) string {
	hwnd, ok := win32.TryParseHwnd(handle)
	if !ok {
		return "null"
	}
	b, valid := s.automation.GetControlBounds(uintptr(hwnd), runtimeID)
	if !valid {
		return "null"
	}
	data, err := json.Marshal(b)
	if err != nil {
		return "null"
	}
	return string(data)
}

// IsWindowHandleValid reports whether a window handle is currently valid.
func (s *Service) IsWindowHandleValid(handle string) bool {
	hwnd, ok := win32.TryParseHwnd(handle)
	if !ok {
		return false
	}
	return win32.IsWindow(hwnd)
}

// GetWindowDetailInfo returns JSON with detailed Win32 window properties
// (General + Window Extra tabs), or a payload with valid=false.
func (s *Service) GetWindowDetailInfo(handle string) string {
	info := windowdetail.GetWindowDetailInfo(handle)
	data, err := json.Marshal(info)
	if err != nil {
		return `{"valid":false}`
	}
	return string(data)
}

// GetControlAccInteract returns JSON with UIA patterns and MSAA actions
// available on the control identified by handle + runtimeID.
func (s *Service) GetControlAccInteract(handle, runtimeID string) string {
	hwnd, ok := win32.TryParseHwnd(handle)
	if !ok {
		return `{"found":false,"error":"invalid window handle"}`
	}
	snap := accinteract.GetSnapshot(s.automation, uintptr(hwnd), runtimeID)
	data, err := json.Marshal(snap)
	if err != nil {
		return `{"found":false,"error":"marshal failed"}`
	}
	return string(data)
}

// ExecuteAccAction runs a UIA or MSAA action (kind is "uia" or "msaa").
func (s *Service) ExecuteAccAction(handle, runtimeID, kind, actionID, value string) string {
	hwnd, ok := win32.TryParseHwnd(handle)
	if !ok {
		return `{"ok":false,"error":"invalid window handle"}`
	}
	result := accinteract.Execute(s.automation, uintptr(hwnd), runtimeID, kind, actionID, value)
	data, err := json.Marshal(result)
	if err != nil {
		return `{"ok":false,"error":"marshal failed"}`
	}
	return string(data)
}

// StartWindowPicker begins global mouse tracking for the window finder.
// onEvent receives JSON winpicker.Event values until the mouse button is released.
func (s *Service) StartWindowPicker(iconMode string, onEvent func(json string)) bool {
	if s.picker == nil {
		s.picker = winpicker.NewSession()
	}
	return s.picker.Start(onEvent, winpicker.ParseDragIconMode(iconMode))
}

// StopWindowPicker cancels an in-progress window-finder drag.
func (s *Service) StopWindowPicker() bool {
	if s.picker == nil {
		return false
	}
	return s.picker.Stop()
}

// Shutdown stops background activity (monitoring, finder hook) on app exit.
func (s *Service) Shutdown() {
	s.monitor.Stop()
	s.StopWindowPicker()
}
