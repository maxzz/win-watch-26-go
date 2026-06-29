// tmApi bootstrap: picks the Wails-backed shim or a browser stub so the React
// UI can run under Vite without the .exe (for layout/theming work).

import { isBackgroundAvailable } from "./isBackgroundAvailable";

export { isBackgroundAvailable } from "./isBackgroundAvailable";

export async function installTmApi(): Promise<void> {
    const target = globalThis as unknown as { tmApi: WinWatchApi };

    if (isBackgroundAvailable()) {
        const { createWailsTmApi, installWailsTmApiExtras } = await import("./tmApi.wails");
        target.tmApi = createWailsTmApi();
        installWailsTmApiExtras();
        return;
    }

    const { createBrowserTmApi, installBrowserTmApiExtras } = await import("./tmApi.browser");
    target.tmApi = createBrowserTmApi();
    installBrowserTmApiExtras();
}
