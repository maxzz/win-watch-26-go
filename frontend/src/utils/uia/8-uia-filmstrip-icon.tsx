import { SVGAttributes } from "react";

export interface UiaFilmstripIconProps extends SVGAttributes<SVGSVGElement> {
    index: number;
    size?: number;
    /**
     * Public URL (recommended) or absolute URL to the filmstrip PNG.
     * Default: "/uia-icons.png" (served from Vite public dir).
     */
    src?: string;
}

/**
 * Renders an icon from the UIA filmstrip.
 * The filmstrip contains 16x16 cells. 
 * This component wraps it in a 24x24 SVG (by default) for consistency.
 */
export function UiaFilmstripIcon({ index, size = 24, src = "/uia-icons.png", className, ...rest }: UiaFilmstripIconProps) {
    const cellSize = 16;
    const padding = (size - cellSize) / 2;
    // Assuming the filmstrip has many icons, we don't strictly need the full width 
    // for the SVG mask/viewBox approach, but it helps for clarity.
    const stripWidth = 1184; // 74 icons * 16px

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            {...rest}
        >
            <svg
                x={padding}
                y={padding}
                width={cellSize}
                height={cellSize}
                viewBox={`${index * cellSize} 0 ${cellSize} ${cellSize}`}
            >
                <image
                    href={src}
                    x="0"
                    y="0"
                    width={stripWidth}
                    height={cellSize}
                    style={{ imageRendering: 'pixelated' }}
                />
            </svg>
        </svg>
    );
}
