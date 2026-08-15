package accinteract

import (
	"fmt"
	"strconv"

	"github.com/maxzz/win-watch-26/backend/winwatch/msaa"
	"github.com/maxzz/win-watch-26/backend/winwatch/uia"
)

// GetSnapshot returns available UIA patterns and MSAA state for a control.
func GetSnapshot(auto *uia.Automation, hwnd uintptr, runtimeID string) Snapshot {
	if !uia.EnsureStarted(auto) {
		return Snapshot{Error: "UI Automation is not available"}
	}
	var snap Snapshot
	uia.Do(auto, func() {
		found := uia.WithTarget(auto, hwnd, runtimeID, func(target uintptr, _ bool) {
			snap = readSnapshot(target)
			snap.Found = true
		})
		if !found {
			snap.Error = "Control not found"
		}
	})
	return snap
}

// Execute runs one UIA or MSAA action and returns a fresh snapshot on success.
func Execute(auto *uia.Automation, hwnd uintptr, runtimeID, kind, actionID, value string) ActionResult {
	if !uia.EnsureStarted(auto) {
		return ActionResult{Error: "UI Automation is not available"}
	}
	var result ActionResult
	uia.Do(auto, func() {
		found := uia.WithTarget(auto, hwnd, runtimeID, func(target uintptr, _ bool) {
			var err error
			switch kind {
			case "uia":
				err = executeUia(target, actionID, value)
			case "msaa":
				err = executeMsaa(target, actionID, value)
			default:
				err = fmt.Errorf("unknown API kind %q", kind)
			}
			if err != nil {
				result.Error = err.Error()
				return
			}
			snap := readSnapshot(target)
			snap.Found = true
			result.OK = true
			result.Snapshot = &snap
		})
		if !found && result.Error == "" {
			result.Error = "Control not found"
		}
	})
	return result
}

func readSnapshot(target uintptr) Snapshot {
	return Snapshot{
		UIA:  readUia(target),
		MSAA: readMsaa(target),
	}
}

func readUia(target uintptr) UiaSection {
	section := UiaSection{
		Properties: []NamedValue{
			nv("Has keyboard focus", strconv.FormatBool(uia.GetBool(target, uia.IdxElemHasKeyboardFocus))),
			nv("Keyboard focusable", strconv.FormatBool(uia.GetBool(target, uia.IdxElemIsKeyboardFocusable))),
		},
		Actions: []ActionDef{
			cmd("element.setFocus", "Set focus"),
		},
		Patterns: []UiaPattern{},
	}
	for _, probe := range uiaProbes {
		pattern := uia.GetCurrentPattern(target, probe.id)
		if pattern == 0 {
			continue
		}
		item := probe.read(pattern)
		item.ID = probe.id
		item.Name = probe.name
		if item.Properties == nil {
			item.Properties = []NamedValue{}
		}
		if item.Actions == nil {
			item.Actions = []ActionDef{}
		}
		section.Patterns = append(section.Patterns, item)
		uia.Release(pattern)
	}
	return section
}

func readMsaa(target uintptr) MsaaSection {
	legacy := uia.GetCurrentPattern(target, 10018)
	info := msaa.Info{Error: "MSAA is not available for this element"}
	if legacy != 0 {
		info = msaa.FromLegacyPattern(legacy)
		uia.Release(legacy)
	}
	if !info.Available {
		hwnd := uia.GetHandle(target, uia.IdxElemCurNativeWindowHandle)
		if hwnd != 0 {
			fallback := msaa.FromWindow(hwnd)
			if fallback.Available {
				info = fallback
			}
		}
	}
	if !info.Available {
		return MsaaSection{Available: false, Error: info.Error, Properties: []NamedValue{}, StateFlags: []string{}, Actions: []ActionDef{}}
	}

	props := []NamedValue{
		nv("Name", info.Name),
		nv("Value", info.Value),
		nv("Description", info.Description),
		nv("Role", fmt.Sprintf("%s (0x%X)", info.RoleName, info.Role)),
		nv("State", fmt.Sprintf("0x%08X", info.State)),
		nv("Default action", info.DefaultAction),
		nv("Keyboard shortcut", info.KeyboardShortcut),
		nv("Help", info.Help),
		nv("Child count", strconv.Itoa(int(info.ChildCount))),
	}
	if info.HasLocation {
		props = append(props, nv("Location", fmt.Sprintf("l:%d, t:%d, %dx%d", info.Left, info.Top, info.Width, info.Height)))
	}

	actions := []ActionDef{
		cmd("msaa.doDefaultAction", defaultActionLabel(info.DefaultAction)),
		cmd("msaa.select.takeFocus", "Take focus"),
		cmd("msaa.select.takeSelection", "Take selection"),
		cmd("msaa.select.add", "Add to selection"),
		cmd("msaa.select.remove", "Remove from selection"),
		setString("msaa.setName", "Set name", info.Name, "accName"),
		setString("msaa.setValue", "Set value", info.Value, "accValue"),
	}

	return MsaaSection{
		Available:  true,
		Properties: props,
		StateValue: info.State,
		StateFlags: info.StateFlags,
		Actions:    actions,
	}
}

func defaultActionLabel(name string) string {
	if name == "" {
		return "Do default action"
	}
	return "Do default action (" + name + ")"
}

func executeMsaa(target uintptr, actionID, value string) error {
	return msaa.WithAccessible(target, func(acc uintptr) error {
		switch actionID {
		case "msaa.doDefaultAction":
			return msaa.DoDefaultAction(acc)
		case "msaa.select.takeFocus":
			return msaa.Select(acc, msaa.SelTakeFocus)
		case "msaa.select.takeSelection":
			return msaa.Select(acc, msaa.SelTakeFocus|msaa.SelTakeSelection)
		case "msaa.select.add":
			return msaa.Select(acc, msaa.SelAddSelection)
		case "msaa.select.remove":
			return msaa.Select(acc, msaa.SelRemoveSelection)
		case "msaa.setName":
			return msaa.PutName(acc, value)
		case "msaa.setValue":
			return msaa.PutValue(acc, value)
		default:
			return fmt.Errorf("unknown MSAA action %q", actionID)
		}
	})
}
