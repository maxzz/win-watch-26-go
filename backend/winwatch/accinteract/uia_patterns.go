package accinteract

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"unicode/utf8"
	"unsafe"

	"github.com/maxzz/win-watch-26/backend/winwatch/uia"
)

const (
	patternInvoke          = 10000
	patternSelection       = 10001
	patternValue           = 10002
	patternRangeValue      = 10003
	patternScroll          = 10004
	patternExpandCollapse  = 10005
	patternGrid            = 10006
	patternGridItem        = 10007
	patternMultipleView    = 10008
	patternWindow          = 10009
	patternSelectionItem   = 10010
	patternDock            = 10011
	patternTable           = 10012
	patternTableItem       = 10013
	patternText            = 10014
	patternToggle          = 10015
	patternTransform       = 10016
	patternScrollItem      = 10017
	patternItemContainer   = 10019
	patternVirtualizedItem = 10020
)

type patternProbe struct {
	id   int
	name string
	read func(elem, pattern uintptr) UiaPattern
}

func patternOnly(fn func(pattern uintptr) UiaPattern) func(elem, pattern uintptr) UiaPattern {
	return func(_ uintptr, pattern uintptr) UiaPattern { return fn(pattern) }
}

var uiaProbes = []patternProbe{
	{patternInvoke, "Invoke", patternOnly(readInvoke)},
	{patternToggle, "Toggle", patternOnly(readToggle)},
	{patternExpandCollapse, "ExpandCollapse", patternOnly(readExpandCollapse)},
	{patternValue, "Value", patternOnly(readValue)},
	{patternRangeValue, "RangeValue", patternOnly(readRangeValue)},
	{patternSelection, "Selection", patternOnly(readSelection)},
	{patternSelectionItem, "SelectionItem", patternOnly(readSelectionItem)},
	{patternScroll, "Scroll", patternOnly(readScroll)},
	{patternScrollItem, "ScrollItem", patternOnly(readScrollItem)},
	{patternWindow, "Window", patternOnly(readWindow)},
	{patternTransform, "Transform", readTransform},
	{patternDock, "Dock", patternOnly(readDock)},
	{patternMultipleView, "MultipleView", patternOnly(readMultipleView)},
	{patternGrid, "Grid", patternOnly(readGrid)},
	{patternGridItem, "GridItem", patternOnly(readGridItem)},
	{patternTable, "Table", patternOnly(readTable)},
	{patternTableItem, "TableItem", patternOnly(readTableItem)},
	{patternText, "Text", patternOnly(readText)},
	{patternVirtualizedItem, "VirtualizedItem", patternOnly(readVirtualizedItem)},
	{patternItemContainer, "ItemContainer", patternOnly(readItemContainer)},
}

var toggleStateNames = []string{"Off", "On", "Indeterminate"}
var expandStateNames = []string{"Collapsed", "Expanded", "PartiallyExpanded", "LeafNode"}
var windowVisualNames = []string{"Normal", "Maximized", "Minimized"}
var windowInteractionNames = []string{"Running", "Closing", "ReadyForUserInteraction", "BlockedByModalWindow", "NotResponding"}
var dockPositionNames = []string{"Top", "Left", "Bottom", "Right", "Fill", "None"}
var rowOrColumnMajorNames = []string{"RowMajor", "ColumnMajor", "Indeterminate"}

func enumName(names []string, v int32) string {
	if v >= 0 && int(v) < len(names) {
		return names[v]
	}
	return strconv.Itoa(int(v))
}

func fmtBool(v bool) string { return strconv.FormatBool(v) }

func fmtFloat(v float64) string {
	return strconv.FormatFloat(v, 'f', -1, 64)
}

func readInvoke(_ uintptr) UiaPattern {
	return UiaPattern{Actions: []ActionDef{cmd("invoke.invoke", "Invoke")}}
}

func readToggle(pattern uintptr) UiaPattern {
	state := uia.GetInt32(pattern, 4)
	return UiaPattern{
		Properties: []NamedValue{nv("ToggleState", enumName(toggleStateNames, state))},
		Actions:    []ActionDef{cmd("toggle.toggle", "Toggle")},
	}
}

