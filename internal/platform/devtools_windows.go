//go:build windows

package platform

import (
	"os"
	"strings"
	"syscall"
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
