import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster-in-status-bar";
import { selectedHwndAtom } from "@renderer/components/2-main/1-panel-windows/state-atoms/2-1-atoms-windows-list";
import { selectedControlAtom } from "@renderer/components/2-main/2-panel-controls/state-atoms/2-2-1-atoms-controls-list";
import { type AccApiKind } from "./9-types";
import { accInteractStore, executeAccAction, getDraft, loadAccInteract } from "./c-store-acc-interact";

export const doLoadAccInteractAtom = atom(
    null,
    async (get, _set, options?: { force?: boolean; }): Promise<void> => {
        const handle = get(selectedHwndAtom);
        const control = get(selectedControlAtom);
        await loadAccInteract(handle, control?.runtimeId, options);
    }
);

export const doExecuteAccActionAtom = atom(
    null,
    async (get, _set, payload: { kind: AccApiKind; actionId: string; value?: string; }): Promise<void> => {
        const handle = get(selectedHwndAtom);
        const control = get(selectedControlAtom);
        if (!handle || !control?.runtimeId) {
            return;
        }

        const value = payload.value ?? getDraft(payload.kind, payload.actionId);
        const ok = await executeAccAction(handle, control.runtimeId, payload.kind, payload.actionId, value);
        if (!ok) {
            notice.error(accInteractStore.error || `Failed to run ${payload.actionId}`);
            return;
        }
        notice.success(payload.kind === "msaa" ? "MSAA action applied" : "UI Automation action applied");
    }
);
