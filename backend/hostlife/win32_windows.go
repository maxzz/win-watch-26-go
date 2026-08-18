//go:build windows

package hostlife

import (
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

const (
	swRestore   = 9
	swShow      = 5
	hwndMessage = ^uintptr(0) - 2 // HWND_MESSAGE
)

type wndClassEx struct {
	Size       uint32
	Style      uint32
	WndProc    uintptr
	ClsExtra   int32
	WndExtra   int32
	Instance   uintptr
	Icon       uintptr
	Cursor     uintptr
	Background uintptr
	MenuName   *uint16
	ClassName  *uint16
	IconSm     uintptr
}

var (
	user32   = windows.NewLazySystemDLL("user32.dll")
	kernel32 = windows.NewLazySystemDLL("kernel32.dll")
	advapi32 = windows.NewLazySystemDLL("advapi32.dll")

	procFindWindowW                                          = user32.NewProc("FindWindowW")
	procPostMessageW                                         = user32.NewProc("PostMessageW")
	procRegisterWindowMessageW                               = user32.NewProc("RegisterWindowMessageW")
	procShowWindow                                           = user32.NewProc("ShowWindow")
	procSetForegroundWindow                                  = user32.NewProc("SetForegroundWindow")
	procRegisterClassExW                                     = user32.NewProc("RegisterClassExW")
	procCreateWindowExW                                      = user32.NewProc("CreateWindowExW")
	procDefWindowProcW                                       = user32.NewProc("DefWindowProcW")
	procEnumWindows                                          = user32.NewProc("EnumWindows")
	procGetClassNameW                                        = user32.NewProc("GetClassNameW")
	procGetModuleHandleW                                     = kernel32.NewProc("GetModuleHandleW")
	procConvertStringSecurityDescriptorToSecurityDescriptorW = advapi32.NewProc("ConvertStringSecurityDescriptorToSecurityDescriptorW")
)

func convertStringSecurityDescriptorToSecurityDescriptor(
	stringSecurityDescriptor *uint16,
	revision uint32,
	securityDescriptor **windows.SECURITY_DESCRIPTOR,
	size *uint32,
) error {
	ret, _, err := procConvertStringSecurityDescriptorToSecurityDescriptorW.Call(
		uintptr(unsafe.Pointer(stringSecurityDescriptor)),
		uintptr(revision),
		uintptr(unsafe.Pointer(securityDescriptor)),
		uintptr(unsafe.Pointer(size)),
	)
	if ret == 0 {
		if err != nil && err != syscall.Errno(0) {
			return err
		}
		return syscall.EINVAL
	}
	return nil
}
