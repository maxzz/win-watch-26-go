//go:build !windows

package platform

func IsDevToolsOpen() bool { return false }

func CloseDevTools() {}
