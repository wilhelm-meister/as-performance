import Link from "next/link";

export function Topbar({
  title,
  search,
  searchAction,
  children,
}: {
  title: string;
  search?: string;
  searchAction?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="h-[60px] shrink-0 bg-white border-b border-[#e5e5e7] flex items-center px-4 md:px-7 gap-2.5 md:gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[15px] md:text-[16px] font-semibold tracking-[-0.2px] truncate">
          {title}
        </div>
      </div>

      {searchAction && (
        <form action={searchAction} method="GET" className="relative">
          <svg
            className="absolute left-[11px] top-[9px]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#86868b"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            name="q"
            defaultValue={search ?? ""}
            placeholder="Suchen…"
            className="w-[140px] sm:w-[200px] lg:w-[280px] h-9 border border-[#e5e5e7] rounded-lg pl-[34px] pr-3 bg-[#f5f5f7] text-[13.5px] outline-none focus:border-[#0071e3]"
          />
        </form>
      )}

      {children ?? (
        <Link
          href="/belege/neu?type=quote"
          className="h-9 px-3 md:px-[15px] rounded-lg bg-[#0071e3] text-white font-semibold text-[13.5px] inline-flex items-center gap-[7px] hover:bg-[#0060c9] shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">Neues Angebot</span>
        </Link>
      )}
    </header>
  );
}
