package winpicker

import "github.com/maxzz/win-watch-26/backend/winwatch/win32"

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
