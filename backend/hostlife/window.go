package hostlife

import wruntime "github.com/wailsapp/wails/v2/pkg/runtime"

// ShowWindow restores and shows the main window, then reapplies taskbar style.
func (c *Controller) ShowWindow() {
	c.windowMu.Lock()
	c.showWindowLocked()
	c.windowMu.Unlock()
	c.ApplyShowInTaskbar()
}

// HideWindow hides the main window (close-to-tray).
func (c *Controller) HideWindow() {
	c.windowMu.Lock()
	defer c.windowMu.Unlock()
	c.hideWindowLocked()
}

// ToggleWindow hides the window if it is on-screen, otherwise shows it.
func (c *Controller) ToggleWindow() {
	c.windowMu.Lock()
	if c.windowIsShownLocked() {
		c.hideWindowLocked()
		c.windowMu.Unlock()
		return
	}
	c.showWindowLocked()
	c.windowMu.Unlock()
	c.ApplyShowInTaskbar()
}

func (c *Controller) windowIsShownLocked() bool {
	if !c.windowVisible {
		return false
	}
	if c.ctx != nil && wruntime.WindowIsMinimised(c.ctx) {
		return false
	}
	return true
}

func (c *Controller) showWindowLocked() {
	if c.ctx == nil {
		return
	}
	wruntime.WindowUnminimise(c.ctx)
	wruntime.WindowShow(c.ctx)
	c.windowVisible = true
}

func (c *Controller) hideWindowLocked() {
	if c.ctx == nil {
		return
	}
	wruntime.WindowHide(c.ctx)
	c.windowVisible = false
}
