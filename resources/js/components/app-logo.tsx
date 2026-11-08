export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-md shadow-indigo-600/30">
                M
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-sm leading-tight font-bold text-sidebar-foreground">
                    Meer<span className="text-indigo-400">Transport</span>
                </span>
                <span className="truncate text-[10px] leading-tight font-semibold tracking-wider text-slate-400 uppercase">
                    Truck Transportation
                </span>
            </div>
        </>
    );
}
