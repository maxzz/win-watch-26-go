export type WindowTooltipAnchor = {
    top: number;
    left: number;
    width: number;
    height: number;
};

export type WindowListTooltipState = {
    hwnd: string | null;
    visible: boolean;
    anchor: WindowTooltipAnchor;
};
