// Package appstate handles host-level persistence that used to live in the
// Electron main process - currently the main window bounds, stored as JSON in
// the user's config directory.
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

// Bounds is the persisted window geometry.
type Bounds struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

// BoundsStore reads/writes window bounds to a JSON file.
type BoundsStore struct {
	path string
}

// NewBoundsStore returns a store for the given app folder name (e.g. a file at
// %AppData%/<appName>/init.json).
func NewBoundsStore(appName string) *BoundsStore {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = os.TempDir()
	}
	return &BoundsStore{path: filepath.Join(dir, appName, "init.json")}
}

// Load returns the saved bounds and whether they were found and valid.
func (s *BoundsStore) Load() (Bounds, bool) {
	data, err := os.ReadFile(s.path)
	if err != nil {
		return Bounds{}, false
	}
	var b Bounds
	if err := json.Unmarshal(data, &b); err != nil {
		return Bounds{}, false
	}
	if b.Width <= 0 || b.Height <= 0 {
		return Bounds{}, false
	}
	return b, true
}

// Save writes the bounds, creating the directory if needed.
func (s *BoundsStore) Save(b Bounds) {
	if b.Width <= 0 || b.Height <= 0 {
		return
	}
	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return
	}
	data, err := json.Marshal(b)
	if err != nil {
		return
	}
	_ = os.WriteFile(s.path, data, 0o644)
}
