//go:build !windows

package hostlife

func EnsureSingleInstanceOrExit() {}

func setupSingleInstanceIPC(onSecondInstance func()) {}

func acquireInstanceMutex() bool { return true }

func releaseInstanceMutex() {}
