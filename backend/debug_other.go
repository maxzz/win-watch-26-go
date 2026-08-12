//go:build !windows

package backend

import "github.com/wailsapp/wails/v2/pkg/options/windows"

func PatchWindowsOptionsForDebug(o *windows.Options) {}
