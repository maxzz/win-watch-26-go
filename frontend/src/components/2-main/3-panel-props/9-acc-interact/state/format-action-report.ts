import { type AccActionDef, type AccApiKind, type AccInteractSnapshot } from "./9-types";

export function findAccAction(snapshot: AccInteractSnapshot | null | undefined, kind: AccApiKind, actionId: string): AccActionDef | undefined {
    if (!snapshot) {
        return undefined;
    }
    if (kind === "msaa") {
        return snapshot.msaa.actions.find((action) => action.id === actionId);
    }
    const fromRoot = snapshot.uia.actions.find((action) => action.id === actionId);
    if (fromRoot) {
        return fromRoot;
    }
    for (const pattern of snapshot.uia.patterns) {
        const found = pattern.actions.find((action) => action.id === actionId);
        if (found) {
            return found;
        }
    }
    return undefined;
}

export function describeAccAction(input: {
    kind: AccApiKind;
    actionId: string;
    value?: string;
    action?: AccActionDef;
    controlName?: string;
}): { title: string; failedTitle: string; fields: Record<string, string>; } {
    const label = input.action?.label || humanizeActionId(input.actionId);
    const value = input.value?.trim() ?? "";
    const name = input.controlName?.trim() ?? "";
    const title = successTitle(input.actionId, label, value, name);
    const failedTitle = failedMessage(input.actionId, label, value, name);

    const fields: Record<string, string> = {
        API: input.kind === "msaa" ? "MSAA" : "UI Automation",
        Action: label,
    };
    if (name) {
        fields.Control = name;
    }
    if (value) {
        fields.Value = value;
    }
    return { title, failedTitle, fields };
}

function successTitle(actionId: string, label: string, value: string, name: string): string {
    switch (actionId) {
        case "element.setFocus":
        case "msaa.select.takeFocus":
            return name ? `Set focus on "${name}"` : "Set focus";
        case "window.setMinimized":
            return "Minimized window";
        case "window.setMaximized":
            return "Maximized window";
        case "window.setNormal":
            return "Restored window";
        case "window.close":
            return "Closed window";
        case "transform.move":
            return value ? `Moved window to ${value}` : "Moved window";
        case "transform.resize":
            return value ? `Resized window to ${value}` : "Resized window";
        case "transform.rotate":
            return value ? `Rotated window by ${value}°` : "Rotated window";
        case "invoke.invoke":
            return name ? `Invoked "${name}"` : "Invoked control";
        case "toggle.toggle":
            return name ? `Toggled "${name}"` : "Toggled";
        case "value.setValue":
        case "rangeValue.setValue":
        case "msaa.setValue":
            return value ? `Set value to "${value}"` : "Set value";
        case "msaa.setName":
            return value ? `Set name to "${value}"` : "Set name";
        case "scroll.setPercent":
            return value ? `Set scroll to ${value}` : "Set scroll";
        default:
            if (value) {
                return `${label}: ${value}`;
            }
            if (name) {
                return `${label} on "${name}"`;
            }
            return label;
    }
}

function failedMessage(actionId: string, label: string, value: string, name: string): string {
    switch (actionId) {
        case "element.setFocus":
        case "msaa.select.takeFocus":
            return name ? `Failed to set focus on "${name}"` : "Failed to set focus";
        case "window.setMinimized":
            return "Failed to minimize window";
        case "window.setMaximized":
            return "Failed to maximize window";
        case "window.setNormal":
            return "Failed to restore window";
        case "window.close":
            return "Failed to close window";
        case "transform.move":
            return value ? `Failed to move window to ${value}` : "Failed to move window";
        case "transform.resize":
            return value ? `Failed to resize window to ${value}` : "Failed to resize window";
        default:
            return value ? `Failed to ${label.toLowerCase()}: ${value}` : `Failed to ${label.toLowerCase()}`;
    }
}

function humanizeActionId(actionId: string): string {
    const last = actionId.split(".").pop() ?? actionId;
    const spaced = last.replace(/([a-z])([A-Z])/g, "$1 $2");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
