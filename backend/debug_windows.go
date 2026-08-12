//go:build windows

package backend

import (
	"os"

	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

// PatchWindowsOptionsForDebug relaxes WebView2 renderer integrity checks so Delve
// can inject its debug DLLs without crashing the webview process. It only applies
// when WW_DEBUG is set (the VS Code debug tasks export it), so production builds
// keep the default WebView2 security behaviour.
func PatchWindowsOptionsForDebug(o *windows.Options) {
	if os.Getenv("WW_DEBUG") != "" {
		o.WebviewDisableRendererCodeIntegrity = true
	}
}
