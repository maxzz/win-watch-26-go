//go:build windows

package main

import (
	"context"
	"log"
	"reflect"
	"unsafe"

	"github.com/wailsapp/go-webview2/pkg/edge"
)

// setWebviewZoom applies the native WebView2 page-zoom factor (the same zoom the
// Chromium engine uses for Ctrl+/- in a browser, which correctly scales the
// whole page including viewport units).
//
// Wails v2 only exposes the zoom factor as a startup option (windows.ZoomFactor)
// and provides no public runtime API to change it. We therefore reach into the
// unexported Windows frontend stored in the runtime context to obtain the
// WebView2 controller (*edge.Chromium) and the main window, then set the factor
// on the UI thread via the window's Invoke dispatcher (WebView2 COM calls must
// run on the thread that created the controller).
//
// This relies on Wails internals (verified against wails v2.12.0 /
// go-webview2 v1.0.22) and may need revisiting on a dependency upgrade.
func setWebviewZoom(ctx context.Context, factor float64) {
	log.Printf("[zoom] setWebviewZoom(%v) called", factor)
	if ctx == nil {
		log.Printf("[zoom] ABORT: ctx is nil")
		return
	}
	fe := ctx.Value("frontend")
	if fe == nil {
		log.Printf("[zoom] ABORT: ctx.Value(\"frontend\") is nil")
		return
	}
	log.Printf("[zoom] frontend type = %T", fe)
	feVal := reflect.ValueOf(fe)
	if feVal.Kind() != reflect.Ptr || feVal.IsNil() {
		log.Printf("[zoom] ABORT: frontend not a non-nil ptr (kind=%v)", feVal.Kind())
		return
	}
	feStruct := feVal.Elem()
	if feStruct.Kind() != reflect.Struct {
		log.Printf("[zoom] ABORT: frontend elem not a struct (kind=%v)", feStruct.Kind())
		return
	}

	chromium, ok := unexportedField[*edge.Chromium](feStruct, "chromium")
	if !ok || chromium == nil {
		log.Printf("[zoom] ABORT: chromium not found (ok=%v, nil=%v)", ok, chromium == nil)
		return
	}

	mainWindow, ok := unexportedValue(feStruct, "mainWindow")
	if !ok || mainWindow.IsNil() {
		log.Printf("[zoom] mainWindow not found (ok=%v); calling PutZoomFactor directly", ok)
		chromium.PutZoomFactor(factor)
		return
	}

	invoke := mainWindow.MethodByName("Invoke")
	if !invoke.IsValid() {
		log.Printf("[zoom] Invoke method not found; calling PutZoomFactor directly")
		chromium.PutZoomFactor(factor)
		return
	}

	log.Printf("[zoom] dispatching PutZoomFactor(%v) via mainWindow.Invoke", factor)
	invoke.Call([]reflect.Value{reflect.ValueOf(func() {
		chromium.PutZoomFactor(factor)
	})})
}

// unexportedValue returns an addressable, usable reflect.Value for the named
// (possibly unexported) field, clearing the read-only flag via unsafe.
func unexportedValue(s reflect.Value, name string) (reflect.Value, bool) {
	f := s.FieldByName(name)
	if !f.IsValid() || !f.CanAddr() {
		return reflect.Value{}, false
	}
	return reflect.NewAt(f.Type(), unsafe.Pointer(f.UnsafeAddr())).Elem(), true
}

// unexportedField reads an unexported field of type T from struct value s.
func unexportedField[T any](s reflect.Value, name string) (T, bool) {
	var zero T
	v, ok := unexportedValue(s, name)
	if !ok {
		return zero, false
	}
	out, ok := v.Interface().(T)
	if !ok {
		return zero, false
	}
	return out, true
}
