import { proxy } from "valtio";
import { type AccActionDef, type AccActionResult, type AccInteractSnapshot, emptyMsaaSection, emptyUiaSection, normalizeSnapshot } from "./9-types";

type InteractStore = {
    key: string | null;
    snapshot: AccInteractSnapshot | null;
    loading: boolean;
    error: string | null;
    busyActionId: string | null;
    drafts: Record<string, string>; // Drafts are used to store the current value of an action for a given API and action ID.
    uiaOpen: boolean;
    msaaOpen: boolean;
};

export const interactStore = proxy<InteractStore>({
    key: null,
    snapshot: null,
    loading: false,
    error: null,
    busyActionId: null,
    drafts: {},
    uiaOpen: true,
    msaaOpen: true,
});

// Selection

let selectionRequestId = 0;

export function clearAccInteract(): void {
    selectionRequestId += 1;
    interactStore.key = null;
    interactStore.snapshot = null;
    interactStore.loading = false;
    interactStore.error = null;
    interactStore.busyActionId = null;
    interactStore.drafts = {};
}

export async function loadAccInteract(handle: string | null | undefined, runtimeId: string | null | undefined, options?: { force?: boolean; }): Promise<void> {
    const key = selectionKey(handle, runtimeId);
    const requestId = ++selectionRequestId;

    if (!key || !handle || !runtimeId) {
        interactStore.key = null;
        interactStore.snapshot = null;
        interactStore.loading = false;
        interactStore.error = null;
        interactStore.drafts = {};
        return;
    }

    if (!options?.force && interactStore.key === key && interactStore.snapshot) {
        return;
    }

    if (interactStore.key !== key) {
        interactStore.drafts = {};
    }

    interactStore.key = key;
    interactStore.loading = true;
    interactStore.error = null;

    try {
        const json = await tmApi.getControlAccInteract(handle, runtimeId);

        if (requestId !== selectionRequestId) { // Aborted by another request
            return;
        }

        const snapshot = normalizeSnapshot(JSON.parse(json) as AccInteractSnapshot);
        applySnapshot(key, snapshot);
    } catch (e) {
        if (requestId !== selectionRequestId) { // Aborted by another request
            return;
        }

        interactStore.snapshot = {
            found: false,
            error: String(e),
            uia: emptyUiaSection(),
            msaa: emptyMsaaSection(),
        };
        interactStore.error = String(e);
    } finally {
        if (requestId === selectionRequestId) { // Completed successfully
            interactStore.loading = false;
        }
    }
}

export async function executeAccAction(handle: string, runtimeId: string, kind: "uia" | "msaa", actionId: string, value = ""): Promise<boolean> {
    interactStore.busyActionId = `${kind}:${actionId}`;
    try {
        const json = await tmApi.executeAccAction(handle, runtimeId, kind, actionId, value);

        const result = JSON.parse(json) as AccActionResult;
        if (!result.ok) { // Action failed
            interactStore.error = result.error ?? "Action failed";
            return false;
        }

        const key = selectionKey(handle, runtimeId);
        if (result.snapshot && key) { // Snapshot is available
            const snapshot = normalizeSnapshot(result.snapshot);
            if (snapshot.found) {
                applySnapshot(key, snapshot);
            }
        }
        
        interactStore.error = null;
        return true;
    } catch (e) {
        interactStore.error = String(e);
        return false;
    } finally {
        interactStore.busyActionId = null;
    }
}

function selectionKey(handle: string | null | undefined, runtimeId: string | null | undefined): string | null {
    if (!handle || !runtimeId) {
        return null;
    }
    return `${handle}\0${runtimeId}`;
}

function applySnapshot(key: string, snapshot: AccInteractSnapshot): void {
    interactStore.key = key;
    interactStore.snapshot = snapshot;
    interactStore.error = snapshot.error ?? null;
    seedDrafts(snapshot);
}

// Drafts

export function getDraft(kind: string, actionId: string, defaultValue = ""): string {
    return interactStore.drafts[draftKey(kind, actionId)] ?? defaultValue;
}

export function setDraft(kind: string, actionId: string, value: string): void {
    interactStore.drafts[draftKey(kind, actionId)] = value;
}

function seedDrafts(snapshot: AccInteractSnapshot): void {

    function seed(kind: string, actions: readonly AccActionDef[]) {
        for (const action of actions) {
            if (action.kind === "command") {
                continue;
            }
            interactStore.drafts[draftKey(kind, action.id)] = action.currentValue ?? "";
        }
    }

    seed("uia", snapshot.uia?.actions ?? []);

    for (const pattern of snapshot.uia?.patterns ?? []) {
        seed("uia", pattern.actions ?? []);
    }

    seed("msaa", snapshot.msaa?.actions ?? []);
}

function draftKey(kind: string, actionId: string): string {
    return `${kind}:${actionId}`;
}