func readExpandCollapse(pattern uintptr) UiaPattern {
	state := uia.GetInt32(pattern, 5)
	return UiaPattern{
		Properties: []NamedValue{nv("ExpandCollapseState", enumName(expandStateNames, state))},
		Actions: []ActionDef{
			cmd("expandCollapse.expand", "Expand"),
			cmd("expandCollapse.collapse", "Collapse"),
		},
	}
}

func readValue(pattern uintptr) UiaPattern {
	value := uia.GetString(pattern, 4)
	readOnly := uia.GetBool(pattern, 5)
	actions := []ActionDef{}
	if !readOnly {
		actions = append(actions, setString("value.setValue", "Set value", value, "value"))
	}
	return UiaPattern{
		Properties: []NamedValue{
			nv("Value", value),
			nv("IsReadOnly", fmtBool(readOnly)),
		},
		Actions: actions,
	}
}

func readRangeValue(pattern uintptr) UiaPattern {
	value, _ := uia.GetFloat64(pattern, 4)
	readOnly := uia.GetBool(pattern, 5)
	max, _ := uia.GetFloat64(pattern, 6)
	min, _ := uia.GetFloat64(pattern, 7)
	large, _ := uia.GetFloat64(pattern, 8)
	small, _ := uia.GetFloat64(pattern, 9)
	actions := []ActionDef{}
	if !readOnly {
		actions = append(actions, setNumber("rangeValue.setValue", "Set value", fmtFloat(value), fmtFloat(min)+" … "+fmtFloat(max)))
	}
	return UiaPattern{
		Properties: []NamedValue{
			nv("Value", fmtFloat(value)),
			nv("IsReadOnly", fmtBool(readOnly)),
			nv("Minimum", fmtFloat(min)),
			nv("Maximum", fmtFloat(max)),
			nv("SmallChange", fmtFloat(small)),
			nv("LargeChange", fmtFloat(large)),
		},
		Actions: actions,
	}
}

func readSelection(pattern uintptr) UiaPattern {
	var arr uintptr
	uia.ComCall(pattern, 3, uintptr(unsafe.Pointer(&arr)))
	selected := elementNames(arr)
	return UiaPattern{
		Properties: []NamedValue{
			nv("CanSelectMultiple", fmtBool(uia.GetBool(pattern, 4))),
			nv("IsSelectionRequired", fmtBool(uia.GetBool(pattern, 5))),
			nv("Selection", joinOrDash(selected)),
		},
	}
}

func readSelectionItem(pattern uintptr) UiaPattern {
	isSelected := uia.GetBool(pattern, 6)
	var container uintptr
	containerName := ""
	if uia.HRESULTOK(uia.ComCall(pattern, 7, uintptr(unsafe.Pointer(&container)))) && container != 0 {
		containerName = uia.GetString(container, uia.IdxElemCurName)
		uia.Release(container)
	}
	return UiaPattern{
		Properties: []NamedValue{
			nv("IsSelected", fmtBool(isSelected)),
			nv("SelectionContainer", containerName),
		},
		Actions: []ActionDef{
			cmd("selectionItem.select", "Select"),
			cmd("selectionItem.addToSelection", "Add to selection"),
			cmd("selectionItem.removeFromSelection", "Remove from selection"),
		},
	}
}

