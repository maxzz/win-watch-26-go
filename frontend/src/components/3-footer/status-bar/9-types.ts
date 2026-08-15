export type StatusNoticeType = "error" | "warning" | "info" | "success";

export type StatusNotice = {
    id: number;
    type: StatusNoticeType;
    message: string;
};

export type StatusBarState = {
    current: StatusNotice | null;
};
