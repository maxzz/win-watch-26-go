//go:build windows

package platform

import (
	"os"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

func IsDevToolsOpen() bool {
	return len(findDevToolsWindows()) > 0
}

// CloseDevTools closes DevTools windows that belong to this application only.
func CloseDevTools() {
	user32 := syscall.NewLazyDLL("user32.dll")
	postMessageW := user32.NewProc("PostMessageW")

	const wmClose = 0x0010

	for _, hwnd := range findDevToolsWindows() {
		postMessageW.Call(uintptr(hwnd), wmClose, 0, 0)
	}
}

// OpenDevTools focuses this app's WebView2 surface and sends Ctrl+Shift+F12,
// which Wails handles when devtools are enabled. This is used as a fallback
// when OpenInspectorOnStartup did not run (production builds without -debug).
func OpenDevTools() {
	mainHwnd := findAppMainWindow()
	if mainHwnd == 0 {
		return
	}

	user32 := syscall.NewLazyDLL("user32.dll")
	setForegroundWindow := user32.NewProc("SetForegroundWindow")
	showWindow := user32.NewProc("ShowWindow")
	setFocus := user32.NewProc("SetFocus")
	allowSetForegroundWindow := user32.NewProc("AllowSetForegroundWindow")

	const (
		swRestore = 9
		asfwAny   = ^uintptr(0) // ASFW_ANY
	)

	allowSetForegroundWindow.Call(asfwAny)
	showWindow.Call(uintptr(mainHwnd), swRestore, 0)
	setForegroundWindow.Call(uintptr(mainHwnd))

	if renderHwnd := findWebViewRenderWidget(mainHwnd); renderHwnd != 0 {
		setFocus.Call(uintptr(renderHwnd))
	}

	// Give focus changes time to settle before synthesizing the accelerator.
	time.Sleep(50 * time.Millisecond)
	sendCtrlShiftF12()
}

func findAppMainWindow() syscall.Handle {
	user32 := syscall.NewLazyDLL("user32.dll")
	enumWindows := user32.NewProc("EnumWindows")
	isWindowVisible := user32.NewProc("IsWindowVisible")
	getWindowTextW := user32.NewProc("GetWindowTextW")
	getClassNameW := user32.NewProc("GetClassNameW")
	getWindowThreadProcessId := user32.NewProc("GetWindowThreadProcessId")

	myPid := uint32(os.Getpid())
	var found syscall.Handle

	cb := syscall.NewCallback(func(hwnd syscall.Handle, _ uintptr) uintptr {
		if found != 0 {
			return 1
		}
		visible, _, _ := isWindowVisible.Call(uintptr(hwnd))
		if visible == 0 {
			return 1
		}
		var windowPid uint32
		getWindowThreadProcessId.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&windowPid)))
		if windowPid != myPid {
			return 1
		}
		classBuf := make([]uint16, 256)
		getClassNameW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&classBuf[0])), 256)
		className := syscall.UTF16ToString(classBuf)
		if className != "wailsWindow" {
			return 1
		}
		titleBuf := make([]uint16, 512)
		getWindowTextW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&titleBuf[0])), 512)
		title := syscall.UTF16ToString(titleBuf)
		if title == "" || strings.Contains(title, "DevTools") {
			return 1
		}
		found = hwnd
		return 0
	})

	enumWindows.Call(cb, 0)
	return found
}

func findWebViewRenderWidget(parent syscall.Handle) syscall.Handle {
	user32 := syscall.NewLazyDLL("user32.dll")
	enumChildWindows := user32.NewProc("EnumChildWindows")
	getClassNameW := user32.NewProc("GetClassNameW")

	var found syscall.Handle
	cb := syscall.NewCallback(func(hwnd syscall.Handle, _ uintptr) uintptr {
		classBuf := make([]uint16, 256)
		getClassNameW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&classBuf[0])), 256)
		if syscall.UTF16ToString(classBuf) == "Chrome_RenderWidgetHostHWND" {
			found = hwnd
			return 0
		}
		return 1
	})

	enumChildWindows.Call(uintptr(parent), cb, 0)
	return found
}

