import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode } from "./9-types-tmapi";
import { selectedHwndAtom } from "./2-1-atoms-windows-list";

export const doInvokeControlAtom = atom(
    null,
    async (get, _set, control: ControlNode): Promise<void> => {
        const selectedHandle = get(selectedHwndAtom);
        if (!selectedHandle || !control.runtimeId) {
            return;
        }

        try {
            console.log("💻Invoking", control.name);

            await tmApi.invokeControl(selectedHandle, control.runtimeId);
        } catch (e) {
            console.error("Failed to invoke control", e);
            notice.error(`Failed to invoke control (handle: ${selectedHandle}, runtimeId: ${control.runtimeId})`);
        }
    }
);
