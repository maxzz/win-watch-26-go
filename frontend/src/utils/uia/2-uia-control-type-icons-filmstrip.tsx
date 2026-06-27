import type { JSX } from "react";
import { UiaFilmstripIcon } from "./8-uia-filmstrip-icon";

const iconClass = "size-4";

/**
 * Maps UIA Control Type IDs to corresponding icons from the filmstrip image.
 */
export const UIA_CONTROL_TYPE_FILMSTRIP_ICONS: Record<string, JSX.Element> = {
    "50000": <UiaFilmstripIcon index={41} className={iconClass} />, // Button
    "50001": <UiaFilmstripIcon index={70} className={iconClass} />, // Calendar
    "50002": <UiaFilmstripIcon index={42} className={iconClass} />, // CheckBox
    "50003": <UiaFilmstripIcon index={43} className={iconClass} />, // ComboBox
    "50004": <UiaFilmstripIcon index={46} className={iconClass} />, // Edit
    "50005": <UiaFilmstripIcon index={68} className={iconClass} />, // Hyperlink
    "50006": <UiaFilmstripIcon index={69} className={iconClass} />, // Image
    "50007": <UiaFilmstripIcon index={65} className={iconClass} />, // ListItem
    "50008": <UiaFilmstripIcon index={64} className={iconClass} />, // List
    "50009": <UiaFilmstripIcon index={48} className={iconClass} />, // Menu
    "50010": <UiaFilmstripIcon index={47} className={iconClass} />, // MenuBar
    "50011": <UiaFilmstripIcon index={49} className={iconClass} />, // MenuItem
    "50012": <UiaFilmstripIcon index={51} className={iconClass} />, // ProgressBar
    "50013": <UiaFilmstripIcon index={53} className={iconClass} />, // RadioButton
    "50014": <UiaFilmstripIcon index={54} className={iconClass} />, // ScrollBar
    "50015": <UiaFilmstripIcon index={55} className={iconClass} />, // Slider
    "50016": <UiaFilmstripIcon index={56} className={iconClass} />, // Spinner
    "50017": <UiaFilmstripIcon index={57} className={iconClass} />, // StatusBar
    "50018": <UiaFilmstripIcon index={58} className={iconClass} />, // Tab
    "50019": <UiaFilmstripIcon index={59} className={iconClass} />, // TabItem
    "50020": <UiaFilmstripIcon index={60} className={iconClass} />, // Text
    "50021": <UiaFilmstripIcon index={61} className={iconClass} />, // ToolBar
    "50022": <UiaFilmstripIcon index={62} className={iconClass} />, // ToolTip
    "50023": <UiaFilmstripIcon index={63} className={iconClass} />, // Tree
    "50024": <UiaFilmstripIcon index={38} className={iconClass} />, // TreeItem
    "50025": <UiaFilmstripIcon index={71} className={iconClass} />, // Custom
    "50026": <UiaFilmstripIcon index={66} className={iconClass} />, // Group
    "50027": <UiaFilmstripIcon index={52} className={iconClass} />, // Thumb
    "50028": <UiaFilmstripIcon index={72} className={iconClass} />, // DataGrid
    "50029": <UiaFilmstripIcon index={73} className={iconClass} />, // DataItem
    "50030": <UiaFilmstripIcon index={15} className={iconClass} />, // Document
    "50031": <UiaFilmstripIcon index={44} className={iconClass} />, // SplitButton
    "50032": <UiaFilmstripIcon index={1}  className={iconClass} />, // Window
    "50033": <UiaFilmstripIcon index={2}  className={iconClass} />, // Pane
    "50034": <UiaFilmstripIcon index={34} className={iconClass} />, // Header
    "50035": <UiaFilmstripIcon index={35} className={iconClass} />, // HeaderItem
    "50036": <UiaFilmstripIcon index={67} className={iconClass} />, // Table
    "50037": <UiaFilmstripIcon index={37} className={iconClass} />, // TitleBar
    "50038": <UiaFilmstripIcon index={39} className={iconClass} />, // Separator
    "50039": <UiaFilmstripIcon index={42} className={iconClass} />, // SemanticZoom
    "50040": <UiaFilmstripIcon index={20} className={iconClass} />, // AppBar
};

/**
 * Default icon for unknown control types from filmstrip (Question mark icon usually at index 0)
 */
export const DefaultFilmstripControlTypeIcon: JSX.Element = <UiaFilmstripIcon index={0} className={iconClass} />;
