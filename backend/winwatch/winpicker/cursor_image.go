package winpicker

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
)

const blackPunchMax = 24

func decodeTargetRGBA(pngBytes []byte, size int) (*image.RGBA, error) {
	src, err := png.Decode(bytes.NewReader(pngBytes))
	if err != nil {
		return nil, err
	}
	return scaleAndPunchBlack(src, size), nil
}

// scaleAndPunchBlack resizes src to a square RGBA and treats near-black pixels
// as transparent so the PNG's solid background does not show as a cursor box.
func scaleAndPunchBlack(src image.Image, size int) *image.RGBA {
	if size < 1 {
		size = 32
	}
	dst := image.NewRGBA(image.Rect(0, 0, size, size))
	b := src.Bounds()
	sw, sh := b.Dx(), b.Dy()
	if sw < 1 || sh < 1 {
		return dst
	}
	for y := 0; y < size; y++ {
		sy := b.Min.Y + y*sh/size
		for x := 0; x < size; x++ {
			sx := b.Min.X + x*sw/size
			r, g, bl, a := src.At(sx, sy).RGBA()
			r8 := uint8(r >> 8)
			g8 := uint8(g >> 8)
			b8 := uint8(bl >> 8)
			a8 := uint8(a >> 8)
			if r8 < blackPunchMax && g8 < blackPunchMax && b8 < blackPunchMax {
				a8 = 0
			}
			dst.SetRGBA(x, y, color.RGBA{R: r8, G: g8, B: b8, A: a8})
		}
	}
	return dst
}
