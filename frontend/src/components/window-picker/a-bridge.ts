import { isBackgroundAvailable } from "@renderer/api/isBackgroundAvailable";

export const windowPickerBus = {
    start: async (): Promise<boolean> => {
        if (!isBackgroundAvailable && typeof tmApi.startWindowPicker !== "function") {
            return false;
        }
        try {
            return await tmApi.startWindowPicker();
        } catch (e) {
            console.error("startWindowPicker failed", e);
            return false;
        }
    },
    stop: async (): Promise<boolean> => {
        try {
            return await tmApi.stopWindowPicker();
        } catch (e) {
            console.error("stopWindowPicker failed", e);
            return false;
        }
    },
    subscribe: (callback: (json: string) => void): (() => void) => {
        try {
            return tmApi.onWindowPickerEvent(callback);
        } catch (e) {
            console.error("onWindowPickerEvent failed", e);
            return () => undefined;
        }
    },
};
