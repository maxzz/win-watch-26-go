// Package hostlife owns window close-to-tray, taskbar visibility, process
// elevation, and the system tray. It is the isolated backend for the
// frontend window-lifecycle controls.
package hostlife

import (
	"context"
	"sync"

	"github.com/maxzz/win-watch-26/backend/appstate"
	"github.com/maxzz/win-watch-26/backend/platform"
	"github.com/maxzz/win-watch-26/backend/winapp"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// AppWindowTitle must match the Title passed to wails.Run in main.go.
const AppWindowTitle = "UI Automation Monitor"

// SingleInstanceUniqueID identifies this app for single-instance locking.
const SingleInstanceUniqueID = "a7c3e1b9-4f2d-48a6-9c1e-winwatch26"

// Controller holds tray / hide / quit / elevation state for one process.
type Controller struct {
	ctx   context.Context
	store *appstate.Store

	quitMu        sync.Mutex
	quitRequested bool

	windowMu      sync.Mutex
	windowVisible bool

	trayIcon []byte
}

var processStore *appstate.Store

// Init records the settings store used by startup helpers (single-instance
// and auto-elevation) before the Wails window exists.
func Init(store *appstate.Store) {
	processStore = store
}

// New constructs a controller bound to the given settings store.
func New(store *appstate.Store) *Controller {
	return &Controller{store: store, windowVisible: true}
}

// SetContext stores the Wails runtime context (available after OnStartup).
func (c *Controller) SetContext(ctx context.Context) {
	c.ctx = ctx
}

// SetTrayIcon provides the icon bytes used for the system tray.
func (c *Controller) SetTrayIcon(icon []byte) {
	c.trayIcon = icon
}

// Start wires single-instance IPC, the tray icon, and the persisted taskbar
// preference. Call after the Wails context is set and bounds are restored.
func (c *Controller) Start() {
	setupSingleInstanceIPC(c.ShowWindow)
	c.startTray()
	winapp.SetShowInTaskbar(c.store.ShowInTaskbar())
}

// Shutdown removes the tray icon. Do not call this from BeforeClose (UI thread).
func (c *Controller) Shutdown() {
	stopTray()
}

// PersistWindow writes the current geometry and DevTools visibility to init.json.
func (c *Controller) PersistWindow() {
	if c.ctx == nil || c.store == nil {
		return
	}
	w, h := wruntime.WindowGetSize(c.ctx)
	x, y := wruntime.WindowGetPosition(c.ctx)
	c.store.SaveBounds(x, y, w, h)
	c.store.SetDevTools(platform.IsDevToolsOpen())
}

// ApplyShowInTaskbar reapplies the persisted taskbar preference.
func (c *Controller) ApplyShowInTaskbar() {
	if c.store == nil {
		return
	}
	winapp.SetShowInTaskbar(c.store.ShowInTaskbar())
}
