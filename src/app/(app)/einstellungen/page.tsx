import { getSessionEmail, getSettings, listMembers } from "@/lib/data";
import { mailConfigured, mailFrom } from "@/lib/mail";
import { Topbar } from "@/components/Topbar";
import { OkBanner } from "@/components/OkBanner";
import { SettingsForm } from "@/components/SettingsForm";
import { LogoCard } from "@/components/LogoCard";
import { ConfirmButton } from "@/components/ConfirmButton";
import { addMemberAction, removeMemberAction } from "./actions";

export default async function EinstellungenPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;
  const [settings, members, sessionEmail] = await Promise.all([
    getSettings(),
    listMembers(),
    getSessionEmail(),
  ]);

  if (!settings) return null;

  const configured = mailConfigured();
  const from = mailFrom();
  const testMode = from.includes("onboarding@resend.dev");

  return (
    <>
      <Topbar title="Einstellungen">
        <div />
      </Topbar>
      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        <div className="max-w-[840px] mx-auto anim-fadein flex flex-col gap-4">
          <OkBanner message={ok} />
          {err && (
            <div className="rounded-[9px] bg-[#fff2f1] border border-[#f3c4c0] px-4 py-3 text-[13px] text-[#c9362b]">
              {err}
            </div>
          )}

          <SettingsForm settings={settings} />

          <LogoCard logoUrl={settings.logo_url ?? ""} />

          <div className="bg-white border border-[#e5e5e7] rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[#ececf0]">
              <div className="text-[16px] font-bold">Zugänge</div>
              <div className="text-[12.5px] text-[#86868b] mt-0.5">
                Diese E-Mail-Adressen dürfen sich per Anmelde-Link ins Cockpit einloggen.
              </div>
            </div>
            <div>
              {members.map((m) => (
                <div
                  key={m.email}
                  className="px-6 py-3 border-b border-[#f0f0f3] flex items-center gap-3"
                >
                  <div className="flex-1 text-[13.5px] font-medium">
                    {m.email}
                    {sessionEmail?.toLowerCase() === m.email.toLowerCase() && (
                      <span className="ml-2 text-[11.5px] text-[#86868b] font-normal">(du)</span>
                    )}
                  </div>
                  {sessionEmail?.toLowerCase() !== m.email.toLowerCase() && (
                    <ConfirmButton
                      label="Entfernen"
                      question="Zugang entfernen?"
                      variant="danger"
                      action={removeMemberAction.bind(null, m.email)}
                    />
                  )}
                </div>
              ))}
            </div>
            <form action={addMemberAction} className="px-6 py-4 flex gap-2.5 bg-[#fafafc]">
              <input
                name="email"
                type="email"
                required
                placeholder="neue@adresse.de"
                className="flex-1 h-10 border border-[#e5e5e7] rounded-lg px-3 text-[14px] outline-none focus:border-[#0071e3] bg-white"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-lg border border-[#e5e5e7] bg-white font-semibold text-[13.5px] cursor-pointer hover:border-[#0071e3] hover:text-[#0071e3]"
              >
                + Freischalten
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5e5e7] rounded-xl px-6 py-5">
            <div className="text-[16px] font-bold mb-1">E-Mail-Versand</div>
            {!configured ? (
              <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                Noch nicht eingerichtet. Sobald in Vercel die Umgebungsvariable{" "}
                <code className="font-mono text-[12px] bg-[#f5f5f7] px-1.5 py-0.5 rounded">
                  RESEND_API_KEY
                </code>{" "}
                hinterlegt ist, kannst du Angebote und Rechnungen direkt aus der App an
                Kunden schicken. Bis dahin: PDF ansehen und von Hand versenden.
              </p>
            ) : testMode ? (
              <p className="text-[13px] text-[#9a6a00] leading-relaxed">
                <strong>Testmodus:</strong> Versand läuft über{" "}
                <code className="font-mono text-[12px] bg-[#f5f5f7] px-1.5 py-0.5 rounded">{from}</code>{" "}
                — Resend stellt so nur an die eigene Konto-Adresse zu. Für echten
                Kundenversand eine Domain bei Resend verifizieren und{" "}
                <code className="font-mono text-[12px] bg-[#f5f5f7] px-1.5 py-0.5 rounded">MAIL_FROM</code>{" "}
                setzen.
              </p>
            ) : (
              <p className="text-[13px] text-[#1d8a4e] leading-relaxed">
                ✓ Aktiv — Belege gehen als <strong>{from}</strong> raus.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
