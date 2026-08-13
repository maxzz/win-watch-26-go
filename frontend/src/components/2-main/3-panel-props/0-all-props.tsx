import { useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio/react";
import { classNames, hasNativeWindowHandle } from "@renderer/utils";
import { appSettings } from "@renderer/store/1-ui-settings";
import { selectedControlAtom } from "@renderer/components/2-main/2-panel-controls/state-atoms/2-2-1-atoms-controls-list";
import { propsTabAtom } from "./3-window-detail/a-atoms-win-info";
import { loadWindowDetailInfo, windowDetailStore } from "./3-window-detail/c-store-win-info";
import { type PropsTab, type WindowDetailInfo } from "./3-window-detail/9-types-window-info";
import { ScrollArea } from "@renderer/components/ui/shadcn/scroll-area";
import { Tabs, TabsContent } from "@renderer/components/ui/shadcn/tabs";
import { AnimatedTabsList, AnimatedTabsTrigger } from "@renderer/components/ui/local-ui";
import { PropertiesPanelHeader } from "./1-properties-panel-header";
import { TabAccessibility } from "./2-1-tab-accessibility";
import { TabGeneral } from "./2-2-tab-general";
import { TabWindowExtra } from "./2-3-tab-window-extra";

export function PropertiesPanel() {
    const control = useAtomValue(selectedControlAtom);
    const [tab, setTab] = useAtom(propsTabAtom);
    const detailSnap = useSnapshot(windowDetailStore);
    const { ui_panels_PropPos: propertiesPanelPosition } = useSnapshot(appSettings);
    const isPropertiesOnRight = propertiesPanelPosition === "right";

    const hwnd = control?.nativeWindowHandle;
    const hasWindowHandle = hasNativeWindowHandle(hwnd);

    useEffect(
        () => {
            if (hasWindowHandle && hwnd) {
                void loadWindowDetailInfo(hwnd);
                return;
            }
            void loadWindowDetailInfo(null);
        },
        [hwnd, hasWindowHandle]);

    const activeTab: PropsTab =
        tab === "windowExtra" || tab === "general" || tab === "accessibility"
            ? tab
            : "accessibility";

    const info = detailSnap.info as WindowDetailInfo | null;

    return (
        <div className={classNames("h-full bg-card flex flex-col min-h-0", isPropertiesOnRight ? "" : "border-t")}>
            <PropertiesPanelHeader />

            <Tabs className="flex-1 min-h-0 flex flex-col gap-1 pt-1" value={activeTab} onValueChange={(v) => setTab(v as PropsTab)}>
                <AnimatedTabsList layoutId="control-props-tabs" className="mx-1 h-7">
                    <AnimatedTabsTrigger valueAtom={propsTabAtom} value="accessibility" className="text-xs px-2">Accessibility</AnimatedTabsTrigger>
                    <AnimatedTabsTrigger valueAtom={propsTabAtom} value="general" className="text-xs px-2">General</AnimatedTabsTrigger>
                    <AnimatedTabsTrigger valueAtom={propsTabAtom} value="windowExtra" className="text-xs px-2">Window Extra</AnimatedTabsTrigger>
                </AnimatedTabsList>

                <ScrollArea className="flex-1 min-h-0" fixedWidth parentContentWidth>
                    <TabsContent value="accessibility" className="mt-0">
                        {control
                            ? <TabAccessibility control={control} />
                            : <EmptyHint />}
                    </TabsContent>
                    <TabsContent value="general" className="mt-0">
                        <WindowDetailBody
                            hasSelection={!!control}
                            hasWindowHandle={hasWindowHandle}
                            loading={detailSnap.loading}
                            error={detailSnap.error}
                            info={info}
                            tab="general"
                        />
                    </TabsContent>
                    <TabsContent value="windowExtra" className="mt-0">
                        <WindowDetailBody
                            hasSelection={!!control}
                            hasWindowHandle={hasWindowHandle}
                            loading={detailSnap.loading}
                            error={detailSnap.error}
                            info={info}
                            tab="windowExtra"
                        />
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
}

function EmptyHint() {
    return (
        <div className="px-2 py-1 text-xs text-muted-foreground">
            Select a control to view properties
        </div>
    );
}

function WindowDetailBody({ hasSelection, hasWindowHandle, loading, error, info, tab }: { hasSelection: boolean; hasWindowHandle: boolean; loading: boolean; error: string | null; info: WindowDetailInfo | null; tab: "general" | "windowExtra"; }) {
    if (!hasSelection) {
        return <EmptyHint />;
    }

    if (!hasWindowHandle) {
        return (
            <div className="p-3 text-xs text-muted-foreground">
                The selected element has no native window handle, so there are no window properties to display.
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-3 text-xs text-destructive">
                Failed to load window info: {error}
            </div>
        );
    }

    if (!info || !info.valid) {
        return (
            <div className="p-3 text-xs text-muted-foreground">
                {loading ? "Loading..." : "Window properties are unavailable for this handle."}
            </div>
        );
    }

    return tab === "general" ? <TabGeneral info={info} /> : <TabWindowExtra info={info} />;
}
