import { SearchBox } from "@/components/SearchBox";

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

      {searchAction && <SearchBox basePath={searchAction} defaultValue={search} />}

      {children}
    </header>
  );
}
