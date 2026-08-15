// Package win32 contains thin syscall wrappers around the Win32 APIs used by
// the winwatch service (window enumeration, foreground monitoring and the
// highlight overlay window). It depends only on the standard library and
// golang.org/x/sys/windows, so it builds without cgo.
package win32

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	user32   = windows.NewLazySystemDLL("user32.dll")
	kernel32 = windows.NewLazySystemDLL("kernel32.dll")
	psapi    = windows.NewLazySystemDLL("psapi.dll")
	gdi32    = windows.NewLazySystemDLL("gdi32.dll")
	dwmapi   = windows.NewLazySystemDLL("dwmapi.dll")

	procEnumWindows             = user32.NewProc("EnumWindows")
	procIsWindow                = user32.NewProc("IsWindow")
	procIsWindowVisible         = user32.NewProc("IsWindowVisible")
	procGetWindowTextW          = user32.NewProc("GetWindowTextW")
	procGetWindowTextLengthW    = user32.NewProc("GetWindowTextLengthW")
	procGetClassNameW           = user32.NewProc("GetClassNameW")
	procGetWindowThreadProcessID = user32.NewProc("GetWindowThreadProcessId")
	procGetWindowRect           = user32.NewProc("GetWindowRect")
	procGetForegroundWindow     = user32.NewProc("GetForegroundWindow")
	procGetAncestor             = user32.NewProc("GetAncestor")

	procDwmGetWindowAttribute = dwmapi.NewProc("DwmGetWindowAttribute")

	procGetModuleBaseNameW = psapi.NewProc("GetModuleBaseNameW")

	procGetModuleHandleW = kernel32.NewProc("GetModuleHandleW")
)

// Rect mirrors the Win32 RECT structure. JSON tags match the original C++
// output consumed by the React renderer.
type Rect struct {
	Left   int32 `json:"left"`
	Top    int32 `json:"top"`
	Right  int32 `json:"right"`
	Bottom int32 `json:"bottom"`
}

// HWND is an opaque window handle value.
type HWND uintptr

const (
	gaParent = 1 // GA_PARENT for GetAncestor

	// DWMWA_EXTENDED_FRAME_BOUNDS: visible window frame in screen coordinates,
	// excluding the DWM drop-shadow padding that GetWindowRect includes.
	dwmwaExtendedFrameBounds = 9
)

// WindowInfo describes a single top-level window. The JSON tags match the
// shape produced by the original C++ WindowList::ToJson so the React UI is
// unchanged.
type WindowInfo struct {
	Handle      string `json:"handle"`
	Title       string `json:"title"`
	ProcessName string `json:"processName"`
	ProcessPath string `json:"processPath"`
	ProcessID   uint32 `json:"processId"`
	ClassName   string `json:"className"`
	Rect        Rect   `json:"rect"`
}

// EnumerateTopLevelWindows returns all visible, titled top-level windows.
// When excludeProcessID is non-zero, windows owned by that process are skipped
// (used to hide the app's own windows).
func EnumerateTopLevelWindows(excludeProcessID uint32) []WindowInfo {
	var windowsList []WindowInfo

	cb := windows.NewCallback(func(hwnd uintptr, _ uintptr) uintptr {
		if !IsWindowVisible(HWND(hwnd)) {
			return 1 // continue
		}

		title := GetWindowTitle(HWND(hwnd))
		if title == "" {
			return 1
		}

		pid := GetWindowProcessID(HWND(hwnd))
		if excludeProcessID != 0 && pid == excludeProcessID {
			return 1
		}

		processPath := GetProcessPath(pid)
		processName := GetProcessName(pid)
		if processName == "" && processPath != "" {
			processName = filepath.Base(processPath)
		}

		windowsList = append(windowsList, WindowInfo{
			Handle:      HwndToHexString(HWND(hwnd)),
			Title:       title,
			ProcessName: processName,
			ProcessPath: processPath,
			ProcessID:   pid,
			ClassName:   GetWindowClassName(HWND(hwnd)),
			Rect:        VisibleWindowRect(HWND(hwnd)),
		})
		return 1
	})

	procEnumWindows.Call(cb, 0)
	return windowsList
}

// IsWindow reports whether the handle refers to an existing window.
func IsWindow(hwnd HWND) bool {
	ret, _, _ := procIsWindow.Call(uintptr(hwnd))
	return ret != 0
}

// IsWindowVisible reports whether the window has the WS_VISIBLE style.
func IsWindowVisible(hwnd HWND) bool {
	ret, _, _ := procIsWindowVisible.Call(uintptr(hwnd))
	return ret != 0
}

// GetWindowTitle returns the window caption as UTF-8.
func GetWindowTitle(hwnd HWND) string {
	length, _, _ := procGetWindowTextLengthW.Call(uintptr(hwnd))
	if length == 0 {
		return ""
	}
	buf := make([]uint16, length+1)
	copied, _, _ := procGetWindowTextW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&buf[0])), length+1)
	if copied == 0 {
		return ""
	}
	return windows.UTF16ToString(buf[:copied])
}

// GetWindowClassName returns the window class name as UTF-8.
func GetWindowClassName(hwnd HWND) string {
	buf := make([]uint16, 256)
	copied, _, _ := procGetClassNameW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	if copied == 0 {
		return ""
	}
	return windows.UTF16ToString(buf[:copied])
}

