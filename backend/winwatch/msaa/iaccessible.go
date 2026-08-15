// Package msaa talks to the raw Microsoft Active Accessibility IAccessible
// interface (oleacc). All COM calls must run on the UI Automation worker
// thread that owns the source IUIAutomationElement.
package msaa

import (
	"fmt"
	"unsafe"

	"golang.org/x/sys/windows"

	"github.com/maxzz/win-watch-26/backend/winwatch/uia"
)

const (
	idxAccChildCount       = 8
	idxAccName             = 10
	idxAccValue            = 11
	idxAccDescription      = 12
	idxAccRole             = 13
	idxAccState            = 14
	idxAccHelp             = 15
	idxAccKeyboardShortcut = 17
	idxAccDefaultAction    = 20
	idxAccSelect           = 21
	idxAccLocation         = 22
	idxAccDoDefaultAction  = 25
	idxAccPutName          = 26
	idxAccPutValue         = 27

	idxLegacyGetIAccessible = 16

	objidClient = 0xFFFFFFFC

	SelTakeFocus       = 0x1
	SelTakeSelection   = 0x2
	SelAddSelection    = 0x8
	SelRemoveSelection = 0x10
)

var (
	oleacc                         = windows.NewLazySystemDLL("oleacc.dll")
	procAccessibleObjectFromWindow = oleacc.NewProc("AccessibleObjectFromWindow")

	iidIAccessible = windows.GUID{
		Data1: 0x618736E0,
		Data2: 0x3C3D,
		Data3: 0x11CF,
		Data4: [8]byte{0x81, 0x0C, 0x00, 0xAA, 0x00, 0x38, 0x9B, 0x71},
	}
)

// Info is a snapshot of IAccessible properties for CHILDID_SELF.
type Info struct {
	Available        bool
	Error            string
	Name             string
	Value            string
	Description      string
	Role             uint32
	RoleName         string
	State            uint32
	StateFlags       []string
	Help             string
	KeyboardShortcut string
	DefaultAction    string
	ChildCount       int32
	Left, Top        int32
	Width, Height    int32
	HasLocation      bool
}

// FromLegacyPattern calls IUIAutomationLegacyIAccessiblePattern::GetIAccessible
// and reads CHILDID_SELF. legacy must be a live LegacyIAccessible pattern pointer.
func FromLegacyPattern(legacy uintptr) Info {
	if legacy == 0 {
		return Info{Error: "LegacyIAccessible pattern is not available"}
	}
	var acc uintptr
	hr := uia.ComCall(legacy, idxLegacyGetIAccessible, uintptr(unsafe.Pointer(&acc)))
	if !uia.HRESULTOK(hr) || acc == 0 {
		return Info{Error: "GetIAccessible returned no IAccessible"}
	}
	defer uia.Release(acc)
	return readAcc(acc)
}

// FromWindow uses AccessibleObjectFromWindow(OBJID_CLIENT) as a fallback when
// the UIA element has a native HWND but no IAccessible from the legacy pattern.
func FromWindow(hwnd uintptr) Info {
	if hwnd == 0 {
		return Info{Error: "no native window handle for AccessibleObjectFromWindow"}
	}
	var acc uintptr
	hr, _, _ := procAccessibleObjectFromWindow.Call(
		hwnd,
		objidClient,
		uintptr(unsafe.Pointer(&iidIAccessible)),
		uintptr(unsafe.Pointer(&acc)),
	)
	if int32(hr) < 0 || acc == 0 {
		return Info{Error: "AccessibleObjectFromWindow failed"}
	}
	defer uia.Release(acc)
	return readAcc(acc)
}

func readAcc(acc uintptr) Info {
	info := Info{Available: true, StateFlags: []string{}}

	info.Name = getAccBSTR(acc, idxAccName)
	info.Value = getAccBSTR(acc, idxAccValue)
	info.Description = getAccBSTR(acc, idxAccDescription)
	info.Help = getAccBSTR(acc, idxAccHelp)
	info.KeyboardShortcut = getAccBSTR(acc, idxAccKeyboardShortcut)
	info.DefaultAction = getAccBSTR(acc, idxAccDefaultAction)

	if role, ok := getAccVariantInt(acc, idxAccRole); ok {
		info.Role = uint32(role)
	}
	info.RoleName = RoleName(info.Role)

	if state, ok := getAccVariantInt(acc, idxAccState); ok {
		info.State = uint32(state)
	}
	info.StateFlags = DecodeStateFlags(info.State)

	var count int32
	if uia.HRESULTOK(uia.ComCall(acc, idxAccChildCount, uintptr(unsafe.Pointer(&count)))) {
		info.ChildCount = count
	}

	child := uia.VariantChildSelf()
	var left, top, width, height int32
	if uia.HRESULTOK(uia.ComCall(acc, idxAccLocation,
		uintptr(unsafe.Pointer(&left)),
		uintptr(unsafe.Pointer(&top)),
		uintptr(unsafe.Pointer(&width)),
		uintptr(unsafe.Pointer(&height)),
		uintptr(unsafe.Pointer(&child)),
	)) {
		info.Left, info.Top, info.Width, info.Height = left, top, width, height
		info.HasLocation = true
	}
	return info
}