func readScroll(pattern uintptr) UiaPattern {
	hPct, _ := uia.GetFloat64(pattern, 5)
	vPct, _ := uia.GetFloat64(pattern, 6)
	hView, _ := uia.GetFloat64(pattern, 7)
	vView, _ := uia.GetFloat64(pattern, 8)
	hScroll := uia.GetBool(pattern, 9)
	vScroll := uia.GetBool(pattern, 10)
	actions := []ActionDef{}
	if vScroll {
		actions = append(actions,
			cmd("scroll.upSmall", "Scroll up"),
			cmd("scroll.downSmall", "Scroll down"),
			cmd("scroll.upLarge", "Page up"),
			cmd("scroll.downLarge", "Page down"),
		)
	}
	if hScroll {
		actions = append(actions,
			cmd("scroll.leftSmall", "Scroll left"),
			cmd("scroll.rightSmall", "Scroll right"),
			cmd("scroll.leftLarge", "Page left"),
			cmd("scroll.rightLarge", "Page right"),
		)
	}
	if hScroll || vScroll {
		actions = append(actions, setPair("scroll.setPercent", "Set scroll %", fmt.Sprintf("%s, %s", fmtFloat(hPct), fmtFloat(vPct)), "h, v", "Horizontal and vertical percent"))
	}
	return UiaPattern{
		Properties: []NamedValue{
			nv("HorizontallyScrollable", fmtBool(hScroll)),
			nv("VerticallyScrollable", fmtBool(vScroll)),
			nv("HorizontalScrollPercent", fmtFloat(hPct)),
			nv("VerticalScrollPercent", fmtFloat(vPct)),
			nv("HorizontalViewSize", fmtFloat(hView)),
			nv("VerticalViewSize", fmtFloat(vView)),
		},
		Actions: actions,
	}
}

func readScrollItem(_ uintptr) UiaPattern {
	return UiaPattern{Actions: []ActionDef{cmd("scrollItem.scrollIntoView", "Scroll into view")}}
}

func readWindow(pattern uintptr) UiaPattern {
	visual := uia.GetInt32(pattern, 10)
	return UiaPattern{
		Properties: []NamedValue{
			nv("CanMaximize", fmtBool(uia.GetBool(pattern, 6))),
			nv("CanMinimize", fmtBool(uia.GetBool(pattern, 7))),
			nv("IsModal", fmtBool(uia.GetBool(pattern, 8))),
			nv("IsTopmost", fmtBool(uia.GetBool(pattern, 9))),
			nv("WindowVisualState", enumName(windowVisualNames, visual)),
			nv("WindowInteractionState", enumName(windowInteractionNames, uia.GetInt32(pattern, 11))),
		},
		Actions: []ActionDef{
			titleBarCmd("window.setNormal", "Restore"),
			titleBarCmd("window.setMaximized", "Maximize"),
			titleBarCmd("window.setMinimized", "Minimize"),
			titleBarCmd("window.close", "Close"),
		},
	}
}

func readTransform(elem, pattern uintptr) UiaPattern {
	canMove := uia.GetBool(pattern, 6)
	canResize := uia.GetBool(pattern, 7)
	canRotate := uia.GetBool(pattern, 8)
	moveCurrent, resizeCurrent := "", ""
	if b, ok := uia.BoundingRect(elem); ok {
		moveCurrent = fmt.Sprintf("%d, %d", b.Left, b.Top)
		w := b.Right - b.Left
		h := b.Bottom - b.Top
		resizeCurrent = fmt.Sprintf("%d, %d", w, h)
	}
	actions := []ActionDef{}
	if canMove {
		actions = append(actions, setPair("transform.move", "Move", moveCurrent, "x, y", "Screen coordinates"))
	}
	if canResize {
		actions = append(actions, setPair("transform.resize", "Resize", resizeCurrent, "width, height", "Size in pixels"))
	}
	if canRotate {
		actions = append(actions, setNumber("transform.rotate", "Rotate", "0", "degrees"))
	}
	return UiaPattern{
		Properties: []NamedValue{
			nv("CanMove", fmtBool(canMove)),
			nv("CanResize", fmtBool(canResize)),
			nv("CanRotate", fmtBool(canRotate)),
		},
		Actions: actions,
	}
}

func readDock(pattern uintptr) UiaPattern {
	pos := uia.GetInt32(pattern, 4)
	return UiaPattern{
		Properties: []NamedValue{nv("DockPosition", enumName(dockPositionNames, pos))},
		Actions: []ActionDef{
			cmd("dock.top", "Dock top"),
			cmd("dock.left", "Dock left"),
			cmd("dock.bottom", "Dock bottom"),
			cmd("dock.right", "Dock right"),
			cmd("dock.fill", "Dock fill"),
			cmd("dock.none", "Undock"),
		},
	}
}

