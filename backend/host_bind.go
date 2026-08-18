package backend

// Wails-bound host-lifecycle API. Thin delegates onto hostlife.Controller so
// the window-tree bindings.Api stays separate.

func (a *App) GetRunElevated() bool {
	return a.host.GetRunElevated()
}

func (a *App) SetRunElevated(value bool) error {
	return a.host.SetRunElevated(value)
}

func (a *App) IsElevated() bool {
	return a.host.IsElevated()
}

func (a *App) RequestElevationRestart() error {
	a.host.PersistWindow()
	return a.host.RequestElevationRestart()
}

func (a *App) RequestUnelevatedRestart() error {
	a.host.PersistWindow()
	return a.host.RequestUnelevatedRestart()
}

func (a *App) GetQuitOnClose() bool {
	return a.host.GetQuitOnClose()
}

func (a *App) SetQuitOnClose(value bool) error {
	return a.host.SetQuitOnClose(value)
}

func (a *App) GetShowInTaskbar() bool {
	return a.host.GetShowInTaskbar()
}

func (a *App) SetShowInTaskbar(value bool) error {
	return a.host.SetShowInTaskbar(value)
}

func (a *App) RequestExit() {
	a.host.RequestExit()
}

// ApplyTrayIcon sets the tray icon bytes. Not a Wails-bound method (unexported
// would be invisible to main; this helper lives in the same package as App).
func ApplyTrayIcon(a *App, icon []byte) {
	a.host.SetTrayIcon(icon)
}
