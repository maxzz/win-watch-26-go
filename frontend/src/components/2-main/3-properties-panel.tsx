import { type ReactNode } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio/react";
import { asHex, classNames, hexAccRuntimeId, normalizeHwnd } from "@renderer/utils";
import { appSettings } from "@renderer/store/8-ui-settings";
import { formatHexU32, formatMsaaRole } from "@renderer/utils/msaa/0-msaa-role-names";
import { type ControlNode } from "@renderer/store/9-types-tmapi";
import { formatControlType } from "@renderer/utils/uia/0-uia-control-type-names";
import { selectedControlAtom } from "@renderer/store/2-2-1-atoms-controls-list";
import { PropertiesPanelHeader } from "./headers/7-properties-panel-header";

export function PropertiesPanel() {
    const control = useAtomValue(selectedControlAtom);

    const { ui_panels_PropPos: propertiesPanelPosition } = useSnapshot(appSettings);
    const isPropertiesOnRight = propertiesPanelPosition === 'right';

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

    const properties = getControlProperties(control);

    return (
        <div className={classNames("h-full bg-card flex flex-col", isPropertiesOnRight ? "" : "border-t")}>
            <PropertiesPanelHeader />

            <div className="flex-1 overflow-auto">
                <div className="text-xs grid grid-cols-[auto_1fr]">
                    {properties.map(
                        (prop, idx) => {
                            if (prop.label === "-") {
                                return <PropertiesSeparatorRow key={idx} />;
                            }
                            return (
                                <div className="contents" key={idx}>
                                    <div className="px-1.5 py-px border-r border-foreground/20 dark:border-foreground/20 cursor-default select-none" title={prop.label}>
                                        {prop.label}
                                    </div>
                                    <div className="px-1.5 py-px break-all truncate cursor-default" title={prop.title || strEmpty(prop.value)}>
                                        <PropertyValueContent label={prop.label} value={prop.value} />
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        </div>
    );
}

function getControlProperties(control: ControlNode): Array<{ label: string; value: ReactNode; title?: string; }> {
    const legacyItems = control.isLegacyAccAvailable
        ? [
            { label: "Legacy CurrentRole", value: <span className="text-[0.5rem]">{formatMsaaRole(control.currentRole)}</span>, title: `dec: 0x${formatHexU32(control.currentRole)}` },
            { label: "Legacy CurrentState", value: <span className="text-[0.5rem]">{formatHexU32(control.currentState)}</span>, title: `dec: 0x${formatHexU32(control.currentState)}` }
        ]
        : [];

    let controlTypeName: ReactNode | undefined = formatControlType(control.controlType);
    if (controlTypeName) {
        controlTypeName = <><span className="">{controlTypeName}</span> <span className="text-[0.5rem]">({control.controlType})</span></>;
    } else {
        controlTypeName = <span className="text-red-500">{control.controlType}</span>;
    }

    return [
        { label: "Process ID", value: asHex({ value: String(control.processId), prefix: true }), title: `dec: ${String(control.processId)}` },
        { label: "Framework ID", value: <span className="-ml-1 px-1 text-foreground bg-sky-100 dark:bg-sky-900 border border-sky-300 dark:border-sky-700 rounded">{control.frameworkId}</span> },
        { label: "Native Window Handle", value: normalizeHwnd(control.nativeWindowHandle) },
        { label: "Parent Window Handle", value: normalizeHwnd(control.parentWindowHandle) },
        { label: "-", value: null },
        { label: "Name", value: <span className="text-blue-800 font-semibold">{control.name}</span> },
        { label: "Classname", value: control.className },
        { label: "Control Type", value: controlTypeName, title: `dec: ${control.controlType}, hex: ${formatHexU32(Number(control.controlType))}` },
        { label: "Localized Control Type", value: control.localizedControlType },
        { label: "-", value: null },
        { label: "Automation ID", value: control.automationId },
        { label: "Runtime ID", value: getRuntimeIdValue(control.runtimeId), title: `dec: ${control.runtimeId}` },
        { label: "-", value: null },
        { label: "Legacy IAccessible Available", value: String(control.isLegacyAccAvailable) },
        ...legacyItems,
        { label: "Has HTML Access", value: control.hasHtmlAccess ? <span className="text-green-500">true</span> : "false" },
        { label: "-", value: null },
        { label: "Enabled", value: String(control.isEnabled) },
        { label: "Visible", value: String(control.isVisible) },
        { label: "Bounds", value: control.bounds ? `[${control.bounds.left}, ${control.bounds.top}, ${control.bounds.right}, ${control.bounds.bottom}]` : "N/A" },
        { label: "-", value: null },
    ];
}

// TODO: do something with bounds

function PropertyValueContent({ label, value }: { label: string; value: ReactNode; }) {
    const nameValue = label === "Bounds" ? boundsValue(strOnly(value)) : value;
    return nameValue || (
        <span className="text-muted-foreground italic">
            -
        </span>
    );
}

function getRuntimeIdValue(runtimeId: string): ReactNode {
    if (!runtimeId) {
        return <span className="text-red-500 font-semibold">emptys</span>;
    }
    return hexAccRuntimeId(runtimeId);
}

function boundsValue(boundsStr?: string): string {
    if (!boundsStr) {
        return '';
    }
    const bounds = boundsStr.slice(1, -1).split(",").map(Number); // remove [] and split into l, t, r, b
    const [left, top, right, bottom] = bounds;
    return `l:${left}, t:${top}, r:${right}, b:${bottom}`; // the same style as in the Microsoft Inspector
}

function strOnly(value: ReactNode): string {
    if (typeof value === 'string') {
        return value;
    }
    throw new Error(`Unsupported value type: ${typeof value}`);
}

function strEmpty(value: ReactNode): string {
    if (typeof value === 'string') {
        return value;
    }
    return "";
}

function PropertiesSeparatorRow() {
    return (
        <div className="contents">
            <div className="h-1.25 border-r border-foreground/20 dark:border-foreground/20 flex items-center">
                <div className="w-full border-b border-foreground/20 dark:border-foreground/20" />
            </div>
            <div className="h-1.25 flex items-center">
                <div className="w-full border-b border-foreground/20 dark:border-foreground/20" />
            </div>
        </div>
    );
}
