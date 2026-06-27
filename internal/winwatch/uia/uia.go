// Package uia is a minimal, pure-Go wrapper over the Microsoft UI Automation
// COM API (IUIAutomation). It calls COM interface methods directly through
// their vtables (no cgo) and runs every COM call on a single dedicated,
// OS-locked goroutine so the MTA apartment stays consistent.
//
// It reimplements the subset used by the original C++ ControlTree: walking the
// control-view tree, invoking controls and reading a control's current bounds.
package uia

import (
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"

	"github.com/maxzz/win-watch-26/internal/winwatch/win32"
)

var (
	ole32    = windows.NewLazySystemDLL("ole32.dll")
	oleaut32 = windows.NewLazySystemDLL("oleaut32.dll")

	procCoInitializeEx   = ole32.NewProc("CoInitializeEx")
	procCoUninitialize   = ole32.NewProc("CoUninitialize")
	procCoCreateInstance = ole32.NewProc("CoCreateInstance")

	procSysFreeString        = oleaut32.NewProc("SysFreeString")
	procSafeArrayGetLBound   = oleaut32.NewProc("SafeArrayGetLBound")
	procSafeArrayGetUBound   = oleaut32.NewProc("SafeArrayGetUBound")
	procSafeArrayAccessData  = oleaut32.NewProc("SafeArrayAccessData")
	procSafeArrayUnaccessDat = oleaut32.NewProc("SafeArrayUnaccessData")
	procSafeArrayDestroy     = oleaut32.NewProc("SafeArrayDestroy")
)

const (
	coinitMultithreaded = 0x0
	clsctxInprocServer  = 0x1

	uiaInvokePatternID = 10000
	uiaTogglePatternID = 10015
	uiaLegacyPatternID = 10018
)

// IUIAutomation method indices.
const (
	idxAutoElementFromHandle    = 6
	idxAutoGetControlViewWalker = 14
)

// IUIAutomationElement method indices.
const (
	idxElemRelease                = 2
	idxElemGetRuntimeID           = 4
	idxElemGetCurrentPattern      = 16
	idxElemCurProcessID           = 20
	idxElemCurControlType         = 21
	idxElemCurLocalizedType       = 22
	idxElemCurName                = 23
	idxElemCurIsEnabled           = 28
	idxElemCurAutomationID        = 29
	idxElemCurClassName           = 30
	idxElemCurNativeWindowHandle  = 36
	idxElemCurIsOffscreen         = 38
	idxElemCurFrameworkID         = 40
	idxElemCurBoundingRectangle   = 43
)

// IUIAutomationTreeWalker method indices.
const (
	idxWalkerGetFirstChild   = 4
	idxWalkerGetNextSibling  = 6
)

// IUIAutomationInvokePattern / TogglePattern / LegacyIAccessiblePattern indices.
const (
	idxInvokeInvoke   = 3
	idxToggleToggle   = 3
	idxLegacyGetRole  = 11
	idxLegacyGetState = 12
)

var (
	clsidCUIAutomation = windows.GUID{Data1: 0xFF48DBA4, Data2: 0x60EF, Data3: 0x4201, Data4: [8]byte{0xAA, 0x87, 0x54, 0x10, 0x3E, 0xEF, 0x59, 0x4E}}
	iidIUIAutomation   = windows.GUID{Data1: 0x30CBE57D, Data2: 0xD9D0, Data3: 0x452A, Data4: [8]byte{0xAB, 0x13, 0x7A, 0xC5, 0xAC, 0x48, 0x25, 0xEE}}
)

// Bounds mirrors the JSON shape emitted by the original C++ code.
type Bounds struct {
	Left   int32 `json:"left"`
	Top    int32 `json:"top"`
	Right  int32 `json:"right"`
	Bottom int32 `json:"bottom"`
}

type rect struct{ left, top, right, bottom int32 }

