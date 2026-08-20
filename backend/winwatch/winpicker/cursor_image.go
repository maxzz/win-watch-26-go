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

func decodePNGNative(pngBytes []byte) (*image.RGBA, error) {
	src, err := png.Decode(bytes.NewReader(pngBytes))
	if err != nil {
		return nil, err
	}
	b := src.Bounds()
	size := b.Dx()
	if b.Dy() > size {
		size = b.Dy()
	}
	return scaleRGBA(src, size), nil
}

func scaleAndPunchBlack(src image.Image, size int) *image.RGBA {
	dst := scaleRGBA(src, size)
	punchNearBlack(dst)
	return dst
}

func punchNearBlack(img *image.RGBA) {
	if img == nil {
		return
	}
	b := img.Bounds()
	for y := b.Min.Y; y < b.Max.Y; y++ {
		for x := b.Min.X; x < b.Max.X; x++ {
			c := img.RGBAAt(x, y)
			if c.R < blackPunchMax && c.G < blackPunchMax && c.B < blackPunchMax {
				c.A = 0
				img.SetRGBA(x, y, c)
			}
		}
	}
}

// scaleRGBA resizes src to a square RGBA image, preserving partial alpha.
func scaleRGBA(src image.Image, size int) *image.RGBA {
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
			dst.SetRGBA(x, y, color.RGBA{
				R: uint8(r >> 8),
				G: uint8(g >> 8),
				B: uint8(bl >> 8),
				A: uint8(a >> 8),
			})
		}
	}
	return dst
}
