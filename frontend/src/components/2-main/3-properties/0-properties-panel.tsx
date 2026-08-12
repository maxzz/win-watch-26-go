import { useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useSnapshot } from "valtio/react";
import { classNames, hasNativeWindowHandle } from "@renderer/utils";
import { appSettings } from "@renderer/store/8-ui-settings";
import { selectedControlAtom } from "@renderer/store/2-2-1-atoms-controls-list";
import {
    loadWindowDetailInfo,
    propsTabAtom,
    windowDetailStore,
    type PropsTab,
    type WindowDetailInfo,
} from "@renderer/store/3-window-detail";
import { ScrollArea } from "@renderer/components/ui/shadcn/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/shadcn/tabs";
import { PropertiesPanelHeader } from "../headers/7-properties-panel-header";
import { TabAccessibility } from "./tab-accessibility";
import { TabGeneral } from "./tab-general";
import { TabWindowExtra } from "./tab-window-extra";

export function PropertiesPanel() {
    const control = useAtomValue(selectedControlAtom);
    const [tab, setTab] = useAtom(propsTabAtom);
    const detailSnap = useSnapshot(windowDetailStore);
    const { ui_panels_PropPos: propertiesPanelPosition } = useSnapshot(appSettings);
    const isPropertiesOnRight = propertiesPanelPosition === "right";

    const hwnd = control?.nativeWindowHandle;
    const showWindowTabs = hasNativeWindowHandle(hwnd);

    useEffect(() => {
        if (showWindowTabs && hwnd) {
            void loadWindowDetailInfo(hwnd);
            return;
        }
        void loadWindowDetailInfo(null);
    }, [hwnd, showWindowTabs]);

    useEffect(() => {
        if (!showWindowTabs && (tab === "general" || tab === "windowExtra")) {
            setTab("accessibility");
        }
    }, [showWindowTabs, tab, setTab]);

    const activeTab: PropsTab =
        tab === "windowExtra" || tab === "general" || tab === "accessibility"
            ? tab
            : "accessibility";

    if (!control) {
        return (
            <div className="h-full text-xs text-muted-foreground bg-muted/10">
                <div className="flex flex-col">
                    <PropertiesPanelHeader />
                    <div className="px-2 flex-1 text-muted-foreground">
                        Select a control to view properties
                    </div>
                </div>
            </div>
        );
    }

    const info = detailSnap.info as WindowDetailInfo | null;

    return (
        <div className={classNames("h-full bg-card flex flex-col min-h-0", isPropertiesOnRight ? "" : "border-t")}>
            <PropertiesPanelHeader />

            {showWindowTabs
                ? (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setTab(v as PropsTab)}
                        className="flex-1 min-h-0 flex flex-col gap-1 p-1"
                    >
                        <TabsList className="h-7">
                            <TabsTrigger value="accessibility" className="text-xs px-2">Accessibility</TabsTrigger>
                            <TabsTrigger value="general" className="text-xs px-2">General</TabsTrigger>
                            <TabsTrigger value="windowExtra" className="text-xs px-2">Window Extra</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 min-h-0" fullHeight fixedWidth>
                            <TabsContent value="accessibility" className="mt-0">
                                <TabAccessibility control={control} />
                            </TabsContent>
                            <TabsContent value="general" className="mt-0">
                                <WindowDetailBody
                                    loading={detailSnap.loading}
                                    error={detailSnap.error}
                                    info={info}
                                    tab="general"
                                />
                            </TabsContent>
                            <TabsContent value="windowExtra" className="mt-0">
                                <WindowDetailBody
                                    loading={detailSnap.loading}
                                    error={detailSnap.error}
                                    info={info}
                                    tab="windowExtra"
                                />
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                )
                : (
                    <div className="flex-1 overflow-auto">
                        <TabAccessibility control={control} />
                    </div>
                )}
        </div>
    );
}

function WindowDetailBody({
    loading,
    error,
    info,
    tab,
}: {
    loading: boolean;
    error: string | null;
    info: WindowDetailInfo | null;
    tab: "general" | "windowExtra";
}) {
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
