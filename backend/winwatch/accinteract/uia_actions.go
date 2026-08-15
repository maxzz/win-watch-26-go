package accinteract

import (
	"fmt"
	"strconv"
	"unsafe"

	"golang.org/x/sys/windows"

	"github.com/maxzz/win-watch-26/backend/winwatch/uia"
)

const (
	scrollLargeDecrement = 0
	scrollSmallDecrement = 1
	scrollNoAmount       = 2
	scrollLargeIncrement = 3
	scrollSmallIncrement = 4
)

func executeUia(target uintptr, actionID, value string) error {
	if actionID == "element.setFocus" {
		if !uia.SetFocus(target) {
			return fmt.Errorf("SetFocus failed")
		}
		return nil
	}

	type spec struct {
		patternID int
		run       func(pattern uintptr) error
	}
	handlers := map[string]spec{
		"invoke.invoke":           {patternInvoke, func(p uintptr) error { return call(p, 3, "Invoke") }},
		"toggle.toggle":           {patternToggle, func(p uintptr) error { return call(p, 3, "Toggle") }},
		"expandCollapse.expand":   {patternExpandCollapse, expandPattern},
		"expandCollapse.collapse": {patternExpandCollapse, collapsePattern},
		"value.setValue":          {patternValue, func(p uintptr) error { return setLPCWSTR(p, 3, value, "SetValue") }},
		"rangeValue.setValue": {patternRangeValue, func(p uintptr) error {
			n, err := strconv.ParseFloat(value, 64)
			if err != nil {
				return err
			}
			return callArgs(p, 3, "SetValue", bits(n))
		}},
		"selectionItem.select":              {patternSelectionItem, func(p uintptr) error { return call(p, 3, "Select") }},
		"selectionItem.addToSelection":      {patternSelectionItem, func(p uintptr) error { return call(p, 4, "AddToSelection") }},
		"selectionItem.removeFromSelection": {patternSelectionItem, func(p uintptr) error { return call(p, 5, "RemoveFromSelection") }},
		"scroll.upSmall":                    {patternScroll, func(p uintptr) error { return scrollBy(p, scrollNoAmount, scrollSmallDecrement) }},
		"scroll.downSmall":                  {patternScroll, func(p uintptr) error { return scrollBy(p, scrollNoAmount, scrollSmallIncrement) }},
		"scroll.leftSmall":                  {patternScroll, func(p uintptr) error { return scrollBy(p, scrollSmallDecrement, scrollNoAmount) }},
		"scroll.rightSmall":                 {patternScroll, func(p uintptr) error { return scrollBy(p, scrollSmallIncrement, scrollNoAmount) }},
		"scroll.upLarge":                    {patternScroll, func(p uintptr) error { return scrollBy(p, scrollNoAmount, scrollLargeDecrement) }},
		"scroll.downLarge":                  {patternScroll, func(p uintptr) error { return scrollBy(p, scrollNoAmount, scrollLargeIncrement) }},
		"scroll.leftLarge":                  {patternScroll, func(p uintptr) error { return scrollBy(p, scrollLargeDecrement, scrollNoAmount) }},
		"scroll.rightLarge":                 {patternScroll, func(p uintptr) error { return scrollBy(p, scrollLargeIncrement, scrollNoAmount) }},
		"scroll.setPercent": {patternScroll, func(p uintptr) error {
			h, v, err := parsePair(value)
			if err != nil {
				return err
			}
			return callArgs(p, 4, "SetScrollPercent", bits(h), bits(v))
		}},
		"scrollItem.scrollIntoView": {patternScrollItem, func(p uintptr) error { return call(p, 3, "ScrollIntoView") }},
		"window.close":              {patternWindow, func(p uintptr) error { return call(p, 3, "Close") }},
		"window.setNormal":          {patternWindow, func(p uintptr) error { return callArgs(p, 5, "SetWindowVisualState", 0) }},
		"window.setMaximized":       {patternWindow, func(p uintptr) error { return callArgs(p, 5, "SetWindowVisualState", 1) }},
		"window.setMinimized":       {patternWindow, func(p uintptr) error { return callArgs(p, 5, "SetWindowVisualState", 2) }},
		"transform.move": {patternTransform, func(p uintptr) error {
			x, y, err := parsePair(value)
			if err != nil {
				return err
			}
			return callArgs(p, 3, "Move", bits(x), bits(y))
		}},
		"transform.resize": {patternTransform, func(p uintptr) error {
			w, h, err := parsePair(value)
			if err != nil {
				return err
			}
			return callArgs(p, 4, "Resize", bits(w), bits(h))
		}},
		"transform.rotate": {patternTransform, func(p uintptr) error {
			n, err := strconv.ParseFloat(value, 64)
			if err != nil {
				return err
			}
			return callArgs(p, 5, "Rotate", bits(n))
		}},
		"dock.top":    {patternDock, func(p uintptr) error { return callArgs(p, 3, "SetDockPosition", 0) }},
		"dock.left":   {patternDock, func(p uintptr) error { return callArgs(p, 3, "SetDockPosition", 1) }},
		"dock.bottom": {patternDock, func(p uintptr) error { return callArgs(p, 3, "SetDockPosition", 2) }},
		"dock.right":  {patternDock, func(p uintptr) error { return callArgs(p, 3, "SetDockPosition", 3) }},
		"dock.fill":   {patternDock, func(p uintptr) error { return callArgs(p, 3, "SetDockPosition", 4) }},
		"dock.none":   {patternDock, func(p uintptr) error { return callArgs(p, 3, "SetDockPosition", 5) }},
		"multipleView.setView": {patternMultipleView, func(p uintptr) error {
			n, err := strconv.Atoi(value)
			if err != nil {
				return err
			}
			return callArgs(p, 4, "SetCurrentView", uintptr(uint32(n)))
		}},
		"virtualizedItem.realize": {patternVirtualizedItem, func(p uintptr) error { return call(p, 3, "Realize") }},
	}

	h, ok := handlers[actionID]
	if !ok {
		return fmt.Errorf("unknown UIA action %q", actionID)
	}
	pattern := uia.GetCurrentPattern(target, h.patternID)
	if pattern == 0 {
		return fmt.Errorf("pattern for %q is not available", actionID)
	}
	defer uia.Release(pattern)
	return h.run(pattern)
}

