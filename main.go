package main

import (
	"embed"

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
	if ok {
		openInspector = settings.DevTools
	}

	app := NewApp(service, store)
	api := bindings.NewApi(service, app.Context)

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
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
