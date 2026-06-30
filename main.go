package main

import (
	"embed"
	"math"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"

	"github.com/maxzz/win-watch-26/internal/appstate"
	"github.com/maxzz/win-watch-26/internal/bindings"
	"github.com/maxzz/win-watch-26/internal/winwatch"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	service := winwatch.New()
	store := appstate.NewStore("WinWatch")

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

	app := NewApp(service, store)
	api := bindings.NewApi(service, app.Context)

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
	patchWindowsOptionsForDebug(winOpts)

	err := wails.Run(&options.App{
		Title:  "UI Automation Monitor",
		Width:  width,
		Height: height,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:     app.startup,
		OnBeforeClose: app.beforeClose,
		OnShutdown:    app.shutdown,
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