// GetWindowProcessID returns the owning process id for a window.
func GetWindowProcessID(hwnd HWND) uint32 {
	var pid uint32
	procGetWindowThreadProcessID.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&pid)))
	return pid
}

// GetProcessName returns the base module name (e.g. "explorer.exe") for a pid.
func GetProcessName(pid uint32) string {
	if pid == 0 {
		return ""
	}
	const access = windows.PROCESS_QUERY_INFORMATION | windows.PROCESS_VM_READ
	handle, err := windows.OpenProcess(access, false, pid)
	if err != nil {
		return ""
	}
	defer windows.CloseHandle(handle)

	buf := make([]uint16, windows.MAX_PATH)
	copied, _, _ := procGetModuleBaseNameW.Call(uintptr(handle), 0, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	if copied == 0 {
		return ""
	}
	return windows.UTF16ToString(buf[:copied])
}

// GetProcessPath returns the full image path for a pid, or "" on failure.
func GetProcessPath(pid uint32) string {
	if pid == 0 {
		return ""
	}
	handle, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
	if err != nil {
		return ""
	}
	defer windows.CloseHandle(handle)

	buf := make([]uint16, windows.MAX_PATH)
	size := uint32(len(buf))
	if err := windows.QueryFullProcessImageName(handle, 0, &buf[0], &size); err != nil {
		return ""
	}
	return windows.UTF16ToString(buf[:size])
}

// GetWindowRectValue returns GetWindowRect in screen coordinates. On Vista+
// this includes invisible DWM drop-shadow padding around top-level windows.
func GetWindowRectValue(hwnd HWND) Rect {
	var r Rect
	procGetWindowRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&r)))
	return r
}

// GetVisibleFrameBounds returns the visible top-level window frame via
// DwmGetWindowAttribute(DWMWA_EXTENDED_FRAME_BOUNDS), excluding drop shadow.
func GetVisibleFrameBounds(hwnd HWND) (Rect, bool) {
	if procDwmGetWindowAttribute.Find() != nil {
		return Rect{}, false
	}
	var r Rect
	hr, _, _ := procDwmGetWindowAttribute.Call(
		uintptr(hwnd),
		dwmwaExtendedFrameBounds,
		uintptr(unsafe.Pointer(&r)),
		unsafe.Sizeof(r),
	)
	if hr != 0 || r.Right <= r.Left || r.Bottom <= r.Top {
		return Rect{}, false
	}
	return r, true
}

// IsTopLevelWindow reports whether hwnd has no parent (GA_PARENT).
func IsTopLevelWindow(hwnd HWND) bool {
	return hwnd != 0 && IsWindow(hwnd) && GetParentWindow(hwnd) == 0
}

// VisibleWindowRect returns the on-screen rectangle occupied by a window.
// For top-level windows this prefers DWMWA_EXTENDED_FRAME_BOUNDS so the
// result matches the visible frame rather than GetWindowRect's shadow box.
func VisibleWindowRect(hwnd HWND) Rect {
	if IsTopLevelWindow(hwnd) {
		if r, ok := GetVisibleFrameBounds(hwnd); ok {
			return r
		}
	}
	return GetWindowRectValue(hwnd)
}

// GetWindowRectOK returns the visible window rectangle and whether it is valid.
func GetWindowRectOK(hwnd HWND) (Rect, bool) {
	if !IsWindow(hwnd) {
		return Rect{}, false
	}
	if IsTopLevelWindow(hwnd) {
		if r, ok := GetVisibleFrameBounds(hwnd); ok {
			return r, true
		}
	}
	var r Rect
	ret, _, _ := procGetWindowRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&r)))
	return r, ret != 0
}

// GetForegroundWindow returns the current foreground window handle.
func GetForegroundWindow() HWND {
	ret, _, _ := procGetForegroundWindow.Call()
	return HWND(ret)
}

// GetParentWindow returns the parent (GA_PARENT) of a window, or 0.
func GetParentWindow(hwnd HWND) HWND {
	ret, _, _ := procGetAncestor.Call(uintptr(hwnd), gaParent)
	return HWND(ret)
}

// GetModuleHandle returns the module handle for the current process.
func GetModuleHandle() uintptr {
	ret, _, _ := procGetModuleHandleW.Call(0)
	return ret
}

// HwndToHexString formats a handle as fixed-width uppercase hex with a 0x
// prefix, matching the original C++ HwndToHexString (16 hex digits on 64-bit).
func HwndToHexString(hwnd HWND) string {
	width := int(unsafe.Sizeof(uintptr(0))) * 2
	return fmt.Sprintf("0x%0*X", width, uint64(hwnd))
}

// TryParseHwnd parses a stringified handle. It accepts decimal ("1234"),
// hex with prefix ("0x1234ABCD") or bare hex ("1234ABCD").
func TryParseHwnd(s string) (HWND, bool) {
	s = strings.TrimSpace(s)
	if s == "" || strings.HasPrefix(s, "-") {
		return 0, false
	}

	base := 10
	body := s
	switch {
	case strings.HasPrefix(s, "0x") || strings.HasPrefix(s, "0X"):
		base = 16
		body = s[2:]
	case strings.ContainsAny(s, "abcdefABCDEF"):
		base = 16
	}

	value, err := strconv.ParseUint(body, base, 64)
	if err != nil {
		return 0, false
	}
	return HWND(uintptr(value)), true
}
