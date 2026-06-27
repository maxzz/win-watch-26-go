/**
 * Windows UI Automation Control Type IDs to human-readable names.
 * Based on UIAutomationClient.h UIA_ControlTypeIds
 * https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controltype-ids
 */

export enum ControlId {
    Button      /**/ = "50000",
    Calendar    /**/ = "50001",
    CheckBox    /**/ = "50002",
    ComboBox    /**/ = "50003",
    Edit        /**/ = "50004",
    Hyperlink   /**/ = "50005",
    Image       /**/ = "50006",
    ListItem    /**/ = "50007",
    List        /**/ = "50008",
    Menu        /**/ = "50009",
    MenuBar     /**/ = "50010",
    MenuItem    /**/ = "50011",
    ProgressBar /**/ = "50012",
    RadioButton /**/ = "50013",
    ScrollBar   /**/ = "50014",
    Slider      /**/ = "50015",
    Spinner     /**/ = "50016",
    StatusBar   /**/ = "50017",
    Tab         /**/ = "50018",
    TabItem     /**/ = "50019",
    Text        /**/ = "50020",
    ToolBar     /**/ = "50021", //Symbol_uia_Toolbar
    ToolTip     /**/ = "50022", //Symbol_uia_Tooltip
    Tree        /**/ = "50023",
    TreeItem    /**/ = "50024",
    Custom      /**/ = "50025",
    Group       /**/ = "50026",
    Thumb       /**/ = "50027",
    DataGrid    /**/ = "50028",
    DataItem    /**/ = "50029",
    Document    /**/ = "50030",
    SplitButton /**/ = "50031",
    Window      /**/ = "50032",
    Pane        /**/ = "50033",
    Header      /**/ = "50034",
    HeaderItem  /**/ = "50035",
    Table       /**/ = "50036",
    TitleBar    /**/ = "50037",
    Separator   /**/ = "50038",
    SemanticZoom/**/ = "50039",
    AppBar      /**/ = "50040",
}

const UIA_CONTROL_TYPE_NAMES: Record<string, string> = Object.fromEntries(
    Object.entries(ControlId).map(([name, id]) => [id, name])
);

/**
 * Get human-readable control type name from numeric ID
 * @param controlTypeId - The numeric control type ID as string (e.g., "50000")
 * @returns Human-readable name (e.g., "Button") or the original ID if unknown
 */
export function getControlTypeName(controlTypeId: string): string {
    return UIA_CONTROL_TYPE_NAMES[controlTypeId] ?? controlTypeId;
}

/**
 * Get formatted control type display string
 * @param controlTypeId - The numeric control type ID as string
 * @returns Formatted string like "Button" or undefined if unknown.
 */
export function formatControlType(controlTypeId: string): string | undefined {
    const name = UIA_CONTROL_TYPE_NAMES[controlTypeId];
    return name;
}
