import { useEffect, useState } from "react";
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
    const showReadingMessage = useDelayedTrue(loading, 2000, snap.key);
    const patternCount = section.patterns?.length ?? 0;

    const subtitle = showReadingMessage
        ? "reading patterns…"
        : patternCount
            ? `${patternCount} pattern${patternCount === 1 ? "" : "s"}`
            : loading
                ? undefined
                : "no patterns";

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
            {showReadingMessage
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

function useDelayedTrue(active: boolean, delayMs: number, resetKey?: string | null): boolean {
    const [ready, setReady] = useState(false);
    useEffect(
        () => {
            if (!active) {
                setReady(false);
                return;
            }
            setReady(false);
            const id = window.setTimeout(() => setReady(true), delayMs);
            return () => window.clearTimeout(id);
        },
        [active, delayMs, resetKey]);
    return ready && active;
}

function ReadingPatternsMessage() {
    return (
        <motion.div
            className="px-2.5 py-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            Reading patterns…
        </motion.div>
    );
}
