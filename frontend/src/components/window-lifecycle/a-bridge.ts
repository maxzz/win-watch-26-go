import { isBackgroundAvailable } from "@renderer/api/isBackgroundAvailable";

type HostApp = {
    GetRunElevated: () => Promise<boolean>;
    SetRunElevated: (value: boolean) => Promise<void>;
    IsElevated: () => Promise<boolean>;
    RequestElevationRestart: () => Promise<void>;
    RequestUnelevatedRestart: () => Promise<void>;
    GetQuitOnClose: () => Promise<boolean>;
    SetQuitOnClose: (value: boolean) => Promise<void>;
    GetShowInTaskbar: () => Promise<boolean>;
    SetShowInTaskbar: (value: boolean) => Promise<void>;
    RequestExit: () => Promise<void>;
};

function hostApp(): HostApp | undefined {
    if (!isBackgroundAvailable) {
        return undefined;
    }
    return (window as Window & { go?: { backend?: { App?: HostApp; }; }; }).go?.backend?.App;
}

export const hostlifeBus = {
    getRunElevated: async () => hostApp()?.GetRunElevated() ?? false,
    setRunElevated: async (value: boolean) => { await hostApp()?.SetRunElevated(value); },
    isElevated: async () => hostApp()?.IsElevated() ?? false,
    requestElevationRestart: async () => { await hostApp()?.RequestElevationRestart(); },
    requestUnelevatedRestart: async () => { await hostApp()?.RequestUnelevatedRestart(); },
    getQuitOnClose: async () => hostApp()?.GetQuitOnClose() ?? false,
    setQuitOnClose: async (value: boolean) => { await hostApp()?.SetQuitOnClose(value); },
    getShowInTaskbar: async () => hostApp()?.GetShowInTaskbar() ?? true,
    setShowInTaskbar: async (value: boolean) => { await hostApp()?.SetShowInTaskbar(value); },
    requestExit: async () => { await hostApp()?.RequestExit(); },
};
