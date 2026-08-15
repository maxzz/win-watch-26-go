import { proxy } from "valtio";
import { type AccActionDef, type AccActionResult, type AccInteractSnapshot, emptyMsaaSection, emptyUiaSection } from "./9-types";

type AccInteractState = {
    key: string | null;
    snapshot: AccInteractSnapshot | null;
    loading: boolean;
    error: string | null;
    busyActionId: string | null;
    drafts: Record<string, string>;
    uiaOpen: boolean;
    msaaOpen: boolean;
};

export const accInteractStore = proxy<AccInteractState>({
    key: null,
    snapshot: null,
    loading: false,
    error: null,
    busyActionId: null,
    drafts: {},
    uiaOpen: true,
    msaaOpen: true,
});

let selectionRequestId = 0;

function selectionKey(handle: string | null | undefined, runtimeId: string | null | undefined): string | null {
    if (!handle || !runtimeId) {
        return null;
    }
    return `${handle}\0${runtimeId}`;
}

export function draftKey(kind: string, actionId: string): string {
    return `${kind}:${actionId}`;
}

export function getDraft(kind: string, actionId: string, fallback = ""): string {
    return accInteractStore.drafts[draftKey(kind, actionId)] ?? fallback;
}

export function setDraft(kind: string, actionId: string, value: string): void {
    accInteractStore.drafts[draftKey(kind, actionId)] = value;
}

function seedDrafts(snapshot: AccInteractSnapshot): void {
    const seed = (kind: string, actions: readonly AccActionDef[]) => {
        for (const action of actions) {
            if (!action.currentValue) {
                continue;
            }
            const key = draftKey(kind, action.id);
            if (accInteractStore.drafts[key] === undefined) {
                accInteractStore.drafts[key] = action.currentValue;
            }
        }
    };
    seed("uia", snapshot.uia.actions);
    for (const pattern of snapshot.uia.patterns) {
        seed("uia", pattern.actions);
    }
    seed("msaa", snapshot.msaa.actions);
}

function applySnapshot(key: string, snapshot: AccInteractSnapshot): void {
    accInteractStore.key = key;
    accInteractStore.snapshot = snapshot;
    accInteractStore.error = snapshot.error ?? null;
    seedDrafts(snapshot);
}

export function clearAccInteract(): void {
    selectionRequestId += 1;
    accInteractStore.key = null;
    accInteractStore.snapshot = null;
    accInteractStore.loading = false;
    accInteractStore.error = null;
    accInteractStore.busyActionId = null;
    accInteractStore.drafts = {};
}

export async function loadAccInteract(handle: string | null | undefined, runtimeId: string | null | undefined, options?: { force?: boolean; }): Promise<void> {
    const key = selectionKey(handle, runtimeId);
    const requestId = ++selectionRequestId;

    if (!key || !handle || !runtimeId) {
        accInteractStore.key = null;
        accInteractStore.snapshot = null;
        accInteractStore.loading = false;
        accInteractStore.error = null;
        accInteractStore.drafts = {};
        return;
    }

    if (!options?.force && accInteractStore.key === key && accInteractStore.snapshot) {
        return;
    }

    if (accInteractStore.key !== key) {
        accInteractStore.drafts = {};
        accInteractStore.snapshot = null;
    }

    accInteractStore.key = key;
    accInteractStore.loading = true;
    accInteractStore.error = null;

    try {
        const json = await tmApi.getControlAccInteract(handle, runtimeId);
        if (requestId !== selectionRequestId) {
            return;
        }
        const snapshot = JSON.parse(json) as AccInteractSnapshot;
        applySnapshot(key, snapshot);
    } catch (e) {
        if (requestId !== selectionRequestId) {
            return;
        }
        accInteractStore.snapshot = {
            found: false,
            error: String(e),
            uia: emptyUiaSection(),
            msaa: emptyMsaaSection(),
        };
        accInteractStore.error = String(e);
    } finally {
        if (requestId === selectionRequestId) {
            accInteractStore.loading = false;
        }
    }
}

export async function executeAccAction(handle: string, runtimeId: string, kind: "uia" | "msaa", actionId: string, value = ""): Promise<boolean> {
    accInteractStore.busyActionId = `${kind}:${actionId}`;
    try {
        const json = await tmApi.executeAccAction(handle, runtimeId, kind, actionId, value);
        const result = JSON.parse(json) as AccActionResult;
        if (!result.ok) {
            accInteractStore.error = result.error ?? "Action failed";
            return false;
        }
        const key = selectionKey(handle, runtimeId);
        if (result.snapshot && key) {
            applySnapshot(key, result.snapshot);
        }
        accInteractStore.error = null;
        return true;
    } catch (e) {
        accInteractStore.error = String(e);
        return false;
    } finally {
        accInteractStore.busyActionId = null;
    }
}
