import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings, isMember, listDocs } from "@/lib/data";
import { effectiveStatus } from "@/lib/format";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { NoAccess } from "@/components/NoAccess";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const member = await isMember();
  if (!member) {
    return <NoAccess email={user.email ?? ""} />;
  }

  const [settings, docs] = await Promise.all([getSettings(), listDocs()]);

  const overdueCount = docs.filter((d) => effectiveStatus(d) === "overdue").length;

  return (
    <div className="flex h-screen w-full bg-[#fbfbfd] overflow-hidden">
      <Sidebar
        workshopName={settings?.name || "AS Performance"}
        ownerName={settings?.owner_name || ""}
        userEmail={user.email ?? ""}
        overdueCount={overdueCount}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
        <BottomNav overdueCount={overdueCount} />
      </div>
    </div>
  );
}
