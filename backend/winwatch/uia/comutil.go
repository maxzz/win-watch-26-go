package uia

import (
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	procSysAllocString = oleaut32.NewProc("SysAllocString")
	procVariantInit    = oleaut32.NewProc("VariantInit")
	procVariantClear   = oleaut32.NewProc("VariantClear")
)

const (
	IdxElemSetFocus              = 3
	IdxElemHasKeyboardFocus      = 26
	IdxElemIsKeyboardFocusable   = 27
	IdxElemGetCurrentPattern     = idxElemGetCurrentPattern
	IdxElemCurName               = idxElemCurName
	IdxElemCurNativeWindowHandle = idxElemCurNativeWindowHandle
)

const (
	VT_EMPTY = 0
	VT_I2    = 2
	VT_I4    = 3
	VT_BSTR  = 8
	VT_BOOL  = 11
	VT_UI4   = 19
)

// Variant is the 16-byte COM VARIANT layout used by go-ole / oleaut32.
type Variant struct {
	VT        uint16
	Reserved1 uint16
	Reserved2 uint16
	Reserved3 uint16
	Val       int64
}

func VariantChildSelf() Variant {
	return Variant{VT: VT_I4}
}

func (v *Variant) Init() {
	procVariantInit.Call(uintptr(unsafe.Pointer(v)))
}

func (v *Variant) Clear() {
	procVariantClear.Call(uintptr(unsafe.Pointer(v)))
}

func (v *Variant) Int() (int32, bool) {
	switch v.VT {
	case VT_I2:
		return int32(int16(v.Val)), true
	case VT_I4:
		return int32(v.Val), true
	case VT_UI4:
		return int32(uint32(v.Val)), true
	case VT_BOOL:
		if int16(v.Val) != 0 {
			return 1, true
		}
		return 0, true
	}
	return 0, false
}

func (v *Variant) String() string {
	if v.VT == VT_BSTR && v.Val != 0 {
		return windows.UTF16PtrToString((*uint16)(asPointer(uintptr(v.Val))))
	}
	return ""
}

func EnsureStarted(a *Automation) bool {
	return a.ensureStarted()
}

func Do(a *Automation, f func()) {
	a.do(f)
}

// WithTarget finds the control-view element for runtimeID under hwnd and
// invokes f on the UIA worker thread. An empty runtimeID uses the window root.
func WithTarget(a *Automation, hwnd uintptr, runtimeID string, f func(target uintptr, isRoot bool)) bool {
	found := false
	a.withTarget(hwnd, runtimeID, func(target uintptr, isRoot bool) {
		found = true
		f(target, isRoot)
	})
	if found || runtimeID != "" {
		return found
	}
	// Empty runtime id: withTarget's find fails; use the window root directly.
	var root uintptr
	hr := comCall(a.ptr, idxAutoElementFromHandle, hwnd, uintptr(unsafe.Pointer(&root)))
	if int32(hr) < 0 || root == 0 {
		return false
	}
	defer release(root)
	f(root, true)
	return true
}

func ComCall(obj uintptr, idx int, args ...uintptr) uintptr {
	return comCall(obj, idx, args...)
}

func Release(obj uintptr) {
	release(obj)
}

func GetString(elem uintptr, idx int) string {
	return getString(elem, idx)
}

func GetInt32(elem uintptr, idx int) int32 {
	return getInt32(elem, idx)
}

func GetBool(elem uintptr, idx int) bool {
	return getBool(elem, idx)
}

func GetUint32(elem uintptr, idx int) uint32 {
	return getUint32(elem, idx)
}

func GetHandle(elem uintptr, idx int) uintptr {
	return getHandle(elem, idx)
}

func GetCurrentPattern(elem uintptr, patternID int) uintptr {
	var p uintptr
	hr := comCall(elem, idxElemGetCurrentPattern, uintptr(patternID), uintptr(unsafe.Pointer(&p)))
	if int32(hr) < 0 {
		return 0
	}
	return p
}

func SetFocus(elem uintptr) bool {
	return int32(comCall(elem, IdxElemSetFocus)) >= 0
}

func AllocBSTR(s string) (uintptr, error) {
	p, err := windows.UTF16PtrFromString(s)
	if err != nil {
		return 0, err
	}
	r, _, _ := procSysAllocString.Call(uintptr(unsafe.Pointer(p)))
	return r, nil
}

func FreeBSTR(bstr uintptr) {
	if bstr != 0 {
		procSysFreeString.Call(bstr)
	}
}

func GetStringFromBSTR(bstr uintptr) string {
	if bstr == 0 {
		return ""
	}
	return windows.UTF16PtrToString((*uint16)(asPointer(bstr)))
}

func UTF16Ptr(s string) (*uint16, error) {
	return windows.UTF16PtrFromString(s)
}

func HRESULTOK(hr uintptr) bool {
	return int32(hr) >= 0
}

func GetFloat64(obj uintptr, idx int) (float64, bool) {
	var v float64
	hr := comCall(obj, idx, uintptr(unsafe.Pointer(&v)))
	return v, int32(hr) >= 0
}

// BoundingRect returns the element's current rectangle, using the DWM visible
// frame for top-level windows (same rule as the control-tree bounds).
func BoundingRect(elem uintptr) (Bounds, bool) {
	r, ok := getRect(elem, idxElemCurBoundingRectangle)
	if !ok {
		return Bounds{}, false
	}
	native := getHandle(elem, idxElemCurNativeWindowHandle)
	return visibleBoundsForHwnd(native, Bounds{Left: r.left, Top: r.top, Right: r.right, Bottom: r.bottom}), true
}
