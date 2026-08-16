export type AccApiKind = "uia" | "msaa";
export type AccActionKind = "command" | "setString" | "setNumber" | "setPair";

export type NamedValue = {
    readonly name: string;
    readonly value: string;
};

export type AccAction = {           // Action definition
    readonly id: string;            // Unique identifier for the action
    readonly label: string;         // Human-readable label for the action
    readonly kind: AccActionKind;   // Kind of action
    readonly currentValue?: string; // Current value of the action
    readonly placeholder?: string;  // Placeholder for the action (e.g. "Enter text", "Enter number", "Enter pair", "Enter focus")
    readonly hint?: string;         // Hint for the action (e.g. "Click the button", "Set the text", "Set the number", "Set the pair", "Set the focus")
    readonly group?: string;        // Group for the action (e.g. "titlebar", "content")
    readonly destructive?: boolean; // Whether the action is destructive
};

// UIA section

export type UiaPattern = {
    readonly id: number;
    readonly name: string;
    readonly properties: readonly NamedValue[];
    readonly actions: readonly AccAction[];
};

export type UiaSection = {
    readonly properties: readonly NamedValue[];
    readonly actions: readonly AccAction[];
    readonly patterns: readonly UiaPattern[];
};

// MSAA section

export type MsaaSection = {
    readonly available: boolean;
    readonly error?: string;
    readonly properties: readonly NamedValue[];
    readonly stateValue: number;
    readonly stateFlags: readonly string[];
    readonly actions: readonly AccAction[];
};

// Snapshot

export type AccInteractSnapshot = {
    readonly found: boolean;
    readonly error?: string;
    readonly uia: UiaSection;
    readonly msaa: MsaaSection;
};

export type AccActionResult = {
    ok: boolean;
    error?: string;
    snapshot?: AccInteractSnapshot;
};

export function emptyUiaSection(): UiaSection {
    return { properties: [], actions: [], patterns: [] };
}

export function emptyMsaaSection(): MsaaSection {
    return { available: false, properties: [], stateValue: 0, stateFlags: [], actions: [] };
}

export function normalizeSnapshot(raw: Partial<AccInteractSnapshot> | null | undefined): AccInteractSnapshot {
    const uia = raw?.uia;
    const msaa = raw?.msaa;
    return {
        found: !!raw?.found,
        error: raw?.error,
        uia: {
            properties: uia?.properties ?? [],
            actions: uia?.actions ?? [],
            patterns: (uia?.patterns ?? []).map(
                (pattern) => ({
                    id: pattern.id,
                    name: pattern.name,
                    properties: pattern.properties ?? [],
                    actions: pattern.actions ?? [],
                })
            ),
        },
        msaa: {
            available: !!msaa?.available,
            error: msaa?.error,
            properties: msaa?.properties ?? [],
            stateValue: msaa?.stateValue ?? 0,
            stateFlags: msaa?.stateFlags ?? [],
            actions: msaa?.actions ?? [],
        },
    };
}
