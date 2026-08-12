// Package windowdetail provides detailed Win32 window properties for the
// properties panel (General + Window Extra tabs), separate from the lightweight
// top-level WindowInfo used by the windows list.
package windowdetail

// RectInfo mirrors a Win32 RECT plus derived size.
type RectInfo struct {
	Left   int32 `json:"left"`
	Top    int32 `json:"top"`
	Right  int32 `json:"right"`
	Bottom int32 `json:"bottom"`
	Width  int32 `json:"width"`
	Height int32 `json:"height"`
}

// RelatedWindow describes the parent or owner of the target window.
type RelatedWindow struct {
	Handle    string `json:"handle"`
	ClassName string `json:"className"`
}

// WindowDetailInfo is the detailed per-window payload for General / Window Extra.
// Shape matches traytools WindowInfo so the UI can mirror that panel.
type WindowDetailInfo struct {
	Valid bool `json:"valid"`

	Handle     string        `json:"handle"`
	Caption    string        `json:"caption"`
	ClassName  string        `json:"className"`
	Unicode    bool          `json:"unicode"`
	Style      uint32        `json:"style"`
	ExStyle    uint32        `json:"exStyle"`
	Visible    bool          `json:"visible"`
	Enabled    bool          `json:"enabled"`
	Rect       RectInfo      `json:"rect"`
	ClientRect RectInfo      `json:"clientRect"`
	ControlID  int64         `json:"controlId"`
	Instance   string        `json:"instance"`
	UserData   string        `json:"userData"`
	Parent     RelatedWindow `json:"parent"`
	Owner      RelatedWindow `json:"owner"`

	StyleNames   []string `json:"styleNames"`
	ExStyleNames []string `json:"exStyleNames"`

	ClassAtom        string `json:"classAtom"`
	ClassStyle       uint32 `json:"classStyle"`
	ClassExtraBytes  int32  `json:"classExtraBytes"`
	WindowExtraBytes int32  `json:"windowExtraBytes"`

	ProcessID   uint32 `json:"processId"`
	ThreadID    uint32 `json:"threadId"`
	ProcessName string `json:"processName"`
	ProcessPath string `json:"processPath"`
	Bits        int    `json:"bits"`
	UserName    string `json:"userName"`
	Integrity   string `json:"integrity"`
}
