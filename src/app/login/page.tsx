import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] px-4">
      <div className="w-full max-w-[420px] anim-popin">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-11 h-11 rounded-[10px] bg-[#1d1d1f] flex items-center justify-center font-mono font-semibold text-[17px] text-white tracking-[-0.5px]">
            AS
          </div>
          <div>
            <div className="font-semibold text-[17px] tracking-[-0.2px]">AS Performance</div>
            <div className="text-[12px] text-[#6e6e73] tracking-[0.3px]">Werkstatt-Verwaltung</div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e5e7] rounded-[14px] p-7 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
          <h1 className="text-[19px] font-bold tracking-[-0.3px] mb-1.5">Anmelden</h1>
          <p className="text-[13.5px] text-[#6e6e73] mb-5 leading-relaxed">
            Gib deine E-Mail-Adresse ein — du bekommst einen Code zugeschickt.
            Kein Passwort nötig.
          </p>

          {error === "link" && (
            <div className="mb-4 rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
              Der Anmelde-Link hat nicht funktioniert. Das liegt meistens daran, dass
              die Mail-App den Link in einem anderen Browser öffnet als dem, in dem du
              ihn angefordert hast. Fordere unten einfach eine neue E-Mail an und tippe
              den <strong>Code</strong> aus der Mail ein — der funktioniert immer.
            </div>
          )}

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-[12px] text-[#86868b] mt-5">
          Zugang nur für freigeschaltete Mitarbeiter.
        </p>
      </div>
    </div>
  );
}
