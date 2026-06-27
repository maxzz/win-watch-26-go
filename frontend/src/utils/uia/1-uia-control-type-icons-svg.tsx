import type { JSX } from "react";
import {
    Box,
    Calendar,
    CheckSquare,
    ChevronDown,
    Type,
    Link,
    Image,
    List,
    ListOrdered,
    Menu,
    MenuSquare,
    LayoutList,
    Loader,
    Circle,
    SlidersHorizontal,
    Gauge,
    RotateCw,
    PanelTop,
    Columns,
    FileText,
    Text,
    TreeDeciduous,
    Folder,
    Boxes,
    Group,
    GripVertical,
    Table,
    Grid3X3,
    FileSpreadsheet,
    AppWindow,
    PanelLeft,
    PanelTopInactive,
    Heading,
    Minus,
    ZoomIn,
    LayoutDashboard,
    Square,
    MousePointer2,
} from "lucide-react";
import { SymbolFieldBtn, SymbolFieldLst, SymbolFieldTxt } from "pm-manifest-icons";
import {
    SymbolControlButton,
    SymbolControlScrollbar,
    SymbolControlSlider,
    SymbolControlStatusbar,
    SymbolControlTab,
    SymbolControlTabItem,
    SymbolControlThumb,
    SymbolControlTitlebar,
    SymbolControlTooltip,
    SymbolControlWindow,
    SymbolControlPane,
    SymbolControlGroup,
    SymbolControlTreeRoot,
    SymbolControlTreeChild,
} from "@renderer/components/ui/icons/symbols/controls";
import { Symbol_uia_Toolbar, Symbol_uia_Tooltip } from "@renderer/components/ui/icons/symbols/ui-automation";
import { UIA_CONTROL_TYPE_FILMSTRIP_ICONS, DefaultFilmstripControlTypeIcon } from "./2-uia-control-type-icons-filmstrip";
import { IconControlTreeChild, IconControlTreeRoot } from "@renderer/components/ui/icons/symbols/controls-temp";

const USE_FILMSTRIP = false; // Set to true to use the new pixel-art filmstrip icons

const icon3Classes = "shrink-0 size-3 text-blue-700 dark:text-sky-500";
const icon4Classes = "shrink-0 size-4 text-blue-700 dark:text-sky-500";
const icon35Classes = "shrink-0 size-3.5 text-blue-700 dark:text-sky-500";

const iconButtonClasses = "shrink-0 -ml-0.5 size-4 text-blue-700 dark:text-sky-300";
const iconCustomClasses = "shrink-0 size-3 text-blue-700/50 dark:text-sky-500/50";
const iconGroupClasses = "shrink-0 -ml-0.5 size-4 text-blue-700 dark:text-sky-500";
const iconWindowClasses = "shrink-0 -ml-1 size-4";

/**
 * Maps UIA Control Type IDs to corresponding Lucide icon elements.
 */
const UIA_LUCIDE_ICONS: Record<string, JSX.Element> = {
    "50000": <SymbolControlButton className={iconButtonClasses} />,                // Button
    "50001": <Calendar className={icon3Classes} />,                                // Calendar
    "50002": <CheckSquare className={icon3Classes} />,                             // CheckBox
    "50003": <SymbolFieldLst className={icon3Classes} />,                          // ComboBox
    "50004": <Type className={icon3Classes} />,                                    // Edit
    "50005": <Link className={icon3Classes} />,                                    // Hyperlink
    "50006": <Image className={icon3Classes} />,                                   // Image
    "50007": <ListOrdered className={icon3Classes} />,                             // ListItem
    "50008": <List className={icon3Classes} />,                                    // List
    "50009": <Menu className={icon3Classes} />,                                    // Menu
    "50010": <MenuSquare className={icon3Classes} />,                              // MenuBar
    "50011": <LayoutList className={icon3Classes} />,                              // MenuItem
    "50012": <Loader className={icon3Classes} />,                                  // ProgressBar
    "50013": <Circle className={icon3Classes} />,                                  // RadioButton
    "50014": <SymbolControlScrollbar className={icon4Classes} />,                  // ScrollBar
    "50015": <SymbolControlSlider className={icon3Classes} />,                     // Slider
    "50016": <RotateCw className={icon3Classes} />,                                // Spinner
    "50017": <SymbolControlStatusbar className={icon3Classes} />,                  // StatusBar
    "50018": <SymbolControlTab className={icon3Classes} />,                        // Tab
    "50019": <SymbolControlTabItem className={icon3Classes} />,                    // TabItem
    "50020": <SymbolFieldTxt className={icon4Classes} />,                          // Text
    "50021": <Symbol_uia_Toolbar className={icon3Classes} />,                      // ToolBar
    "50022": <SymbolControlTooltip className={icon3Classes} />,                    // ToolTip
    "50023": <SymbolControlTreeRoot className={icon35Classes} />,                  // Tree
    "50024": <SymbolControlTreeChild className={icon35Classes} />,                 // TreeItem
    // "50023": <IconControlTreeRoot className={icon35Classes} />,                  // Tree
    // "50024": <IconControlTreeChild className={icon35Classes} />,                 // TreeItem
    "50025": <Boxes className={iconCustomClasses} />,                              // Custom
    "50026": <SymbolControlGroup className={iconGroupClasses} />,                  // Group
    "50027": <SymbolControlThumb className={icon3Classes} />,                      // Thumb
    "50028": <Grid3X3 className={icon3Classes} />,                                 // DataGrid
    "50029": <FileSpreadsheet className={icon3Classes} />,                         // DataItem
    "50030": <FileText className={icon3Classes} />,                                // Document
    "50031": <Square className={icon3Classes} />,                                  // SplitButton
    "50032": <SymbolControlWindow className={iconWindowClasses} />,                // Window
    "50033": <SymbolControlPane className={icon3Classes} />,                       // Pane
    "50034": <Heading className={icon3Classes} />,                                 // Header
    "50035": <PanelTopInactive className={icon3Classes} />,                        // HeaderItem
    "50036": <Table className={icon3Classes} />,                                   // Table
    "50037": <SymbolControlTitlebar className={icon3Classes} />,                   // TitleBar
    "50038": <Minus className={icon3Classes} />,                                   // Separator
    "50039": <ZoomIn className={icon3Classes} />,                                  // SemanticZoom
    "50040": <LayoutDashboard className={icon3Classes} />,                         // AppBar
};

const DefaultLucideIcon: JSX.Element = <Box className={icon3Classes} />;

/**
 * Maps UIA Control Type IDs to corresponding icon elements.
 * Control Type IDs are from UIAutomationClient.h
 * https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controltype-ids
 */
const UIA_CONTROL_TYPE_ICONS: Record<string, JSX.Element> = USE_FILMSTRIP
    ? UIA_CONTROL_TYPE_FILMSTRIP_ICONS
    : UIA_LUCIDE_ICONS;

/**
 * Default icon for unknown control types
 */
const DefaultControlTypeIcon: JSX.Element = USE_FILMSTRIP
    ? DefaultFilmstripControlTypeIcon
    : DefaultLucideIcon;

/**
 * Get the icon element for a given control type ID
 * @param controlTypeId - The numeric control type ID as string (e.g., "50000")
 * @returns The icon element for the control type, or the default icon if unknown
 */
export function getControlTypeIcon(controlTypeId: string): JSX.Element {
    return UIA_CONTROL_TYPE_ICONS[controlTypeId] ?? DefaultControlTypeIcon;
}
