package main

import (
	"embed"
	"math"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"

	"github.com/maxzz/win-watch-26/backend"
	"github.com/maxzz/win-watch-26/backend/appstate"
	"github.com/maxzz/win-watch-26/backend/bindings"
	"github.com/maxzz/win-watch-26/backend/hostlife"
	"github.com/maxzz/win-watch-26/backend/winwatch"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

//go:embed build/windows/icon.ico
var iconWindows []byte

func trayIcon() []byte {
	if runtime.GOOS == "windows" && len(iconWindows) > 0 {
		return iconWindows
	}
	return icon
}

func main() {
	service := winwatch.New()
	store := appstate.NewStore("WinWatch")
	hostlife.Init(store)
	hostlife.EnsureSingleInstanceOrExit()
	hostlife.EnsureElevatedIfRequested()

	width, height := appstate.DefaultWidth, appstate.DefaultHeight

	settings, ok := store.Load()
	if ok && settings.BoundsValid() {
		width, height = settings.Width, settings.Height
	}

	openInspector := false
	zoomFactor := 1.0
	if ok {
		openInspector = settings.DevTools
		if settings.ZoomLevel != 0 {
			zoomFactor = math.Pow(1.2, settings.ZoomLevel)
		}
	}

	app := backend.NewApp(service, store)
	backend.ApplyTrayIcon(app, trayIcon())
	api := bindings.NewApi(service, app.Context, app.RequestExit)

	winOpts := &windows.Options{
		WebviewIsTransparent: false,
		WindowIsTranslucent:  false,
		// Native page zoom (Chrome-style), applied by the WebView2 engine.
		// User wheel/keyboard zoom is disabled so the in-app zoom controls
		// remain the single source of truth for the displayed percentage;
		// the buttons drive it at runtime via App.SetZoomLevel.
		IsZoomControlEnabled: false,
		ZoomFactor:           zoomFactor,
	}
	backend.PatchWindowsOptionsForDebug(winOpts)

	err := wails.Run(&options.App{
		Title:  "UI Automation Monitor",
		Width:  width,
		Height: height,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:     app.Startup,
		OnBeforeClose: app.BeforeClose,
		OnShutdown:    app.Shutdown,
		Bind: []interface{}{
			api,
			app,
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: openInspector,
		},
		Windows: winOpts,
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
