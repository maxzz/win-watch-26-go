package hostlife

import wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

// BeforeClose implements hide-to-tray vs quit.
//
// Returning true prevents close (window stays alive). Returning false allows
// shutdown. Do not stop the tray here: BeforeClose runs on the UI thread
// during WM_CLOSE; tray teardown belongs in Shutdown.
func (c *Controller) BeforeClose() (prevent bool) {
	c.quitMu.Lock()
	requested := c.quitRequested
	c.quitMu.Unlock()

	if requested {
		c.PersistWindow()
		return false
	}
	if c.store != nil && c.store.QuitOnClose() {
		c.PersistWindow()
		return false
	}
	c.HideWindow()
	return true
}

// RequestExit marks an explicit quit (header Exit, tray Exit, menu Exit) and
// asks Wails to shut down. BeforeClose then allows the close.
func (c *Controller) RequestExit() {
	c.quitMu.Lock()
	if c.quitRequested {
		c.quitMu.Unlock()
		return
	}
	c.quitRequested = true
	c.quitMu.Unlock()

	go func() {
		if c.ctx != nil {
			wruntime.Quit(c.ctx)
		}
	}()
}
