package msaa

import "testing"

func TestDecodeStateFlags(t *testing.T) {
	flags := DecodeStateFlags(0x00100004) // FOCUSABLE | FOCUSED
	if len(flags) != 2 || flags[0] != "FOCUSED" || flags[1] != "FOCUSABLE" {
		t.Fatalf("unexpected flags: %#v", flags)
	}
	if got := DecodeStateFlags(0); len(got) != 0 {
		t.Fatalf("expected empty flags, got %#v", got)
	}
}
