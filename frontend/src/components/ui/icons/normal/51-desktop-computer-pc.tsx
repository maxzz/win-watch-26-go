import { type HTMLAttributes, type SVGAttributes } from "react"; // https://icon-sets.iconify.design/?query=desktop&search-page=10 streamline-ultimate-color:desktop-computer-pc
import { classNames } from "@renderer/utils";

export function IconDesktopComputerPc({ className, title, ...rest }: SVGAttributes<SVGSVGElement> & HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            <path fill="#e3e3e3" d="M22.043 2.913h-7.652a.956.956 0 0 0-.956.956v16.262c0 .528.428.956.956.956h7.652a.957.957 0 0 0 .957-.956V3.869a.957.957 0 0 0-.957-.956" />
            <path fill="#fff" d="M23 4.826v-.957a.957.957 0 0 0-.957-.956h-7.652a.957.957 0 0 0-.956.956v.957z" />
            <path fill="#66e1ff" d="M13.435 7.696H1.957A.957.957 0 0 0 1 8.652v8.609c0 .528.428.956.957.956h11.478a.956.956 0 0 0 .956-.956V8.652a.956.956 0 0 0-.956-.956" />
            <path fill="#c2f3ff" d="M1.957 18.217h.478L12.957 7.696h-11A.957.957 0 0 0 1 8.652v8.609a.957.957 0 0 0 .957.956" />
            <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13.435 7.696H1.957A.957.957 0 0 0 1 8.652v8.609c0 .528.428.956.957.956h11.478a.956.956 0 0 0 .956-.956V8.652a.956.956 0 0 0-.956-.956m-5.74 10.521v2.87m-2.873 0h5.739" />
            <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13.435 5.783V3.869a.957.957 0 0 1 .956-.956h7.652a.957.957 0 0 1 .957.956v16.262a.957.957 0 0 1-.957.956h-7.652a.957.957 0 0 1-.956-.956M23 6.739h-6.696M23 9.609h-6.696" />
            <path fill="#808080" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M18.218 17.26a1.435 1.435 0 1 0 0-2.869a1.435 1.435 0 0 0 0 2.87" />
        </svg>
    );
}
