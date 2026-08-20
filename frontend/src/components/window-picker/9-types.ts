export type WindowPickerPoint = {
    x: number;
    y: number;
};

/** Payload streamed from Go during a finder drag, and once more on mouse-up. */
export type WindowPickerEvent = {
    released: boolean;
    processName: string;
    screen: WindowPickerPoint;
    client: WindowPickerPoint;
    handle?: string;
    rootHandle?: string;
    title?: string;
};

export type WindowPickerReleasedHandler = (result: WindowPickerEvent) => void;

export type WindowPickerState = {
    active: boolean;
    released: boolean;
    processName: string;
    screen: WindowPickerPoint;
    client: WindowPickerPoint;
    handle: string;
    rootHandle: string;
    title: string;
};

export const emptyWindowPickerState: WindowPickerState = {
    active: false,
    released: false,
    processName: "",
    screen: { x: 0, y: 0 },
    client: { x: 0, y: 0 },
    handle: "",
    rootHandle: "",
    title: "",
};
