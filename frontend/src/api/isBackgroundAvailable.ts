// True when the page runs inside Wails with the Go backend bound (window.go +
// window.runtime). False in a plain browser (e.g. `pnpm dev` / Vite on :5173).
// Evaluated once at module load — the bindings are injected before JS runs and
// do not change for the lifetime of the page.
function detectBackgroundAvailable(): boolean {
    if (typeof window === "undefined") {
        return false;
    }
    const w = window as Window & {
        go?: { bindings?: { Api?: unknown }; main?: { App?: unknown } };
        runtime?: { EventsOnMultiple?: unknown };
    };
    return !!(
        w.go?.bindings?.Api &&
        w.go?.main?.App &&
        w.runtime?.EventsOnMultiple
    );
}

export const isBackgroundAvailable = detectBackgroundAvailable();
