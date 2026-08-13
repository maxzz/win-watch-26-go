import { type ReactNode } from "react";
import { asHex, hexAccRuntimeId, normalizeHwnd } from "@renderer/utils";
import { formatHexU32, formatMsaaRole } from "@renderer/utils/msaa/0-msaa-role-names";
import { type ControlNode } from "@renderer/store/9-types-tmapi";
import { formatControlType } from "@renderer/utils/uia/0-uia-control-type-names";
import { PROP_SEP, PropertyGrid, PropertyHeader, PropertyRow, PropertySeparator, type PropertyEntry } from "./8-shared-ui";

export function TabAccessibility({ control }: { control: ControlNode; }) {
    const properties = getControlProperties(control);

    return (
        <PropertyGrid>
            <PropertyHeader>UI Accessibility</PropertyHeader>
            {properties.map((prop, idx) => {
                if (prop.label === PROP_SEP) {
                    return <PropertySeparator key={idx} />;
                }
                return (
                    <PropertyRow key={idx} label={prop.label} title={prop.title || strEmpty(prop.value)}>
                        <PropertyValueContent label={prop.label} value={prop.value} />
                    </PropertyRow>
                );
            })}
        </PropertyGrid>
    );
}

function getControlProperties(control: ControlNode): PropertyEntry[] {
    const legacyItems: PropertyEntry[] = control.isLegacyAccAvailable
        ? [
            { label: "Legacy CurrentRole", value: <span className="text-[0.5rem]">{formatMsaaRole(control.currentRole)}</span>, title: `dec: 0x${formatHexU32(control.currentRole)}` },
            { label: "Legacy CurrentState", value: <span className="text-[0.5rem]">{formatHexU32(control.currentState)}</span>, title: `dec: 0x${formatHexU32(control.currentState)}` },
        ]
        : [];

    let controlTypeName: ReactNode | undefined = formatControlType(control.controlType);
    if (controlTypeName) {
        controlTypeName = <><span className="">{controlTypeName}</span> <span className="text-[0.5rem]">({control.controlType})</span></>;
    } else {
        controlTypeName = <span className="text-red-500">{control.controlType}</span>;
    }

    return [
        { label: PROP_SEP, value: null },
        { label: "Process ID", value: asHex({ value: String(control.processId), prefix: true }), title: `dec: ${String(control.processId)}` },
        { label: "Framework ID", value: <span className="-ml-1 px-1 text-foreground bg-sky-100 dark:bg-sky-900 border border-sky-300 dark:border-sky-700 rounded">{control.frameworkId}</span> },
        { label: "Native Window Handle", value: normalizeHwnd(control.nativeWindowHandle) },
        { label: "Parent Window Handle", value: normalizeHwnd(control.parentWindowHandle) },
        { label: PROP_SEP, value: null },
        { label: "Name", value: <span className="text-blue-800 font-semibold">{control.name}</span> },
        { label: "Classname", value: control.className },
        { label: "Control Type", value: controlTypeName, title: `dec: ${control.controlType}, hex: ${formatHexU32(Number(control.controlType))}` },
        { label: "Localized Control Type", value: control.localizedControlType },
        { label: PROP_SEP, value: null },
        { label: "Automation ID", value: control.automationId },
        { label: "Runtime ID", value: getRuntimeIdValue(control.runtimeId), title: `dec: ${control.runtimeId}` },
        { label: PROP_SEP, value: null },
        { label: "Legacy IAccessible Available", value: String(control.isLegacyAccAvailable) },
        ...legacyItems,
        { label: "Has HTML Access", value: control.hasHtmlAccess ? <span className="text-green-500">true</span> : "false" },
        { label: PROP_SEP, value: null },
        { label: "Enabled", value: String(control.isEnabled) },
        { label: "Visible", value: String(control.isVisible) },
        { label: "Bounds", value: control.bounds ? `[${control.bounds.left}, ${control.bounds.top}, ${control.bounds.right}, ${control.bounds.bottom}]` : "N/A" },
        { label: PROP_SEP, value: null },
    ];
}

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
    const bounds = boundsStr.slice(1, -1).split(",").map(Number);
    const [left, top, right, bottom] = bounds;
    return `l:${left}, t:${top}, r:${right}, b:${bottom}`;
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
