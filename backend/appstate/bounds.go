// Package appstate handles host-level persistence that used to live in the
// Electron main process - the main window bounds plus a few app-level flags,
// stored as JSON in the user's config directory (%AppData%/<appName>/init.json).
package appstate

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Default window size used when no saved bounds exist.
const (
	DefaultWidth  = 1200
	DefaultHeight = 800
)

// Settings is the persisted host-level state. It keeps the window geometry
// (restored on the next launch) together with whether the WebView2 developer
// tools were left open when the user last toggled them, plus host-lifecycle
// flags (elevation, close-to-tray, taskbar button).
type Settings struct {
	X         int     `json:"x"`
	Y         int     `json:"y"`
	Width     int     `json:"width"`
	Height    int     `json:"height"`
	DevTools  bool    `json:"devTools"`
	ZoomLevel float64 `json:"zoomLevel"`

	RunElevated bool `json:"runElevated"`
	QuitOnClose bool `json:"quitOnClose"`
	// ShowInTaskbar is a pointer so older init.json files (field absent) keep
	// the default of true. A non-nil false hides the taskbar button.
	ShowInTaskbar *bool `json:"showInTaskbar,omitempty"`
}

// BoundsValid reports whether the saved geometry is usable.
func (s Settings) BoundsValid() bool {
	return s.Width > 0 && s.Height > 0
}

// Store reads/writes the settings to a JSON file. A mutex guards the
// read-modify-write helpers so concurrent writers (bounds, devtools, zoom)
// don't clobber each other.
type Store struct {
	mu   sync.Mutex
	path string
}

// NewStore returns a store for the given app folder name (a file at
// %AppData%/<appName>/init.json).
func NewStore(appName string) *Store {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = os.TempDir()
	}
	return &Store{path: filepath.Join(dir, appName, "init.json")}
}

// Load returns the saved settings and whether the file was found and parsed.
func (s *Store) Load() (Settings, bool) {
	data, err := os.ReadFile(s.path)
	if err != nil {
		return Settings{}, false
	}
	var v Settings
	if err := json.Unmarshal(data, &v); err != nil {
		return Settings{}, false
	}
	return v, true
}

// Save writes the settings, creating the directory if needed.
func (s *Store) Save(v Settings) {
	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return
	}
	data, err := json.Marshal(v)
	if err != nil {
		return
	}
	_ = os.WriteFile(s.path, data, 0o644)
}

// SaveBounds updates only the window geometry, preserving the other settings.
func (s *Store) SaveBounds(x, y, width, height int) {
	if width <= 0 || height <= 0 {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	v, _ := s.Load()
	v.X, v.Y, v.Width, v.Height = x, y, width, height
	s.Save(v)
}

// DevTools reports whether developer tools were left open last session.
func (s *Store) DevTools() bool {
	v, _ := s.Load()
	return v.DevTools
}

// Zoom returns the persisted zoom level (in 1.2^level steps; 0 == 100%).
func (s *Store) Zoom() float64 {
	v, _ := s.Load()
	return v.ZoomLevel
}

// SetZoom updates only the zoom level, preserving the other settings.
func (s *Store) SetZoom(level float64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, _ := s.Load()
	v.ZoomLevel = level
	s.Save(v)
}

// SetDevTools updates only the developer-tools flag, preserving the other
// settings.
func (s *Store) SetDevTools(enabled bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, _ := s.Load()
	v.DevTools = enabled
	s.Save(v)
}

func (s *Store) update(fn func(*Settings)) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, _ := s.Load()
	fn(&v)
	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return err
	}
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0o644)
}

// RunElevated reports the persisted "start / stay elevated" preference.
func (s *Store) RunElevated() bool {
	v, _ := s.Load()
	return v.RunElevated
}

// SetRunElevated updates only the elevation preference.
func (s *Store) SetRunElevated(value bool) error {
	return s.update(func(v *Settings) { v.RunElevated = value })
}

// QuitOnClose reports whether the window close button should quit the process.
// When false (default), close hides the window to the tray.
func (s *Store) QuitOnClose() bool {
	v, _ := s.Load()
	return v.QuitOnClose
}

// SetQuitOnClose updates only the close-button preference.
func (s *Store) SetQuitOnClose(value bool) error {
	return s.update(func(v *Settings) { v.QuitOnClose = value })
}

// ShowInTaskbar reports whether the main window should appear on the taskbar.
// Default is true when unset or when init.json is missing.
func (s *Store) ShowInTaskbar() bool {
	v, ok := s.Load()
	if !ok || v.ShowInTaskbar == nil {
		return true
	}
	return *v.ShowInTaskbar
}

// SetShowInTaskbar updates only the taskbar-button preference.
func (s *Store) SetShowInTaskbar(value bool) error {
	return s.update(func(v *Settings) { v.ShowInTaskbar = &value })
}
