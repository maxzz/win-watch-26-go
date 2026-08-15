package msaa

// STATE_SYSTEM_* bit names from oleacc.h.
var stateBits = []struct {
	bit  uint32
	name string
}{
	{0x00000001, "UNAVAILABLE"},
	{0x00000002, "SELECTED"},
	{0x00000004, "FOCUSED"},
	{0x00000008, "PRESSED"},
	{0x00000010, "CHECKED"},
	{0x00000020, "MIXED"},
	{0x00000040, "READONLY"},
	{0x00000080, "HOTTRACKED"},
	{0x00000100, "DEFAULT"},
	{0x00000200, "EXPANDED"},
	{0x00000400, "COLLAPSED"},
	{0x00000800, "BUSY"},
	{0x00001000, "FLOATING"},
	{0x00002000, "MARQUEED"},
	{0x00004000, "ANIMATED"},
	{0x00008000, "INVISIBLE"},
	{0x00010000, "OFFSCREEN"},
	{0x00020000, "SIZEABLE"},
	{0x00040000, "MOVEABLE"},
	{0x00080000, "SELFVOICING"},
	{0x00100000, "FOCUSABLE"},
	{0x00200000, "SELECTABLE"},
	{0x00400000, "LINKED"},
	{0x00800000, "TRAVERSED"},
	{0x01000000, "MULTISELECTABLE"},
	{0x02000000, "EXTSELECTABLE"},
	{0x04000000, "ALERT_LOW"},
	{0x08000000, "ALERT_MEDIUM"},
	{0x10000000, "ALERT_HIGH"},
	{0x20000000, "PROTECTED"},
	{0x40000000, "HASPOPUP"},
}

func DecodeStateFlags(state uint32) []string {
	var flags []string
	for _, item := range stateBits {
		if state&item.bit != 0 {
			flags = append(flags, item.name)
		}
	}
	if flags == nil {
		return []string{}
	}
	return flags
}
