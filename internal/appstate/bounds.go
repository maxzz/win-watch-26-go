// Package appstate handles host-level persistence that used to live in the
// Electron main process - the main window bounds plus a few app-level flags,
// stored as JSON in the user's config directory (%AppData%/<appName>/init.json).
package appstate

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Default window size used when no saved bounds exist.
const (
	DefaultWidth  = 1200
	DefaultHeight = 800
)

// Settings is the persisted host-level state. It keeps the window geometry
// (restored on the next launch) together with whether the WebView2 developer
// tools were left open when the user last toggled them.
type Settings struct {
	X         int     `json:"x"`
	Y         int     `json:"y"`
	Width     int     `json:"width"`
	Height    int     `json:"height"`
	DevTools  bool    `json:"devTools"`
	ZoomLevel float64 `json:"zoomLevel"`
}

// BoundsValid reports whether the saved geometry is usable.
func (s Settings) BoundsValid() bool {
	return s.Width > 0 && s.Height > 0
}

// Store reads/writes the settings to a JSON file.
type Store struct {
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
	v, _ := s.Load()
	v.ZoomLevel = level
	s.Save(v)
}

// SetDevTools updates only the developer-tools flag, preserving the other
// settings.
func (s *Store) SetDevTools(enabled bool) {
	v, _ := s.Load()
	v.DevTools = enabled
	s.Save(v)
}
