import { type HTMLAttributes } from "react"; // https://icon-sets.iconify.design/?query=group&search-page=5 glyphs--layer-group-duo
import { classNames } from "@renderer/utils";

export function IconControlGroup({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("1fill-none text-sky-600 fill-sky-500/50", className)} viewBox="0 0 80 80" {...rest}>
            {title && <title>{title}</title>}
            <path
                className="fill-current/25"
                d="M40.788 16.338a2 2 0 0 0-1.576 0L16.29 26.162c-1.616.692-1.616 2.984 0 3.676l22.923 9.824a2 2 0 0 0 1.576 0l22.923-9.824c1.616-.692 1.616-2.984 0-3.676z"
            />
            <path
                className="fill-current/25"
                d="m24.199 33.772l-7.91 3.39c-1.616.692-1.616 2.984 0 3.676l22.923 9.824a2 2 0 0 0 1.576 0l22.923-9.824c1.616-.692 1.616-2.984 0-3.676l-7.91-3.39l-14.816 6.35a2.5 2.5 0 0 1-1.97 0z"
            />
            <path
                className="fill-current/25"
                d="m24.199 44.772l-7.91 3.39c-1.616.692-1.616 2.984 0 3.676l22.923 9.824a2 2 0 0 0 1.576 0l22.923-9.824c1.616-.692 1.616-2.984 0-3.676l-7.91-3.39l-14.816 6.35a2.5 2.5 0 0 1-1.97 0z"
            />
            <path
                className="stroke-current stroke-1" strokeLinecap="round" strokeLinejoin="round"
                d="M40.788 16.338a2 2 0 0 0-1.576 0L16.29 26.162c-1.616.692-1.616 2.984 0 3.676l22.923 9.824a2 2 0 0 0 1.576 0l22.923-9.824c1.616-.692 1.616-2.984 0-3.676z"
            />
            <path
                className="stroke-current stroke-1" strokeLinecap="round" strokeLinejoin="round"
                d="m24.199 33.772l-7.91 3.39c-1.616.692-1.616 2.984 0 3.676l22.923 9.824a2 2 0 0 0 1.576 0l22.923-9.824c1.616-.692 1.616-2.984 0-3.676l-7.91-3.39l-14.816 6.35a2.5 2.5 0 0 1-1.97 0z"
            />
            <path
                className="stroke-current stroke-1" strokeLinecap="round" strokeLinejoin="round"
                d="m24.199 44.772l-7.91 3.39c-1.616.692-1.616 2.984 0 3.676l22.923 9.824a2 2 0 0 0 1.576 0l22.923-9.824c1.616-.692 1.616-2.984 0-3.676l-7.91-3.39l-14.816 6.35a2.5 2.5 0 0 1-1.97 0z"
            />
        </svg>
    );
}
