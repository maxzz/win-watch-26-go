package winpicker

import (
	"image"
	"image/color"
	"testing"
)

func TestScaleAndPunchBlack(t *testing.T) {
	src := image.NewRGBA(image.Rect(0, 0, 2, 2))
	src.SetRGBA(0, 0, color.RGBA{0, 0, 0, 255})
	src.SetRGBA(1, 0, color.RGBA{255, 0, 0, 255})
	src.SetRGBA(0, 1, color.RGBA{180, 180, 180, 255})
	src.SetRGBA(1, 1, color.RGBA{0, 0, 0, 255})

	dst := scaleAndPunchBlack(src, 2)

	if got := dst.RGBAAt(0, 0); got.A != 0 {
		t.Fatalf("black background should be transparent, got %+v", got)
	}
	if got := dst.RGBAAt(1, 0); got.R < 200 || got.A < 200 {
		t.Fatalf("red crosshair should remain opaque, got %+v", got)
	}
	if got := dst.RGBAAt(0, 1); got.A < 200 {
		t.Fatalf("grey ring should remain opaque, got %+v", got)
	}
}

func TestEmbeddedTargetPNG(t *testing.T) {
	img, err := decodeTargetRGBA(targetPNG, 32)
	if err != nil {
		t.Fatal(err)
	}
	if img.Bounds().Dx() != 32 || img.Bounds().Dy() != 32 {
		t.Fatalf("expected 32x32, got %v", img.Bounds())
	}
	center := img.RGBAAt(16, 16)
	if center.A == 0 {
		t.Fatalf("center of target icon should not be empty, got %+v", center)
	}
}
