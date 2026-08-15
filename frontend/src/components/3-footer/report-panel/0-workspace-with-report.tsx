import { type ReactNode } from "react";
import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { appSettings, setPanelLayoutAtom } from "@renderer/store/1-0-ui-settings";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@renderer/components/ui/shadcn/resizable";
import { AppReportPanel } from "./0-all-report-panel";

export function WorkspaceWithReport({ children }: { children: ReactNode; }) {
    const { ui_showReportPanel, ui_panels_Layout: panelLayout } = useSnapshot(appSettings);
    const setPanelLayout = useSetAtom(setPanelLayoutAtom);

    const reportSize = panelLayout["report-panel"] ?? 22;
    const workspaceSize = panelLayout["workspace-panel"] ?? (100 - reportSize);

    if (!ui_showReportPanel) {
        return (
            <div className="flex-1 min-h-0">
                {children}
            </div>
        );
    }

    return (
        <ResizablePanelGroup className="flex-1 min-h-0" orientation="vertical" onLayoutChanged={setPanelLayout}>
            <ResizablePanel id="workspace-panel" minSize="20%" defaultSize={workspaceSize}>
                <div className="size-full min-h-0">
                    {children}
                </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel id="report-panel" minSize="12%" defaultSize={reportSize}>
                <AppReportPanel />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
