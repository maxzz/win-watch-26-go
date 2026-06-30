//go:build windows && (debug || dev)

package main

import "github.com/wailsapp/wails/v2/pkg/options/windows"

// patchWindowsOptionsForDebug relaxes WebView2 renderer integrity checks so Delve
// can inject its debug DLLs without crashing the webview process.
func patchWindowsOptionsForDebug(o *windows.Options) {
	o.WebviewDisableRendererCodeIntegrity = true
}