func getAccBSTR(acc uintptr, idx int) string {
	child := uia.VariantChildSelf()
	var bstr uintptr
	hr := uia.ComCall(acc, idx, uintptr(unsafe.Pointer(&child)), uintptr(unsafe.Pointer(&bstr)))
	if !uia.HRESULTOK(hr) || bstr == 0 {
		return ""
	}
	s := uia.GetStringFromBSTR(bstr)
	uia.FreeBSTR(bstr)
	return s
}

func getAccVariantInt(acc uintptr, idx int) (int32, bool) {
	child := uia.VariantChildSelf()
	var out uia.Variant
	out.Init()
	defer out.Clear()
	hr := uia.ComCall(acc, idx, uintptr(unsafe.Pointer(&child)), uintptr(unsafe.Pointer(&out)))
	if !uia.HRESULTOK(hr) {
		return 0, false
	}
	if s := out.String(); s != "" {
		return 0, false
	}
	return out.Int()
}

// WithAccessible runs f with a live IAccessible for the UIA element: first
// LegacyIAccessible.GetIAccessible, then AccessibleObjectFromWindow.
func WithAccessible(elem uintptr, f func(acc uintptr) error) error {
	acc := getIAccessible(elem)
	if acc == 0 {
		return fmt.Errorf("IAccessible is not available for this element")
	}
	defer uia.Release(acc)
	return f(acc)
}

func getIAccessible(elem uintptr) uintptr {
	legacy := uia.GetCurrentPattern(elem, 10018)
	if legacy != 0 {
		defer uia.Release(legacy)
		var acc uintptr
		hr := uia.ComCall(legacy, idxLegacyGetIAccessible, uintptr(unsafe.Pointer(&acc)))
		if uia.HRESULTOK(hr) && acc != 0 {
			return acc
		}
	}
	hwnd := uia.GetHandle(elem, uia.IdxElemCurNativeWindowHandle)
	if hwnd == 0 {
		return 0
	}
	var acc uintptr
	hr, _, _ := procAccessibleObjectFromWindow.Call(
		hwnd,
		objidClient,
		uintptr(unsafe.Pointer(&iidIAccessible)),
		uintptr(unsafe.Pointer(&acc)),
	)
	if int32(hr) < 0 {
		return 0
	}
	return acc
}

func DoDefaultAction(acc uintptr) error {
	child := uia.VariantChildSelf()
	hr := uia.ComCall(acc, idxAccDoDefaultAction, uintptr(unsafe.Pointer(&child)))
	if !uia.HRESULTOK(hr) {
		return fmt.Errorf("accDoDefaultAction failed (hr=0x%08X)", uint32(hr))
	}
	return nil
}

func Select(acc uintptr, flags int32) error {
	child := uia.VariantChildSelf()
	hr := uia.ComCall(acc, idxAccSelect, uintptr(uint32(flags)), uintptr(unsafe.Pointer(&child)))
	if !uia.HRESULTOK(hr) {
		return fmt.Errorf("accSelect failed (hr=0x%08X)", uint32(hr))
	}
	return nil
}

func PutName(acc uintptr, name string) error {
	return putBSTR(acc, idxAccPutName, name)
}

func PutValue(acc uintptr, value string) error {
	return putBSTR(acc, idxAccPutValue, value)
}

func putBSTR(acc uintptr, idx int, s string) error {
	bstr, err := uia.AllocBSTR(s)
	if err != nil {
		return err
	}
	defer uia.FreeBSTR(bstr)
	child := uia.VariantChildSelf()
	hr := uia.ComCall(acc, idx, uintptr(unsafe.Pointer(&child)), bstr)
	if !uia.HRESULTOK(hr) {
		return fmt.Errorf("IAccessible put failed (hr=0x%08X)", uint32(hr))
	}
	return nil
}