// ControlNode mirrors the JSON object produced by ControlTree::ToJson so the
// React renderer parses it unchanged.
type ControlNode struct {
	Name                                string        `json:"name"`
	ControlType                         string        `json:"controlType"`
	AutomationID                        string        `json:"automationId"`
	ClassName                           string        `json:"className"`
	RuntimeID                           string        `json:"runtimeId"`
	NativeWindowHandle                  string        `json:"nativeWindowHandle"`
	ParentWindowHandle                  string        `json:"parentWindowHandle"`
	HasHTMLAccess                       bool          `json:"hasHtmlAccess"`
	IsLegacyIAccessiblePatternAvailable bool          `json:"isLegacyIAccessiblePatternAvailable"`
	CurrentRole                         uint32        `json:"currentRole"`
	CurrentState                        uint32        `json:"currentState"`
	FrameworkID                         string        `json:"frameworkId"`
	LocalizedControlType                string        `json:"localizedControlType"`
	ProcessID                           int32         `json:"processId"`
	Bounds                              Bounds        `json:"bounds"`
	IsEnabled                           bool          `json:"isEnabled"`
	IsVisible                           bool          `json:"isVisible"`
	Children                            []ControlNode `json:"children"`
}

// Automation owns the IUIAutomation instance and serializes all COM access
// onto a single OS thread.
type Automation struct {
	reqs    chan func()
	startMu sync.Mutex
	ptr     uintptr
	started bool
	ok      bool
}

// New returns an Automation. COM is initialized lazily on first use.
func New() *Automation {
	return &Automation{reqs: make(chan func())}
}

func (a *Automation) ensureStarted() bool {
	a.startMu.Lock()
	defer a.startMu.Unlock()
	if a.started {
		return a.ok
	}
	a.started = true

	ready := make(chan bool, 1)
	go a.worker(ready)
	a.ok = <-ready
	return a.ok
}

func (a *Automation) worker(ready chan bool) {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	procCoInitializeEx.Call(0, coinitMultithreaded)

	var ptr uintptr
	hr, _, _ := procCoCreateInstance.Call(
		uintptr(unsafe.Pointer(&clsidCUIAutomation)),
		0,
		clsctxInprocServer,
		uintptr(unsafe.Pointer(&iidIUIAutomation)),
		uintptr(unsafe.Pointer(&ptr)),
	)
	if int32(hr) < 0 || ptr == 0 {
		procCoUninitialize.Call()
		ready <- false
		return
	}
	a.ptr = ptr
	ready <- true

	for fn := range a.reqs {
		fn()
	}
}

func (a *Automation) do(f func()) {
	done := make(chan struct{})
	a.reqs <- func() {
		f()
		close(done)
	}
	<-done
}

// comCall invokes the vtable method at idx on the COM object obj.
func comCall(obj uintptr, idx int, args ...uintptr) uintptr {
	vtbl := *(*uintptr)(unsafe.Pointer(obj))
	fn := *(*uintptr)(unsafe.Pointer(vtbl + uintptr(idx)*unsafe.Sizeof(uintptr(0))))
	all := make([]uintptr, 0, len(args)+1)
	all = append(all, obj)
	all = append(all, args...)
	ret, _, _ := syscall.SyscallN(fn, all...)
	return ret
}

func release(obj uintptr) {
	if obj != 0 {
		comCall(obj, idxElemRelease)
	}
}

func getString(elem uintptr, idx int) string {
	var bstr uintptr
	hr := comCall(elem, idx, uintptr(unsafe.Pointer(&bstr)))
	if int32(hr) < 0 || bstr == 0 {
		return ""
	}
	s := windows.UTF16PtrToString((*uint16)(unsafe.Pointer(bstr)))
	procSysFreeString.Call(bstr)
	return s
}

func getInt32(elem uintptr, idx int) int32 {
	var v int32
	comCall(elem, idx, uintptr(unsafe.Pointer(&v)))
	return v
}

func getBool(elem uintptr, idx int) bool {
	var v int32
	comCall(elem, idx, uintptr(unsafe.Pointer(&v)))
	return v != 0
}

func getUint32(elem uintptr, idx int) uint32 {
	var v uint32
	comCall(elem, idx, uintptr(unsafe.Pointer(&v)))
	return v
}

func getHandle(elem uintptr, idx int) uintptr {
	var v uintptr
	comCall(elem, idx, uintptr(unsafe.Pointer(&v)))
	return v
}

