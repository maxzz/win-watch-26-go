export type AccActionKind = "command" | "setString" | "setNumber" | "setPair";
export type AccApiKind = "uia" | "msaa";

export type NamedValue = {
    readonly name: string;
    readonly value: string;
};

export type AccActionDef = {
    readonly id: string;
    readonly label: string;
    readonly kind: AccActionKind;
    readonly currentValue?: string;
    readonly placeholder?: string;
    readonly hint?: string;
    readonly group?: string;
    readonly destructive?: boolean;
};

export type UiaPattern = {
    readonly id: number;
    readonly name: string;
    readonly properties: readonly NamedValue[];
    readonly actions: readonly AccActionDef[];
};

export type UiaSection = {
    readonly properties: readonly NamedValue[];
    readonly actions: readonly AccActionDef[];
    readonly patterns: readonly UiaPattern[];
};

export type MsaaSection = {
    readonly available: boolean;
    readonly error?: string;
    readonly properties: readonly NamedValue[];
    readonly stateValue: number;
    readonly stateFlags: readonly string[];
    readonly actions: readonly AccActionDef[];
};

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
            patterns: (uia?.patterns ?? []).map((pattern) => ({
                id: pattern.id,
                name: pattern.name,
                properties: pattern.properties ?? [],
                actions: pattern.actions ?? [],
            })),
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
