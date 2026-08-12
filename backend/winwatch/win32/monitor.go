package win32

import (
	"runtime"
	"sync"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	procSetWinEventHook    = user32.NewProc("SetWinEventHook")
	procUnhookWinEvent     = user32.NewProc("UnhookWinEvent")
	procPostThreadMessageW = user32.NewProc("PostThreadMessageW")
	procGetCurrentThreadID = kernel32.NewProc("GetCurrentThreadId")
)

const (
	eventSystemForeground     = 0x0003
	eventObjectDestroy        = 0x8001
	eventSystemMinimizeStart  = 0x0016
	wineventOutOfContext      = 0x0000
	wineventSkipOwnProcess    = 0x0002
	objidWindow               = 0
	childidSelf               = 0
	wmQuit                    = 0x0012
)

// Monitor watches foreground-window changes via SetWinEventHook and invokes a
// callback (deduplicated) with the new foreground window handle. The hook runs
// on a dedicated OS-locked goroutine with its own message loop.
type Monitor struct {
	mu          sync.Mutex
	running     bool
	threadID    uint32
	callback    func(hwnd HWND)
	lastEmitted HWND
	hooks       []uintptr
	stopped     chan struct{}
}

var activeMonitor *Monitor

// NewMonitor returns an idle monitor.
func NewMonitor() *Monitor { return &Monitor{} }

// Start begins monitoring. The callback may be invoked on the monitor thread.
func (m *Monitor) Start(cb func(hwnd HWND)) {
	m.mu.Lock()
	if m.running {
		m.mu.Unlock()
		return
	}
	m.running = true
	m.callback = cb
	m.lastEmitted = 0
	m.stopped = make(chan struct{})
	m.mu.Unlock()

	activeMonitor = m
	go m.run()
}

// Stop ends monitoring and unhooks events.
func (m *Monitor) Stop() {
	m.mu.Lock()
	if !m.running {
		m.mu.Unlock()
		return
	}
	tid := m.threadID
	stopped := m.stopped
	m.mu.Unlock()

	if tid != 0 {
		procPostThreadMessageW.Call(uintptr(tid), wmQuit, 0, 0)
	}
	if stopped != nil {
		<-stopped
	}
}

func (m *Monitor) run() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	tid, _, _ := procGetCurrentThreadID.Call()
	m.mu.Lock()
	m.threadID = uint32(tid)
	m.mu.Unlock()

	cb := winEventProcAddr
	events := []struct{ min, max uint32 }{
		{eventSystemForeground, eventSystemForeground},
		{eventObjectDestroy, eventObjectDestroy},
		{eventSystemMinimizeStart, eventSystemMinimizeStart},
	}
	for _, e := range events {
		hook, _, _ := procSetWinEventHook.Call(
			uintptr(e.min), uintptr(e.max), 0, cb, 0, 0,
			wineventOutOfContext|wineventSkipOwnProcess,
		)
		if hook != 0 {
			m.hooks = append(m.hooks, hook)
		}
	}

	// Emit the current foreground once so the UI can sync immediately.
	m.emit(GetForegroundWindow())

	var msgBuf msg
	for {
		ret, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&msgBuf)), 0, 0, 0)
		if int32(ret) <= 0 {
			break
		}
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&msgBuf)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&msgBuf)))
	}

	for _, hook := range m.hooks {
		procUnhookWinEvent.Call(hook)
	}
	m.hooks = nil

	m.mu.Lock()
	m.running = false
	m.threadID = 0
	stopped := m.stopped
	m.mu.Unlock()
	if stopped != nil {
		close(stopped)
	}
}

func (m *Monitor) emit(hwnd HWND) {
	if hwnd == 0 || !IsWindow(hwnd) {
		return
	}
	m.mu.Lock()
	if m.lastEmitted == hwnd {
		m.mu.Unlock()
		return
	}
	m.lastEmitted = hwnd
	cb := m.callback
	m.mu.Unlock()
	if cb != nil {
		cb(hwnd)
	}
}

// winEventProcAddr is the WinEventProc callback. All parameters are declared
// as uintptr because windows.NewCallback widens every argument to a machine
// word; idObject/idChild are interpreted as signed 32-bit values.
var winEventProcAddr = windows.NewCallback(func(_ uintptr, event uintptr, hwnd uintptr, idObject uintptr, idChild uintptr, _ uintptr, _ uintptr) uintptr {
	if int32(idObject) != objidWindow || int32(idChild) != childidSelf {
		return 0
	}
	m := activeMonitor
	if m == nil {
		return 0
	}
	switch uint32(event) {
	case eventSystemForeground:
		m.emit(HWND(hwnd))
	case eventObjectDestroy, eventSystemMinimizeStart:
		m.emit(GetForegroundWindow())
	}
	return 0
})
