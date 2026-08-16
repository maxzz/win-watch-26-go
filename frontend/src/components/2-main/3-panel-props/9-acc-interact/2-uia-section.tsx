import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { motion } from "motion/react";
import { PropertyGrid } from "../8-shared-ui";
import { AccCollapsible } from "./8-shared-ui-collapsible";

import { AccCommandGroup } from "./4-action-row";
import { AccNamedValues, AccPatternHeader } from "./8-prop-rows";
import { doLoadAccInteractAtom } from "./state/a-atoms-acc-interact";
import { accInteractStore } from "./state/0-acc-interactions";
import { type UiaSection } from "./state/9-types";

export function UiaInteractSection({ section, loading }: { section: UiaSection; loading: boolean; }) {
    const snap = useSnapshot(accInteractStore);
    const reload = useSetAtom(doLoadAccInteractAtom);
    const patternCount = section.patterns?.length ?? 0;

    const subtitle = patternCount ? `${patternCount} pattern${patternCount === 1 ? "" : "s"}` : loading ? "reading patterns…" : "no patterns";

    return (
        <AccCollapsible
            open={snap.uiaOpen}
            onOpenChange={(open) => { accInteractStore.uiaOpen = open; }}
            title="UI Automation"
            subtitle={subtitle}
            onRefresh={() => void reload({ force: true })}
            refreshDisabled={loading}
            refreshTitle="Get current UIA state"
        >
            {loading && !section.patterns.length && !section.actions.length
                ? (
                    <ReadingPatternsMessage />
                )
                : (
                    <PropertyGrid>
                        <AccNamedValues values={section.properties} />
                        <AccCommandGroup kind="uia" actions={section.actions} />

                        {section.patterns.map(
                            (pattern) => (
                                <div key={pattern.id} className="contents">
                                    <AccPatternHeader name={pattern.name} />
                                    <AccNamedValues values={pattern.properties} />
                                    <AccCommandGroup kind="uia" actions={pattern.actions} />
                                </div>
                            )
                        )}

                        {patternCount === 0 && !loading && (
                            <div className="col-span-2 px-2.5 py-1 text-xs text-muted-foreground">
                                No interactive UIA patterns on this element.
                            </div>
                        )}
                    </PropertyGrid>
                )
            }
        </AccCollapsible>
    );
}

function ReadingPatternsMessage() {
    return (
        <motion.div
            className="px-2.5 py-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.3, ease: "easeOut" }}
        >
            Reading patterns…
        </motion.div>
    );
}
