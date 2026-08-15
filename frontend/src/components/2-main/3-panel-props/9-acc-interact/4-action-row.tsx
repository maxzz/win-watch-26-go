import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { Button } from "@renderer/components/ui/shadcn/button";
import { Input } from "@renderer/components/ui/shadcn/input";
import { type AccActionDef, type AccApiKind } from "./state/9-types";
import { doExecuteAccActionAtom } from "./state/a-atoms-acc-interact";
import { accInteractStore, setDraft } from "./state/c-store-acc-interact";

export function AccActionRow({ kind, action }: { kind: AccApiKind; action: AccActionDef; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const { busyActionId } = useSnapshot(accInteractStore);
    const busy = busyActionId === `${kind}:${action.id}`;
    const disabled = !!busyActionId;

    if (action.kind === "command") {
        return (
            <Button
                type="button"
                size="xs"
                variant={action.destructive ? "destructive" : "outline"}
                disabled={disabled}
                title={action.hint || action.label}
                onClick={() => void execute({ kind, actionId: action.id })}
            >
                {busy ? "…" : action.label}
            </Button>
        );
    }

    return (
        <AccSetValueRow kind={kind} action={action} busy={busy} disabled={disabled} />
    );
}

function AccSetValueRow({ kind, action, busy, disabled }: { kind: AccApiKind; action: AccActionDef; busy: boolean; disabled: boolean; }) {
    const execute = useSetAtom(doExecuteAccActionAtom);
    const snap = useSnapshot(accInteractStore);
    const value = snap.drafts[`${kind}:${action.id}`] ?? action.currentValue ?? "";

    return (
        <div className="flex items-center gap-1 min-w-0">
            <span className="shrink-0 text-muted-foreground w-22 truncate" title={action.hint || action.label}>
                {action.label}
            </span>
            <Input
                className="h-6 px-1.5 text-[0.65rem]"
                type="text"
                inputMode={action.kind === "setNumber" ? "decimal" : undefined}
                placeholder={action.placeholder}
                title={action.hint || action.placeholder}
                value={value}
                disabled={disabled}
                onChange={(e) => setDraft(kind, action.id, e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        void execute({ kind, actionId: action.id, value });
                    }
                }}
            />
            <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={disabled}
                onClick={() => void execute({ kind, actionId: action.id, value })}
            >
                {busy ? "…" : "Set"}
            </Button>
        </div>
    );
}

export function AccCommandGroup({ kind, actions }: { kind: AccApiKind; actions: readonly AccActionDef[]; }) {
    const commands = actions.filter((a) => a.kind === "command");
    const setters = actions.filter((a) => a.kind !== "command");
    if (commands.length === 0 && setters.length === 0) {
        return null;
    }
    return (
        <div className="col-span-2 px-1.5 pl-2.5 py-0.5 space-y-0.5">
            {commands.length > 0
                ? (
                    <div className="flex flex-wrap gap-1">
                        {commands.map((action) => (
                            <AccActionRow key={action.id} kind={kind} action={action} />
                        ))}
                    </div>
                )
                : null}
            {setters.map((action) => (
                <AccActionRow key={action.id} kind={kind} action={action} />
            ))}
        </div>
    );
}
