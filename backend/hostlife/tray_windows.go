//go:build windows

package hostlife

import (
	"sync"
	"time"
	"unsafe"

	"github.com/energye/systray"
	"golang.org/x/sys/windows"
)

var (
	trayExitCh   chan struct{}
	trayQuitOnce sync.Once

	trayShowHideItem *systray.MenuItem
	systrayOwnerHWND windows.HWND
)

func (c *Controller) startTray() {
	trayExitCh = make(chan struct{})
	go systray.Run(c.onTrayReady, onTrayExit)
}

func (c *Controller) onTrayReady() {
	if len(c.trayIcon) > 0 {
		systray.SetIcon(c.trayIcon)
	}
	systray.SetTitle(AppWindowTitle)
	systray.SetTooltip(AppWindowTitle)

	trayShowHideItem = systray.AddMenuItem("Hide", "Hide the window")
	systray.AddSeparator()
	mExit := systray.AddMenuItem("Exit", "Quit the application")

	trayShowHideItem.Click(func() {
		go c.ToggleWindow()
	})
	mExit.Click(func() {
		c.RequestExit()
	})

	systray.SetOnClick(func(menu systray.IMenu) {
		go c.ToggleWindow()
	})
	systray.SetOnRClick(func(menu systray.IMenu) {
		c.syncTrayShowHideLabel()
		_ = menu.ShowMenu()
		postSystrayMenuTaskSwitch()
	})
}

func (c *Controller) syncTrayShowHideLabel() {
	if trayShowHideItem == nil {
		return
	}
	c.windowMu.Lock()
	shown := c.windowIsShownLocked()
	c.windowMu.Unlock()
	if shown {
		trayShowHideItem.SetTitle("Hide")
		trayShowHideItem.SetTooltip("Hide the window")
	} else {
		trayShowHideItem.SetTitle("Show")
		trayShowHideItem.SetTooltip("Show the window")
	}
}

func onTrayExit() {
	if trayExitCh != nil {
		close(trayExitCh)
	}
}

func postSystrayMenuTaskSwitch() {
	hwnd := findProcessSystrayWindow()
	if hwnd == 0 {
		return
	}
	const wmNull = 0x0000
	procPostMessageW.Call(uintptr(hwnd), wmNull, 0, 0)
}

func findProcessSystrayWindow() windows.HWND {
	if systrayOwnerHWND != 0 {
		return systrayOwnerHWND
	}

	const className = "SystrayClass"
	myPid := windows.GetCurrentProcessId()
	var found windows.HWND

	cb := windows.NewCallback(func(hwnd windows.HWND, _ uintptr) uintptr {
		var pid uint32
		windows.GetWindowThreadProcessId(hwnd, &pid)
		if pid != myPid {
			return 1
		}
		buf := make([]uint16, 256)
		n, _, _ := procGetClassNameW.Call(
			uintptr(hwnd),
			uintptr(unsafe.Pointer(&buf[0])),
			uintptr(len(buf)),
		)
		if n == 0 {
			return 1
		}
		if windows.UTF16ToString(buf[:n]) == className {
			found = hwnd
			return 0
		}
		return 1
	})
	procEnumWindows.Call(cb, 0)
	systrayOwnerHWND = found
	return found
}

func stopTray() {
	if trayExitCh == nil {
		return
	}
	trayQuitOnce.Do(func() {
		systray.Quit()
	})
	select {
	case <-trayExitCh:
	case <-time.After(2 * time.Second):
	}
}
