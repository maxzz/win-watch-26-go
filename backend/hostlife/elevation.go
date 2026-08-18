package hostlife

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/maxzz/win-watch-26/backend/winlaunch"
)

// EnsureElevatedIfRequested relaunches the current executable with UAC
// elevation when RunElevated is enabled in init.json and the process is not
// already elevated. It exits the current process when a new elevated instance
// was started. Skipped for `wails dev` binaries.
func EnsureElevatedIfRequested() {
	if isDevExecutable() {
		log.Println("elevation: skipping auto-elevation for wails dev binary; use wails build and run the release .exe to test startup elevation")
		return
	}
	if processStore == nil || !processStore.RunElevated() {
		return
	}
	if winlaunch.IsElevated() {
		return
	}

	releaseInstanceMutex()
	if err := winlaunch.RelaunchElevated(); err != nil {
		log.Printf("elevation: failed to relaunch elevated: %v", err)
		_ = acquireInstanceMutex()
		return
	}

	os.Exit(0)
}

// RequestElevationRestart relaunches the current executable elevated and exits
// the current process. No-op when already elevated.
// Callers must persist window geometry first (os.Exit skips BeforeClose).
func (c *Controller) RequestElevationRestart() error {
	if winlaunch.IsElevated() {
		return nil
	}

	releaseInstanceMutex()
	if err := winlaunch.RelaunchElevated(); err != nil {
		_ = acquireInstanceMutex()
		return err
	}

	stopTray()
	os.Exit(0)
	return nil
}

// RequestUnelevatedRestart relaunches the current executable at normal
// (medium) integrity and exits. No-op when not elevated.
// Callers must persist window geometry first (os.Exit skips BeforeClose).
func (c *Controller) RequestUnelevatedRestart() error {
	if !winlaunch.IsElevated() {
		return nil
	}

	releaseInstanceMutex()
	if err := winlaunch.RelaunchUnelevated(); err != nil {
		_ = acquireInstanceMutex()
		return err
	}

	stopTray()
	os.Exit(0)
	return nil
}

func isDevExecutable() bool {
	exe, err := os.Executable()
	if err != nil {
		return false
	}
	return strings.Contains(strings.ToLower(filepath.Base(exe)), "-dev")
}
