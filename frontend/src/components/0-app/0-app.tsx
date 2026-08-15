import { useActiveWindow, useAppStartInitialize, useMonitorActiveWindow } from "@renderer/store/hooks/useActiveWindow";
import { Toaster } from "sonner";
import { UISymbolDefs } from "../ui/icons/symbols";
import { AppHeader } from "../1-header/1-app-header";
import { MainContent } from "./1-resizable-panels";
import { AppGlobals } from "../4-dialogs/0-app-globals";
import { AppStatusBar } from "../3-footer/status-bar";
import { ReportPanelDock } from "../3-footer/report-panel";
//import { SpyAllIcons } from "@renderer/utils/util-hooks/spy-icons";

export function App() {
    return (<>
        <UISymbolDefs />
        <Toaster />
        <AppGlobals />

        <AppContents />
    </>);
}

function AppContents() {
    useActiveWindow();
    useAppStartInitialize();
    useMonitorActiveWindow();

    return (
        <div className="h-screen text-foreground bg-background flex flex-col overflow-hidden">
            <AppHeader />
            {/* <SpyAllIcons includeSvgSymbols /> */}
            <MainContent className="flex-1 min-h-0" />
            <ReportPanelDock />
            <AppStatusBar />
        </div>
    );
}
