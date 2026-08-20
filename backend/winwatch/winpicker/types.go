package winpicker

import (
	"strings"

	"github.com/maxzz/win-watch-26/backend/winwatch/win32"
)

// DragIconMode selects how the finder target is drawn while dragging.
type DragIconMode int

const (
	// DragIconSystemCursor replaces the system cursors with an HCURSOR (1-bit
	// mask; partial alpha looks jagged).
	DragIconSystemCursor DragIconMode = iota
	// DragIconLayeredWindow follows the pointer with a WS_EX_LAYERED overlay
	// using UpdateLayeredWindow(ULW_ALPHA) so PNG alpha is preserved.
	DragIconLayeredWindow
)

// ParseDragIconMode maps the frontend setting ("cursor" | "overlay").
func ParseDragIconMode(s string) DragIconMode {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "cursor", "hcursor", "system":
		return DragIconSystemCursor
	default:
		return DragIconLayeredWindow
	}
}

// Event is the JSON payload emitted while the finder is active and once more
// when the mouse button is released (Released=true).
type Event struct {
	Released    bool        `json:"released"`
	ProcessName string      `json:"processName"`
	Screen      win32.Point `json:"screen"`
	Client      win32.Point `json:"client"`
	Handle      string      `json:"handle,omitempty"`
	RootHandle  string      `json:"rootHandle,omitempty"`
	Title       string      `json:"title,omitempty"`
}