const (
	expandCollapsed         = 0
	expandExpanded          = 1
	expandPartiallyExpanded = 2
	expandLeafNode          = 3
)

func expandPattern(pattern uintptr) error {
	state := uia.GetInt32(pattern, 5)
	if state == expandExpanded || state == expandLeafNode {
		return nil
	}
	if err := call(pattern, 3, "Expand"); err != nil {
		state = uia.GetInt32(pattern, 5)
		if state == expandExpanded || state == expandPartiallyExpanded {
			return nil
		}
		return err
	}
	return nil
}

func collapsePattern(pattern uintptr) error {
	state := uia.GetInt32(pattern, 5)
	if state == expandCollapsed || state == expandLeafNode {
		return nil
	}
	if err := call(pattern, 4, "Collapse"); err != nil {
		state = uia.GetInt32(pattern, 5)
		if state == expandCollapsed {
			return nil
		}
		return err
	}
	return nil
}

func call(obj uintptr, idx int, name string) error {
	return callArgs(obj, idx, name)
}

func callArgs(obj uintptr, idx int, name string, args ...uintptr) error {
	hr := uia.ComCall(obj, idx, args...)
	if !uia.HRESULTOK(hr) {
		return fmt.Errorf("%s failed (hr=0x%08X)", name, uint32(hr))
	}
	return nil
}

func setLPCWSTR(obj uintptr, idx int, value, name string) error {
	p, err := windows.UTF16PtrFromString(value)
	if err != nil {
		return err
	}
	return callArgs(obj, idx, name, uintptr(unsafe.Pointer(p)))
}

func scrollBy(pattern uintptr, horizontal, vertical int) error {
	return callArgs(pattern, 3, "Scroll", uintptr(uint32(horizontal)), uintptr(uint32(vertical)))
}
