//go:build windows

package main

import (
	"os"

	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

// patchWindowsOptionsForDebug relaxes WebView2 renderer integrity checks so Delve
// can inject its debug DLLs without crashing the webview process. It only applies
// when WW_DEBUG is set (the VS Code debug tasks export it), so production builds
// keep the default WebView2 security behaviour.
func patchWindowsOptionsForDebug(o *windows.Options) {
	if os.Getenv("WW_DEBUG") != "" {
		o.WebviewDisableRendererCodeIntegrity = true
	}
}
