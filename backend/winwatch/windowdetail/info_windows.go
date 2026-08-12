package windowdetail

import (
	"fmt"
	"path/filepath"
	"unsafe"

	"github.com/maxzz/win-watch-26/backend/winwatch/win32"
	"golang.org/x/sys/windows"
)

var (
	user32 = windows.NewLazySystemDLL("user32.dll")

	procGetWindow                = user32.NewProc("GetWindow")
	procGetParent                = user32.NewProc("GetParent")
	procGetWindowLongPtrW        = user32.NewProc("GetWindowLongPtrW")
	procGetClassLongPtrW         = user32.NewProc("GetClassLongPtrW")
	procIsWindowEnabled          = user32.NewProc("IsWindowEnabled")
	procIsWindowUnicode          = user32.NewProc("IsWindowUnicode")
	procGetClientRect            = user32.NewProc("GetClientRect")
	procMapWindowPoints          = user32.NewProc("MapWindowPoints")
	procGetWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
)

const (
	gwOwner = 4

	gwlStyle      = ^uintptr(15) // -16
	gwlExStyle    = ^uintptr(19) // -20
	gwlpID        = ^uintptr(11) // -12
	gwlpHInstance = ^uintptr(5)  // -6
	gwlpUserData  = ^uintptr(20) // -21

	gcwAtom       = ^uintptr(31) // -32
	gclStyle      = ^uintptr(25) // -26
	gclCbClsExtra = ^uintptr(19) // -20
	gclCbWndExtra = ^uintptr(17) // -18
)

type winRect struct {
	Left, Top, Right, Bottom int32
}

const (
	securityMandatoryMediumRID     = 0x2000
	securityMandatoryMediumPlusRID = 0x2100
	securityMandatoryHighRID       = 0x3000

	imageFileMachineI386  = 0x014c
	imageFileMachineAMD64 = 0x8664
	imageFileMachineARM64 = 0xaa64
)

// GetWindowDetailInfo returns detailed Win32 properties for a window handle.
func GetWindowDetailInfo(handle string) WindowDetailInfo {
	hwnd, ok := win32.TryParseHwnd(handle)
	info := WindowDetailInfo{Handle: win32.HwndToHexString(hwnd)}
	if !ok || hwnd == 0 || !win32.IsWindow(hwnd) {
		return info
	}
	info.Valid = true

	hwndU := uintptr(hwnd)
	info.Caption = win32.GetWindowTitle(hwnd)
	info.ClassName = win32.GetWindowClassName(hwnd)
	info.Unicode = isWindowBool(procIsWindowUnicode, hwndU)
	info.Style = uint32(getWindowLong(hwndU, gwlStyle))
	info.ExStyle = uint32(getWindowLong(hwndU, gwlExStyle))
	info.Visible = win32.IsWindowVisible(hwnd)
	info.Enabled = isWindowBool(procIsWindowEnabled, hwndU)

	info.StyleNames = decodeStyle(info.Style)
	info.ExStyleNames = decodeExStyle(info.ExStyle)

	wr := win32.GetWindowRectValue(hwnd)
	info.Rect = RectInfo{
		Left:   wr.Left,
		Top:    wr.Top,
		Right:  wr.Right,
		Bottom: wr.Bottom,
		Width:  wr.Right - wr.Left,
		Height: wr.Bottom - wr.Top,
	}

	var cr winRect
	procGetClientRect.Call(hwndU, uintptr(unsafe.Pointer(&cr)))
	procMapWindowPoints.Call(hwndU, 0, uintptr(unsafe.Pointer(&cr)), 2)
	info.ClientRect = rectInfo(cr)

	info.ControlID = int64(int32(getWindowLong(hwndU, gwlpID)))
	info.Instance = win32.HwndToHexString(win32.HWND(getWindowLong(hwndU, gwlpHInstance)))
	info.UserData = win32.HwndToHexString(win32.HWND(getWindowLong(hwndU, gwlpUserData)))

	parent, _, _ := procGetParent.Call(hwndU)
	owner, _, _ := procGetWindow.Call(hwndU, gwOwner)
	info.Parent = RelatedWindow{
		Handle:    win32.HwndToHexString(win32.HWND(parent)),
		ClassName: classNameOrEmpty(parent),
	}
	info.Owner = RelatedWindow{
		Handle:    win32.HwndToHexString(win32.HWND(owner)),
		ClassName: classNameOrEmpty(owner),
	}

	info.ClassAtom = fmt.Sprintf("0x%04X", uint16(getClassLong(hwndU, gcwAtom)))
	info.ClassStyle = uint32(getClassLong(hwndU, gclStyle))
	info.ClassExtraBytes = int32(getClassLong(hwndU, gclCbClsExtra))
	info.WindowExtraBytes = int32(getClassLong(hwndU, gclCbWndExtra))

	info.ThreadID, info.ProcessID = getThreadProcess(hwndU)
	proc := processImage(info.ProcessID)
	info.ProcessName = proc.name
	info.ProcessPath = proc.path
	info.Bits = proc.bits
	info.UserName = proc.userName
	info.Integrity = proc.integrity

	return info
}

