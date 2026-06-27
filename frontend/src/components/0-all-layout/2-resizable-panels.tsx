import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings, setPanelLayoutAtom } from "@renderer/store/8-ui-settings";
import { WindowTreePanel } from "../2-main/1-window-tree";
import { ControlTreeLoader } from "../2-main/2-control-tree";
import { PropertiesPanel } from "../2-main/3-properties-panel";
import { FooterWindowInfo } from "../2-main/4-footer-window-info";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ui/shadcn/resizable";

export function MainContent({ className }: { className?: string; }) {
    const { ui_panels_Layout: panelLayout, ui_panels_PropPos: propertiesPanelPosition } = useSnapshot(appSettings);

    const mainPanelSize = panelLayout["left-panel"] ?? 25;
    const rightPanelSize = panelLayout["right-panel"] ?? 75;
    const controlPanelSize = panelLayout["controls-panel"] ?? 20;
    const controlPropsPanelSize = panelLayout["control-props-panel"] ?? 80;

    const setPanelLayout = useSetAtom(setPanelLayoutAtom);

    const isPropertiesOnRight = propertiesPanelPosition === 'right';

    return (
        <ResizablePanelGroup className={className} orientation="horizontal" onLayoutChanged={setPanelLayout}>
            {/* Left panel - Window Tree */}
            <ResizablePanel id="left-panel" minSize="15px" maxSize="75%" defaultSize={mainPanelSize}>
                <div className="flex flex-col h-full">
                    <WindowTreePanel />
                    <FooterWindowInfo />
                </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right panel - Window Info, Control Tree, Properties */}
            <ResizablePanel id="right-panel" defaultSize={rightPanelSize} minSize="50px">
                <div className="flex flex-col h-full">

                    <ResizablePanelGroup
                        className="flex-1"
                        orientation={isPropertiesOnRight ? "horizontal" : "vertical"}
                        onLayoutChanged={setPanelLayout}
                    >
                        {/* Control Tree */}
                        <ResizablePanel id="controls-panel" minSize="20px" defaultSize={controlPanelSize}>
                            <div className="h-full overflow-auto">
                                <ControlTreeLoader />
                            </div>
                        </ResizablePanel>

                        <ResizableHandle />

                        {/* Properties Panel */}
                        <ResizablePanel id="control-props-panel" minSize="15px" defaultSize={controlPropsPanelSize}>
                            <PropertiesPanel />
                        </ResizablePanel>
                    </ResizablePanelGroup>

                    {/* <FooterWindowInfo /> */} {/* show something related to control tree elements here (count, etc.) */}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