func getRect(elem uintptr, idx int) (rect, bool) {
	var r rect
	hr := comCall(elem, idx, uintptr(unsafe.Pointer(&r)))
	return r, int32(hr) >= 0
}

func getRuntimeIDString(elem uintptr) string {
	var psa uintptr
	hr := comCall(elem, idxElemGetRuntimeID, uintptr(unsafe.Pointer(&psa)))
	if int32(hr) < 0 || psa == 0 {
		return ""
	}
	defer procSafeArrayDestroy.Call(psa)

	var lower, upper int32
	procSafeArrayGetLBound.Call(psa, 1, uintptr(unsafe.Pointer(&lower)))
	procSafeArrayGetUBound.Call(psa, 1, uintptr(unsafe.Pointer(&upper)))

	var data uintptr
	if r, _, _ := procSafeArrayAccessData.Call(psa, uintptr(unsafe.Pointer(&data))); int32(r) < 0 || data == 0 {
		return ""
	}
	defer procSafeArrayUnaccessDat.Call(psa)

	var parts []string
	for i := lower; i <= upper; i++ {
		val := *(*int32)(unsafe.Pointer(data + uintptr(i-lower)*unsafe.Sizeof(int32(0))))
		parts = append(parts, strconv.Itoa(int(val)))
	}
	return strings.Join(parts, ".")
}

// hwndToHex formats a native handle as fixed-width 0x hex (matches win32).
func hwndToHex(h uintptr) string {
	if h == 0 {
		return ""
	}
	width := int(unsafe.Sizeof(uintptr(0))) * 2
	return "0x" + strings.ToUpper(padHex(strconv.FormatUint(uint64(h), 16), width))
}

func padHex(s string, width int) string {
	for len(s) < width {
		s = "0" + s
	}
	return s
}

// GetControlTree returns the control-view tree rooted at the given window
// handle. It returns (node, true) on success.
func (a *Automation) GetControlTree(hwnd uintptr) (ControlNode, bool) {
	if !a.ensureStarted() {
		return ControlNode{}, false
	}
	var node ControlNode
	ok := false
	a.do(func() {
		var root uintptr
		hr := comCall(a.ptr, idxAutoElementFromHandle, hwnd, uintptr(unsafe.Pointer(&root)))
		if int32(hr) < 0 || root == 0 {
			return
		}
		defer release(root)

		var walker uintptr
		comCall(a.ptr, idxAutoGetControlViewWalker, uintptr(unsafe.Pointer(&walker)))
		if walker != 0 {
			defer release(walker)
		}
		node = a.walk(root, walker)
		ok = true
	})
	return node, ok
}

func (a *Automation) walk(elem uintptr, walker uintptr) ControlNode {
	node := ControlNode{Children: []ControlNode{}}

	node.Name = getString(elem, idxElemCurName)
	node.FrameworkID = getString(elem, idxElemCurFrameworkID)
	node.AutomationID = getString(elem, idxElemCurAutomationID)
	node.ClassName = getString(elem, idxElemCurClassName)
	node.LocalizedControlType = getString(elem, idxElemCurLocalizedType)
	node.ControlType = strconv.Itoa(int(getInt32(elem, idxElemCurControlType)))
	node.RuntimeID = getRuntimeIDString(elem)

	native := getHandle(elem, idxElemCurNativeWindowHandle)
	node.NativeWindowHandle = hwndToHex(native)
	if native != 0 && win32.IsWindow(win32.HWND(native)) {
		node.ParentWindowHandle = hwndToHex(uintptr(win32.GetParentWindow(win32.HWND(native))))
	}

	node.HasHTMLAccess = false // HTML/IAccessible probing is not ported

	var legacy uintptr
	if hr := comCall(elem, idxElemGetCurrentPattern, uiaLegacyPatternID, uintptr(unsafe.Pointer(&legacy))); int32(hr) >= 0 && legacy != 0 {
		node.IsLegacyIAccessiblePatternAvailable = true
		node.CurrentRole = getUint32(legacy, idxLegacyGetRole)
		node.CurrentState = getUint32(legacy, idxLegacyGetState)
		release(legacy)
	}

	node.ProcessID = getInt32(elem, idxElemCurProcessID)

	if r, ok := getRect(elem, idxElemCurBoundingRectangle); ok {
		node.Bounds = Bounds{Left: r.left, Top: r.top, Right: r.right, Bottom: r.bottom}
	}

	node.IsEnabled = getBool(elem, idxElemCurIsEnabled)
	offscreen := getBool(elem, idxElemCurIsOffscreen)
	node.IsVisible = !offscreen

	if walker == 0 {
		return node
	}

	var child uintptr
	comCall(walker, idxWalkerGetFirstChild, elem, uintptr(unsafe.Pointer(&child)))
	for child != 0 {
		node.Children = append(node.Children, a.walk(child, walker))
		var next uintptr
		comCall(walker, idxWalkerGetNextSibling, child, uintptr(unsafe.Pointer(&next)))
		release(child)
		child = next
	}
	return node
}

