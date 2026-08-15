// Package accinteract discovers UI Automation patterns and raw MSAA
// IAccessible state/actions for a selected control. It is kept separate from
// the control-tree walker so the inspector surface can grow independently.
package accinteract

// Snapshot is the JSON payload for the Accessibility interaction section.
type Snapshot struct {
	Found bool        `json:"found"`
	Error string      `json:"error,omitempty"`
	UIA   UiaSection  `json:"uia"`
	MSAA  MsaaSection `json:"msaa"`
}

type UiaSection struct {
	Properties []NamedValue `json:"properties"`
	Actions    []ActionDef  `json:"actions"`
	Patterns   []UiaPattern `json:"patterns"`
}

type UiaPattern struct {
	ID         int          `json:"id"`
	Name       string       `json:"name"`
	Properties []NamedValue `json:"properties"`
	Actions    []ActionDef  `json:"actions"`
}

type MsaaSection struct {
	Available  bool         `json:"available"`
	Error      string       `json:"error,omitempty"`
	Properties []NamedValue `json:"properties"`
	StateValue uint32       `json:"stateValue"`
	StateFlags []string     `json:"stateFlags"`
	Actions    []ActionDef  `json:"actions"`
}

type NamedValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// ActionDef describes a get/set/command the UI can render without hard-coding
// per-control widgets. Kind is command | setString | setNumber | setPair.
type ActionDef struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	Kind         string `json:"kind"`
	CurrentValue string `json:"currentValue,omitempty"`
	Placeholder  string `json:"placeholder,omitempty"`
	Hint         string `json:"hint,omitempty"`
	Destructive  bool   `json:"destructive,omitempty"`
}

type ActionResult struct {
	OK       bool      `json:"ok"`
	Error    string    `json:"error,omitempty"`
	Snapshot *Snapshot `json:"snapshot,omitempty"`
}

func nv(name, value string) NamedValue {
	return NamedValue{Name: name, Value: value}
}

func cmd(id, label string) ActionDef {
	return ActionDef{ID: id, Label: label, Kind: "command"}
}

func setString(id, label, current, placeholder string) ActionDef {
	return ActionDef{ID: id, Label: label, Kind: "setString", CurrentValue: current, Placeholder: placeholder}
}

func setNumber(id, label, current, placeholder string) ActionDef {
	return ActionDef{ID: id, Label: label, Kind: "setNumber", CurrentValue: current, Placeholder: placeholder}
}

func setPair(id, label, current, placeholder, hint string) ActionDef {
	return ActionDef{ID: id, Label: label, Kind: "setPair", CurrentValue: current, Placeholder: placeholder, Hint: hint}
}