func readMultipleView(pattern uintptr) UiaPattern {
	current := uia.GetInt32(pattern, 5)
	return UiaPattern{
		Properties: []NamedValue{nv("CurrentView", strconv.Itoa(int(current)))},
		Actions:    []ActionDef{setNumber("multipleView.setView", "Set current view", strconv.Itoa(int(current)), "view id")},
	}
}

func readGrid(pattern uintptr) UiaPattern {
	return UiaPattern{
		Properties: []NamedValue{
			nv("RowCount", strconv.Itoa(int(uia.GetInt32(pattern, 4)))),
			nv("ColumnCount", strconv.Itoa(int(uia.GetInt32(pattern, 5)))),
		},
	}
}

func readGridItem(pattern uintptr) UiaPattern {
	return UiaPattern{
		Properties: []NamedValue{
			nv("Row", strconv.Itoa(int(uia.GetInt32(pattern, 4)))),
			nv("Column", strconv.Itoa(int(uia.GetInt32(pattern, 5)))),
			nv("RowSpan", strconv.Itoa(int(uia.GetInt32(pattern, 6)))),
			nv("ColumnSpan", strconv.Itoa(int(uia.GetInt32(pattern, 7)))),
		},
	}
}

func readTable(pattern uintptr) UiaPattern {
	return UiaPattern{
		Properties: []NamedValue{
			nv("RowOrColumnMajor", enumName(rowOrColumnMajorNames, uia.GetInt32(pattern, 5))),
		},
	}
}

func readTableItem(_ uintptr) UiaPattern {
	return UiaPattern{Properties: []NamedValue{nv("Available", "true")}}
}

func readText(pattern uintptr) UiaPattern {
	text := ""
	var rng uintptr
	if uia.HRESULTOK(uia.ComCall(pattern, 7, uintptr(unsafe.Pointer(&rng)))) && rng != 0 {
		var bstr uintptr
		uia.ComCall(rng, 12, uintptr(0xFFFFFFFF), uintptr(unsafe.Pointer(&bstr)))
		if bstr != 0 {
			text = uia.GetStringFromBSTR(bstr)
			uia.FreeBSTR(bstr)
		}
		uia.Release(rng)
	}
	return UiaPattern{
		Properties: []NamedValue{nv("DocumentText", truncateRunes(text, 400))},
	}
}

func readVirtualizedItem(_ uintptr) UiaPattern {
	return UiaPattern{Actions: []ActionDef{cmd("virtualizedItem.realize", "Realize")}}
}

func readItemContainer(_ uintptr) UiaPattern {
	return UiaPattern{Properties: []NamedValue{nv("Available", "true")}}
}

func elementNames(arr uintptr) []string {
	if arr == 0 {
		return nil
	}
	defer uia.Release(arr)
	var n int32
	uia.ComCall(arr, 3, uintptr(unsafe.Pointer(&n)))
	var names []string
	limit := n
	if limit > 20 {
		limit = 20
	}
	for i := int32(0); i < limit; i++ {
		var el uintptr
		if !uia.HRESULTOK(uia.ComCall(arr, 4, uintptr(i), uintptr(unsafe.Pointer(&el)))) || el == 0 {
			continue
		}
		name := uia.GetString(el, uia.IdxElemCurName)
		if name == "" {
			name = "(unnamed)"
		}
		names = append(names, name)
		uia.Release(el)
	}
	if n > limit {
		names = append(names, fmt.Sprintf("… +%d more", n-limit))
	}
	return names
}

func joinOrDash(items []string) string {
	if len(items) == 0 {
		return "—"
	}
	return strings.Join(items, ", ")
}

func truncateRunes(s string, max int) string {
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	runes := []rune(s)
	return string(runes[:max]) + "…"
}

func parsePair(s string) (float64, float64, error) {
	parts := strings.Split(s, ",")
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("expected two comma-separated numbers")
	}
	a, err := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
	if err != nil {
		return 0, 0, err
	}
	b, err := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
	if err != nil {
		return 0, 0, err
	}
	return a, b, nil
}

func bits(v float64) uintptr {
	return uintptr(math.Float64bits(v))
}
