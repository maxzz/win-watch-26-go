package winpicker

import (
	"image"
	"sync"
	"unsafe"

	"github.com/maxzz/win-watch-26/backend/winwatch/win32"
	"golang.org/x/sys/windows"
)

var (
	procRegisterClassExW    = user32.NewProc("RegisterClassExW")
	procCreateWindowExW     = user32.NewProc("CreateWindowExW")
	procDestroyWindow       = user32.NewProc("DestroyWindow")
	procShowWindow          = user32.NewProc("ShowWindow")
	procSetWindowPos        = user32.NewProc("SetWindowPos")
	procDefWindowProcW      = user32.NewProc("DefWindowProcW")
	procUpdateLayeredWindow = user32.NewProc("UpdateLayeredWindow")
	procCreateCompatibleDC  = gdi32.NewProc("CreateCompatibleDC")
	procSelectObject        = gdi32.NewProc("SelectObject")
	procDeleteDC            = gdi32.NewProc("DeleteDC")
	procShowCursor          = user32.NewProc("ShowCursor")
)

const (
	wsPopup        = 0x80000000
	wsExTopmost    = 0x00000008
	wsExLayered    = 0x00080000
	wsExToolWindow = 0x00000080
	wsExNoActivate = 0x08000000
	wsExTransp     = 0x00000020

	swHide   = 0
	swShowNA = 8

	swpNosize     = 0x0001
	swpNozorder   = 0x0004
	swpNoactivate = 0x0010

	acSrcOver  = 0x00
	acSrcAlpha = 0x01
	ulwAlpha   = 0x00000002
)

type overlayPoint struct{ X, Y int32 }
type overlaySize struct{ Cx, Cy int32 }

type overlayWndClassExW struct {
	cbSize        uint32
	style         uint32
	lpfnWndProc   uintptr
	cbClsExtra    int32
	cbWndExtra    int32
	hInstance     uintptr
	hIcon         uintptr
	hCursor       uintptr
	hbrBackground uintptr
	lpszMenuName  *uint16
	lpszClassName *uint16
	hIconSm       uintptr
}

type blendFunction struct {
	BlendOp             byte
	BlendFlags          byte
	SourceConstantAlpha byte
	AlphaFormat         byte
}

var (
	overlayClassName = windows.StringToUTF16Ptr("WinWatchPickerOverlay")
	overlayProcAddr  = windows.NewCallback(overlayWndProc)
	overlayClassOnce sync.Once
)

func overlayWndProc(hwnd, message, wParam, lParam uintptr) uintptr {
	ret, _, _ := procDefWindowProcW.Call(hwnd, message, wParam, lParam)
	return ret
}

func registerOverlayClass() {
	overlayClassOnce.Do(func() {
		wc := overlayWndClassExW{
			lpfnWndProc:   overlayProcAddr,
			hInstance:     win32.GetModuleHandle(),
			lpszClassName: overlayClassName,
		}
		wc.cbSize = uint32(unsafe.Sizeof(wc))
		procRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc)))
	})
}

func (s *Session) installDragIcon() {
	if s.iconMode == DragIconLayeredWindow && s.createOverlay() {
		s.hideSystemCursor()
		return
	}
	s.installCursor()
}

func (s *Session) restoreDragIcon() {
	s.destroyOverlay()
	s.showSystemCursor()
	s.restoreCursors()
}

func (s *Session) hideSystemCursor() {
	if s.cursorHidden {
		return
	}
	procShowCursor.Call(0)
	s.cursorHidden = true
}

func (s *Session) showSystemCursor() {
	if !s.cursorHidden {
		return
	}
	procShowCursor.Call(1)
	s.cursorHidden = false
}