func getWindowLong(hwnd, index uintptr) uintptr {
	r, _, _ := procGetWindowLongPtrW.Call(hwnd, index)
	return r
}

func getClassLong(hwnd, index uintptr) uintptr {
	r, _, _ := procGetClassLongPtrW.Call(hwnd, index)
	return r
}

func getThreadProcess(hwnd uintptr) (threadID, processID uint32) {
	r, _, _ := procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&processID)))
	threadID = uint32(r)
	return
}

func isWindowBool(proc *windows.LazyProc, hwnd uintptr) bool {
	r, _, _ := proc.Call(hwnd)
	return r != 0
}

func rectInfo(r winRect) RectInfo {
	return RectInfo{
		Left:   r.Left,
		Top:    r.Top,
		Right:  r.Right,
		Bottom: r.Bottom,
		Width:  r.Right - r.Left,
		Height: r.Bottom - r.Top,
	}
}

func classNameOrEmpty(hwnd uintptr) string {
	if hwnd == 0 {
		return ""
	}
	return win32.GetWindowClassName(win32.HWND(hwnd))
}

type processDetails struct {
	name      string
	path      string
	bits      int
	userName  string
	integrity string
}

func processImage(pid uint32) processDetails {
	d := processDetails{integrity: "undetected"}
	if pid == 0 {
		return d
	}
	h, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
	if err != nil {
		return d
	}
	defer windows.CloseHandle(h)

	buf := make([]uint16, windows.MAX_PATH)
	size := uint32(len(buf))
	if err := windows.QueryFullProcessImageName(h, 0, &buf[0], &size); err == nil {
		d.path = windows.UTF16ToString(buf[:size])
		d.name = filepath.Base(d.path)
	}

	d.bits = processBits(h)
	d.userName, d.integrity = processTokenInfo(h)
	return d
}

func processBits(h windows.Handle) int {
	var processMachine, nativeMachine uint16
	if err := windows.IsWow64Process2(h, &processMachine, &nativeMachine); err == nil {
		machine := processMachine
		if machine == 0 {
			machine = nativeMachine
		}
		switch machine {
		case imageFileMachineI386:
			return 32
		case imageFileMachineAMD64, imageFileMachineARM64:
			return 64
		}
	}

	var wow64 bool
	if err := windows.IsWow64Process(h, &wow64); err != nil {
		return 0
	}
	if wow64 {
		return 32
	}
	if unsafe.Sizeof(uintptr(0)) == 8 {
		return 64
	}
	return 32
}

func processTokenInfo(h windows.Handle) (userName, integrity string) {
	integrity = "undetected"
	var token windows.Token
	if err := windows.OpenProcessToken(h, windows.TOKEN_QUERY, &token); err != nil {
		return "", integrity
	}
	defer token.Close()

	userName = tokenUserName(token)
	integrity = tokenIntegrity(token)
	return userName, integrity
}

func tokenUserName(token windows.Token) string {
	var needed uint32
	err := windows.GetTokenInformation(token, windows.TokenUser, nil, 0, &needed)
	if err == nil || needed == 0 {
		return ""
	}
	buf := make([]byte, needed)
	if err := windows.GetTokenInformation(token, windows.TokenUser, &buf[0], needed, &needed); err != nil {
		return ""
	}
	tu := (*windows.Tokenuser)(unsafe.Pointer(&buf[0]))
	if tu.User.Sid == nil {
		return ""
	}
	account, domain, _, err := tu.User.Sid.LookupAccount("")
	if err != nil {
		return ""
	}
	if domain == "" {
		return account
	}
	return domain + "\\" + account
}

func tokenIntegrity(token windows.Token) string {
	var needed uint32
	err := windows.GetTokenInformation(token, windows.TokenIntegrityLevel, nil, 0, &needed)
	if err == nil || needed == 0 {
		return "undetected"
	}
	buf := make([]byte, needed)
	if err := windows.GetTokenInformation(token, windows.TokenIntegrityLevel, &buf[0], needed, &needed); err != nil {
		return "undetected"
	}
	til := (*windows.Tokenmandatorylabel)(unsafe.Pointer(&buf[0]))
	if til.Label.Sid == nil {
		return "undetected"
	}
	rid := integrityRID(til.Label.Sid)
	switch {
	case rid < securityMandatoryMediumRID:
		return "low"
	case rid < securityMandatoryMediumPlusRID:
		return "medium"
	case rid < securityMandatoryHighRID:
		return "mediumplus"
	default:
		return "high"
	}
}

func integrityRID(sid *windows.SID) uint32 {
	count := int(sid.SubAuthorityCount())
	if count <= 0 {
		return 0
	}
	return sid.SubAuthority(uint32(count - 1))
}
