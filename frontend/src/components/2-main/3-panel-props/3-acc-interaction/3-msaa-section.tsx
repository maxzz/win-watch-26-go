import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { PropertyGrid, PropertyRow, PropertySeparator } from "../8-shared-ui";
import { AccCollapsible } from "./8-shared-ui-collapsible";

import { AccCommandGroup } from "./4-action-row";
import { AccNamedValues } from "./8-prop-rows";
import { doLoadAccInteractAtom } from "./state/a-atoms-acc-interact";
import { interactStore } from "./state/0-acc-interactions";
import { type MsaaSection } from "./state/9-types";

export function MsaaInteractSection({ section, loading }: { section: MsaaSection; loading: boolean; }) {
    const snap = useSnapshot(interactStore);
    const reload = useSetAtom(doLoadAccInteractAtom);

    return (
        <AccCollapsible
            open={snap.msaaOpen}
            onOpenChange={(open) => { interactStore.msaaOpen = open; }}
            title="MSAA"
            titleHint="Microsoft Active Accessibility (MSAA). IAccessible is the legacy API for accessibility."
            subtitle={section.available ? undefined : "unavailable"}
            loading={loading}
            loadingKey={snap.key}
            onRefresh={() => void reload({ force: true })}
            refreshDisabled={loading}
            refreshTitle="Get current MSAA state"
        >
            {!section.available
                ? (
                    <div className="px-2.5 py-1 text-xs text-muted-foreground">
                        {section.error || "Raw IAccessible is not available for this element."}
                    </div>
                )
                : (
                    <PropertyGrid>
                        <AccNamedValues values={section.properties} />
                        <PropertySeparator />

                        <PropertyRow label="State flags" title={section.stateFlags.join(" | ") || undefined}>
                            {section.stateFlags.length
                                ? <span className="text-[0.65rem]">{section.stateFlags.join(" · ")}</span>
                                : <span className="text-muted-foreground italic">none</span>}
                        </PropertyRow>

                        <AccCommandGroup kind="msaa" actions={section.actions} />
                    </PropertyGrid>
                )
            }
        </AccCollapsible>
    );
}
