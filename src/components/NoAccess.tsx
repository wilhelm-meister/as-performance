import { signOutAction } from "@/app/(app)/actions";

export function NoAccess({ email }: { email: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] px-4">
      <div className="w-full max-w-[440px] bg-white border border-[#e5e5e7] rounded-[14px] p-7 text-center anim-popin">
        <div className="w-11 h-11 rounded-[10px] bg-[#1d1d1f] flex items-center justify-center font-mono font-semibold text-[17px] text-white mx-auto mb-4">
          AS
        </div>
        <h1 className="text-[18px] font-bold mb-2">Zugang nicht freigeschaltet</h1>
        <p className="text-[13.5px] text-[#6e6e73] leading-relaxed mb-5">
          Du bist als <strong>{email}</strong> angemeldet, aber diese Adresse ist für
          das Cockpit nicht freigeschaltet. Bitte wende dich an den Betriebsinhaber —
          er kann dich unter Einstellungen → Zugänge hinzufügen.
        </p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="h-10 px-5 rounded-[9px] border border-[#e5e5e7] bg-white font-semibold text-[14px] cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3]"
          >
            Abmelden
          </button>
        </form>
      </div>
    </div>
  );
}
