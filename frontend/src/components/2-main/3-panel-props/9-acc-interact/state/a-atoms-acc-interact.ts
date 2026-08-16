import { atom } from "jotai";
import { report } from "@renderer/components/3-footer/report-panel";
import { selectedHwndAtom } from "@renderer/components/2-main/1-panel-windows/state-atoms/2-1-atoms-windows-list";
import { selectedControlAtom } from "@renderer/components/2-main/2-panel-controls/state-atoms/2-2-1-atoms-controls-list";
import { type AccApiKind } from "./9-types";
import { accInteractStore, executeAccAction, getDraft, loadAccInteract } from "./0-acc-interactions";
import { describeAccAction, findAccAction } from "./1-format-action-report";

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
        const described = describeAccAction({
            kind: payload.kind,
            actionId: payload.actionId,
            value,
            action: findAccAction(accInteractStore.snapshot, payload.kind, payload.actionId),
            controlName: control.name,
        });

        const ok = await executeAccAction(handle, control.runtimeId, payload.kind, payload.actionId, value);
        if (!ok) {
            report.error(described.failedTitle, {
                source: payload.kind,
                detail: accInteractStore.error || described.failedDetail,
                fields: described.fields,
            });
            return;
        }

        report.success(described.title, {
            source: payload.kind,
            detail: described.detail,
            fields: described.fields,
        });
    }
);