func (s *Session) createOverlay() bool {
	img, err := decodePNGNative(targetPNG)
	if err != nil || img == nil {
		return false
	}
	width, height := img.Bounds().Dx(), img.Bounds().Dy()
	if width < 1 || height < 1 {
		return false
	}

	registerOverlayClass()

	pt, _ := win32.GetCursorPos()
	halfW := int32(width / 2)
	halfH := int32(height / 2)
	x := pt.X - halfW
	y := pt.Y - halfH

	hwnd, _, _ := procCreateWindowExW.Call(
		wsExTopmost|wsExLayered|wsExToolWindow|wsExNoActivate|wsExTransp,
		uintptr(unsafe.Pointer(overlayClassName)),
		uintptr(unsafe.Pointer(windows.StringToUTF16Ptr(""))),
		wsPopup,
		uintptr(uint32(x)),
		uintptr(uint32(y)),
		uintptr(width),
		uintptr(height),
		0, 0, win32.GetModuleHandle(), 0,
	)
	if hwnd == 0 {
		return false
	}

	if !paintOverlayAlpha(hwnd, img, x, y) {
		procDestroyWindow.Call(hwnd)
		return false
	}

	procShowWindow.Call(hwnd, swShowNA)
	s.overlayHwnd = hwnd
	s.overlayHalfW = halfW
	s.overlayHalfH = halfH
	return true
}

func paintOverlayAlpha(hwnd uintptr, img *image.NRGBA, x, y int32) bool {
	width, height, bgra := nrgbaToPremulBGRA(img)
	hdcScreen, _, _ := procGetDC.Call(0)
	if hdcScreen == 0 {
		return false
	}
	defer procReleaseDC.Call(0, hdcScreen)

	hdcMem, _, _ := procCreateCompatibleDC.Call(hdcScreen)
	if hdcMem == 0 {
		return false
	}
	defer procDeleteDC.Call(hdcMem)

	header := bitmapInfoHeader{
		Size:        uint32(unsafe.Sizeof(bitmapInfoHeader{})),
		Width:       int32(width),
		Height:      -int32(height),
		Planes:      1,
		BitCount:    32,
		Compression: biRGB,
		SizeImage:   uint32(len(bgra)),
	}

	var bits unsafe.Pointer
	hbm, _, _ := procCreateDIBSection.Call(
		hdcMem,
		uintptr(unsafe.Pointer(&header)),
		dibRGBColors,
		uintptr(unsafe.Pointer(&bits)),
		0, 0,
	)
	if hbm == 0 || bits == nil {
		return false
	}
	defer procDeleteObject.Call(hbm)

	copy(unsafe.Slice((*byte)(bits), len(bgra)), bgra)

	old, _, _ := procSelectObject.Call(hdcMem, hbm)
	blend := blendFunction{
		BlendOp:             acSrcOver,
		SourceConstantAlpha: 255,
		AlphaFormat:         acSrcAlpha,
	}
	ptPos := overlayPoint{X: x, Y: y}
	sz := overlaySize{Cx: int32(width), Cy: int32(height)}
	ptSrc := overlayPoint{}
	ret, _, _ := procUpdateLayeredWindow.Call(
		hwnd,
		hdcScreen,
		uintptr(unsafe.Pointer(&ptPos)),
		uintptr(unsafe.Pointer(&sz)),
		hdcMem,
		uintptr(unsafe.Pointer(&ptSrc)),
		0,
		uintptr(unsafe.Pointer(&blend)),
		ulwAlpha,
	)
	procSelectObject.Call(hdcMem, old)
	return ret != 0
}

func (s *Session) moveOverlay() {
	if s.overlayHwnd == 0 {
		return
	}
	pt, ok := win32.GetCursorPos()
	if !ok {
		return
	}
	x := pt.X - s.overlayHalfW
	y := pt.Y - s.overlayHalfH
	procSetWindowPos.Call(
		s.overlayHwnd,
		0,
		uintptr(uint32(x)),
		uintptr(uint32(y)),
		0, 0,
		swpNosize|swpNozorder|swpNoactivate,
	)
}

func (s *Session) destroyOverlay() {
	if s.overlayHwnd == 0 {
		return
	}
	procShowWindow.Call(s.overlayHwnd, swHide)
	procDestroyWindow.Call(s.overlayHwnd)
	s.overlayHwnd = 0
}
