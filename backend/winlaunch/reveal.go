package winlaunch

import (
	"fmt"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	shell32       = windows.NewLazySystemDLL("shell32.dll")
	shellExecuteW = shell32.NewProc("ShellExecuteW")
)

// RevealInExplorer opens File Explorer with path selected (highlighted).
// Expands %VAR% macros and resolves bare names (e.g. notepad.exe) via PATH.
func RevealInExplorer(path string) error {
	abs, err := resolveExistingPath(path)
	if err != nil {
		return fmt.Errorf("reveal: %w", err)
	}

	// Quote the path inside /select so spaces (e.g. "Program Files") parse
	// correctly. Without quotes, explorer often opens the Documents folder.
	if err := launchExplorer(`/select,"` + abs + `"`); err != nil {
		return fmt.Errorf("reveal: %w", err)
	}
	return nil
}

func launchExplorer(params string) error {
	verb, err := windows.UTF16PtrFromString("open")
	if err != nil {
		return err
	}
	file, err := windows.UTF16PtrFromString("explorer.exe")
	if err != nil {
		return err
	}
	paramsPtr, err := windows.UTF16PtrFromString(params)
	if err != nil {
		return err
	}

	ret, _, callErr := shellExecuteW.Call(
		0,
		uintptr(unsafe.Pointer(verb)),
		uintptr(unsafe.Pointer(file)),
		uintptr(unsafe.Pointer(paramsPtr)),
		0,
		uintptr(windows.SW_SHOWNORMAL),
	)
	if ret <= 32 {
		if callErr != nil && callErr != syscall.Errno(0) {
			return callErr
		}
		return fmt.Errorf("ShellExecute failed with code %d", ret)
	}
	return nil
}