func (a *Automation) findByRuntimeID(root, walker uintptr, runtimeID string) uintptr {
	if getRuntimeIDString(root) == runtimeID {
		return root // caller must not release the matched root separately
	}
	if walker == 0 {
		return 0
	}
	var child uintptr
	comCall(walker, idxWalkerGetFirstChild, root, uintptr(unsafe.Pointer(&child)))
	for child != 0 {
		if getRuntimeIDString(child) == runtimeID {
			return child
		}
		if found := a.findByRuntimeID(child, walker, runtimeID); found != 0 {
			if found != child {
				release(child)
			}
			return found
		}
		var next uintptr
		comCall(walker, idxWalkerGetNextSibling, child, uintptr(unsafe.Pointer(&next)))
		release(child)
		child = next
	}
	return 0
}

func (a *Automation) withTarget(hwnd uintptr, runtimeID string, f func(target uintptr)) {
	var root uintptr
	hr := comCall(a.ptr, idxAutoElementFromHandle, hwnd, uintptr(unsafe.Pointer(&root)))
	if int32(hr) < 0 || root == 0 {
		return
	}
	defer release(root)

	var walker uintptr
	comCall(a.ptr, idxAutoGetControlViewWalker, uintptr(unsafe.Pointer(&walker)))
	if walker != 0 {
		defer release(walker)
	}

	target := a.findByRuntimeID(root, walker, runtimeID)
	if target == 0 {
		return
	}
	if target != root {
		defer release(target)
	}
	f(target)
}

// InvokeControl invokes (or toggles) the control identified by runtimeID.
func (a *Automation) InvokeControl(hwnd uintptr, runtimeID string) bool {
	if !a.ensureStarted() {
		return false
	}
	result := false
	a.do(func() {
		a.withTarget(hwnd, runtimeID, func(target uintptr) {
			var invoke uintptr
			if hr := comCall(target, idxElemGetCurrentPattern, uiaInvokePatternID, uintptr(unsafe.Pointer(&invoke))); int32(hr) >= 0 && invoke != 0 {
				r := comCall(invoke, idxInvokeInvoke)
				release(invoke)
				result = int32(r) >= 0
				return
			}
			var toggle uintptr
			if hr := comCall(target, idxElemGetCurrentPattern, uiaTogglePatternID, uintptr(unsafe.Pointer(&toggle))); int32(hr) >= 0 && toggle != 0 {
				r := comCall(toggle, idxToggleToggle)
				release(toggle)
				result = int32(r) >= 0
			}
		})
	})
	return result
}

// GetControlBounds returns the current bounding rectangle of a control.
func (a *Automation) GetControlBounds(hwnd uintptr, runtimeID string) (Bounds, bool) {
	if !a.ensureStarted() {
		return Bounds{}, false
	}
	var b Bounds
	ok := false
	a.do(func() {
		a.withTarget(hwnd, runtimeID, func(target uintptr) {
			if r, valid := getRect(target, idxElemCurBoundingRectangle); valid {
				b = Bounds{Left: r.left, Top: r.top, Right: r.right, Bottom: r.bottom}
				ok = true
			}
		})
	})
	return b, ok
}
