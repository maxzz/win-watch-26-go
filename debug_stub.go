//go:build !windows || (!debug && !dev)

package main

import "github.com/wailsapp/wails/v2/pkg/options/windows"

func patchWindowsOptionsForDebug(o *windows.Options) {}
