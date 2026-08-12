/** Integrity level vocabulary shared with traytools / dpagent. */
export type IntegrityLevel = "na" | "undetected" | "high" | "medium" | "mediumplus" | "low";

export interface RectInfo {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export interface RelatedWindow {
    handle: string;
    className: string;
}

/** Detailed Win32 window info for General / Window Extra tabs. */
export interface WindowDetailInfo {
    valid: boolean;

    handle: string;
    caption: string;
    className: string;
    unicode: boolean;
    style: number;
    exStyle: number;
    visible: boolean;
    enabled: boolean;
    rect: RectInfo;
    clientRect: RectInfo;
    controlId: number;
    instance: string;
    userData: string;
    parent: RelatedWindow;
    owner: RelatedWindow;

    styleNames: string[];
    exStyleNames: string[];

    classAtom: string;
    classStyle: number;
    classExtraBytes: number;
    windowExtraBytes: number;

    processId: number;
    threadId: number;
    processName: string;
    processPath: string;
    bits: number;
    userName: string;
    integrity: IntegrityLevel;
}

export type PropsTab = "accessibility" | "general" | "windowExtra";