func sendCtrlShiftF12() {
	user32 := syscall.NewLazyDLL("user32.dll")
	sendInput := user32.NewProc("SendInput")

	const (
		inputKeyboard  = 1
		keyeventfKeyUp = 0x0002
		vkControl      = 0x11
		vkShift        = 0x10
		vkF12          = 0x7B
	)

	type keyboardInput struct {
		wVk         uint16
		wScan       uint16
		dwFlags     uint32
		time        uint32
		dwExtraInfo uintptr
	}

	type input struct {
		inputType uint32
		ki        keyboardInput
		padding   [8]byte
	}

	press := func(vk uint16) input {
		return input{
			inputType: inputKeyboard,
			ki:        keyboardInput{wVk: vk},
		}
	}
	release := func(vk uint16) input {
		return input{
			inputType: inputKeyboard,
			ki:        keyboardInput{wVk: vk, dwFlags: keyeventfKeyUp},
		}
	}

	sequence := []input{
		press(vkControl),
		press(vkShift),
		press(vkF12),
		release(vkF12),
		release(vkShift),
		release(vkControl),
	}

	sendInput.Call(
		uintptr(len(sequence)),
		uintptr(unsafe.Pointer(&sequence[0])),
		uintptr(unsafe.Sizeof(input{})),
	)
}

func findDevToolsWindows() []syscall.Handle {
	user32 := syscall.NewLazyDLL("user32.dll")
	enumWindows := user32.NewProc("EnumWindows")
	getWindowTextW := user32.NewProc("GetWindowTextW")
	getClassNameW := user32.NewProc("GetClassNameW")
	getWindowThreadProcessId := user32.NewProc("GetWindowThreadProcessId")

	var handles []syscall.Handle
	myPid := uint32(os.Getpid())

	parentMap, err := getProcessParentMap()
	if err != nil {
		parentMap = make(map[uint32]uint32)
	}

	cb := syscall.NewCallback(func(hwnd syscall.Handle, _ uintptr) uintptr {
		classBuf := make([]uint16, 256)
		getClassNameW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&classBuf[0])), 256)
		if syscall.UTF16ToString(classBuf) != "Chrome_WidgetWin_1" {
			return 1
		}

		titleBuf := make([]uint16, 512)
		getWindowTextW.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&titleBuf[0])), 512)
		if strings.Contains(syscall.UTF16ToString(titleBuf), "DevTools") {
			var windowPid uint32
			getWindowThreadProcessId.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&windowPid)))
			if isDescendant(windowPid, myPid, parentMap) {
				handles = append(handles, hwnd)
			}
		}
		return 1
	})

	enumWindows.Call(cb, 0)
	return handles
}

func getProcessParentMap() (map[uint32]uint32, error) {
	snapshot, err := syscall.CreateToolhelp32Snapshot(syscall.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return nil, err
	}
	defer syscall.CloseHandle(snapshot)

	var entry syscall.ProcessEntry32
	entry.Size = uint32(unsafe.Sizeof(entry))

	err = syscall.Process32First(snapshot, &entry)
	if err != nil {
		return nil, err
	}

	parentMap := make(map[uint32]uint32)
	for {
		parentMap[entry.ProcessID] = entry.ParentProcessID
		err = syscall.Process32Next(snapshot, &entry)
		if err != nil {
			break
		}
	}
	return parentMap, nil
}

func isDescendant(childPid, parentPid uint32, parentMap map[uint32]uint32) bool {
	current := childPid
	visited := make(map[uint32]bool)
	for current != 0 {
		if current == parentPid {
			return true
		}
		if visited[current] {
			break
		}
		visited[current] = true
		parent, ok := parentMap[current]
		if !ok {
			break
		}
		current = parent
	}
	return false
}
