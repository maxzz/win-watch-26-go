import { proxy } from "valtio";

type ReportTooltipState = {
    entryId: number | null;
    visible: boolean;
    top: number;
    left: number;
    width: number;
    height: number;
};

export const reportTooltipStore = proxy<ReportTooltipState>({
    entryId: null,
    visible: false,
    top: 0,
    left: 0,
    width: 0,
    height: 0,
});

let showTimer: ReturnType<typeof setTimeout> | null = null;

export function hoverReportInfoIcon(entryId: number, rect: DOMRect): void {
    reportTooltipStore.entryId = entryId;
    reportTooltipStore.top = rect.top;
    reportTooltipStore.left = rect.left;
    reportTooltipStore.width = rect.width;
    reportTooltipStore.height = rect.height;
    if (reportTooltipStore.visible || showTimer) {
        return;
    }
    showTimer = setTimeout(
        () => {
            showTimer = null;
            if (reportTooltipStore.entryId != null) {
                reportTooltipStore.visible = true;
            }
        },
        250
    );
}

export function leaveReportInfoIcon(): void {
    if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
    }
    reportTooltipStore.visible = false;
    reportTooltipStore.entryId = null;
}
