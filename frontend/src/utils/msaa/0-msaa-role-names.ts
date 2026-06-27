/**
 * MSAA / IAccessible ROLE_SYSTEM_* IDs to names.
 * Based on Windows SDK `oleacc.h`.
 *
 * Used with IUIAutomationLegacyIAccessiblePattern::get_CurrentRole (DWORD).
 */
const MSAA_ROLE_SYSTEM_NAMES: Record<number, string> = {
    0x01: "ROLE_SYSTEM_TITLEBAR",
    0x02: "ROLE_SYSTEM_MENUBAR",
    0x03: "ROLE_SYSTEM_SCROLLBAR",
    0x04: "ROLE_SYSTEM_GRIP",
    0x05: "ROLE_SYSTEM_SOUND",
    0x06: "ROLE_SYSTEM_CURSOR",
    0x07: "ROLE_SYSTEM_CARET",
    0x08: "ROLE_SYSTEM_ALERT",
    0x09: "ROLE_SYSTEM_WINDOW",
    0x0A: "ROLE_SYSTEM_CLIENT",
    0x0B: "ROLE_SYSTEM_MENUPOPUP",
    0x0C: "ROLE_SYSTEM_MENUITEM",
    0x0D: "ROLE_SYSTEM_TOOLTIP",
    0x0E: "ROLE_SYSTEM_APPLICATION",
    0x0F: "ROLE_SYSTEM_DOCUMENT",
    0x10: "ROLE_SYSTEM_PANE",
    0x11: "ROLE_SYSTEM_CHART",
    0x12: "ROLE_SYSTEM_DIALOG",
    0x13: "ROLE_SYSTEM_BORDER",
    0x14: "ROLE_SYSTEM_GROUPING",
    0x15: "ROLE_SYSTEM_SEPARATOR",
    0x16: "ROLE_SYSTEM_TOOLBAR",
    0x17: "ROLE_SYSTEM_STATUSBAR",
    0x18: "ROLE_SYSTEM_TABLE",
    0x19: "ROLE_SYSTEM_COLUMNHEADER",
    0x1A: "ROLE_SYSTEM_ROWHEADER",
    0x1B: "ROLE_SYSTEM_COLUMN",
    0x1C: "ROLE_SYSTEM_ROW",
    0x1D: "ROLE_SYSTEM_CELL",
    0x1E: "ROLE_SYSTEM_LINK",
    0x1F: "ROLE_SYSTEM_HELPBALLOON",
    0x20: "ROLE_SYSTEM_CHARACTER",
    0x21: "ROLE_SYSTEM_LIST",
    0x22: "ROLE_SYSTEM_LISTITEM",
    0x23: "ROLE_SYSTEM_OUTLINE",
    0x24: "ROLE_SYSTEM_OUTLINEITEM",
    0x25: "ROLE_SYSTEM_PAGETAB",
    0x26: "ROLE_SYSTEM_PROPERTYPAGE",
    0x27: "ROLE_SYSTEM_INDICATOR",
    0x28: "ROLE_SYSTEM_GRAPHIC",
    0x29: "ROLE_SYSTEM_STATICTEXT",
    0x2A: "ROLE_SYSTEM_TEXT",
    0x2B: "ROLE_SYSTEM_PUSHBUTTON",
    0x2C: "ROLE_SYSTEM_CHECKBUTTON",
    0x2D: "ROLE_SYSTEM_RADIOBUTTON",
    0x2E: "ROLE_SYSTEM_COMBOBOX",
    0x2F: "ROLE_SYSTEM_DROPLIST",
    0x30: "ROLE_SYSTEM_PROGRESSBAR",
    0x31: "ROLE_SYSTEM_DIAL",
    0x32: "ROLE_SYSTEM_HOTKEYFIELD",
    0x33: "ROLE_SYSTEM_SLIDER",
    0x34: "ROLE_SYSTEM_SPINBUTTON",
    0x35: "ROLE_SYSTEM_DIAGRAM",
    0x36: "ROLE_SYSTEM_ANIMATION",
    0x37: "ROLE_SYSTEM_EQUATION",
    0x38: "ROLE_SYSTEM_BUTTONDROPDOWN",
    0x39: "ROLE_SYSTEM_BUTTONMENU",
    0x3A: "ROLE_SYSTEM_BUTTONDROPDOWNGRID",
    0x3B: "ROLE_SYSTEM_WHITESPACE",
    0x3C: "ROLE_SYSTEM_PAGETABLIST",
    0x3D: "ROLE_SYSTEM_CLOCK",
    0x3E: "ROLE_SYSTEM_SPLITBUTTON",
    0x3F: "ROLE_SYSTEM_IPADDRESS",
    0x40: "ROLE_SYSTEM_OUTLINEBUTTON",
};

export function formatHexU32(value: number): string {
    if (!Number.isFinite(value)) return "";
    return `0x${(value >>> 0).toString(16).toUpperCase()}`;
}

export function getMsaaRoleSystemName(role: number): string | undefined {
    return MSAA_ROLE_SYSTEM_NAMES[role];
}

/**
 * Formats an MSAA role value as `ROLE_SYSTEM_* (0xNN)`, or `UNKNOWN_ROLE (0xNN)`.
 */
export function formatMsaaRole(role: number): string {
    const hex = formatHexU32(role);
    const name = getMsaaRoleSystemName(role);
    return name ? `${name} (${hex})` : `UNKNOWN_ROLE (${hex || String(role)})`;
}

