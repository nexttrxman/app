import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { toast } from "sonner";
import {
  Users, Gift, Percent, Copy, Check, Loader2, Lock, Share2, MessageCircle, Instagram, Twitter,
} from "lucide-react";

export default function Referrals() {
  const { user, loading } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.get("/referrals/me");
      setData(res.data);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-[#ff3dbe]" size={30} />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-5 py-32 min-h-[60vh]">
        <div className="panel rounded-[24px] p-8 text-center">
          <span className="h-12 w-12 rounded-2xl bg-[#9b5cff]/15 border border-[#9b5cff]/40 flex items-center justify-center mx-auto">
            <Lock size={20} className="text-[#9b5cff]" />
          </span>
          <h1 className="font-display text-xl font-extrabold mt-6">Inicia sesión</h1>
          <p className="text-base text-[#a49cbd] mt-3">Accede para ver tu código de invitación y tus ganancias.</p>
          <Button
            data-testid="referrals-login-btn"
            onClick={() => setAuthOpen(true)}
            className="mt-7 rounded-full h-11 px-7 font-semibold text-[#0a0512] bg-[#ff3dbe] hover:bg-[#ff65cc] transition-colors"
          >
            Entrar
          </Button>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </main>
    );
  }

  const code = data?.code || "";
  const link = `${window.location.origin}/?ref=${code}`;
  const message = `Únete a INFLOW MKT con mi código ${code} y recibe $${data?.welcome_bonus?.toFixed(2) || "0.00"} de saldo gratis: ${link}`;

  const copy = async (value, kind) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(kind);
    toast.success(kind === "code" ? "Código copiado" : "Link copiado");
    setTimeout(() => setCopied(""), 1800);
  };

  const shares = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366", url: `https://wa.me/?text=${encodeURIComponent(message)}` },
    { id: "x", label: "X", icon: Twitter, color: "#e6e2f2", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}` },
  ];

  return (
    <main className="relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-x-0 top-0 h-[400px] aurora-violet" />
      <div className="relative max-w-[1000px] mx-auto px-5 py-16 lg:py-20">
        <span className="eyebrow text-[#ff8de0]">Programa de referidos</span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tighter mt-4 max-w-lg leading-[1.1]">
          Invita y gana <span className="text-shine">saldo real</span>
        </h1>
        <p className="text-base text-[#a49cbd] mt-5 max-w-lg leading-relaxed">
          Tu amigo arranca con ${data?.welcome_bonus?.toFixed(2) || "0.00"} de saldo y tú ganas el{" "}
          {data?.commission_percent || 0}% de cada compra que haga. Para siempre.
        </p>

        {busy ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-[#ff3dbe]" size={28} />
          </div>
        ) : (
          <>
            {/* Code + share */}
            <div className="grid lg:grid-cols-[1.25fr_1fr] gap-6 mt-12">
              <div className="relative overflow-hidden panel rounded-[26px] p-7 grain">
                <div className="absolute inset-0 aurora-fuchsia" />
                <div className="relative">
                  <div className="eyebrow text-[#a49cbd] flex items-center gap-2">
                    <Gift size={14} /> Tu código
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <span
                      className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
                      data-testid="referral-code"
                    >
                      {code}
                    </span>
                    <Button
                      data-testid="copy-code-btn"
                      onClick={() => copy(code, "code")}
                      variant="outline"
                      size="sm"
                      className="rounded-full h-9 px-4 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                    >
                      {copied === "code" ? <Check size={14} className="mr-1.5 text-[#2ee6ff]" /> : <Copy size={14} className="mr-1.5" />}
                      Copiar
                    </Button>
                  </div>

                  <div className="mt-7">
                    <div className="eyebrow text-[#6f6690]">Tu link de invitación</div>
                    <div className="flex gap-2 mt-2.5">
                      <div
                        className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-[#0b0617] border border-white/10 text-sm text-[#a49cbd] truncate"
                        data-testid="referral-link"
                      >
                        {link}
                      </div>
                      <Button
                        data-testid="copy-link-btn"
                        onClick={() => copy(link, "link")}
                        className="h-auto px-5 rounded-xl font-semibold text-[#0a0512] bg-[#2ee6ff] hover:bg-[#66eeff] transition-colors"
                      >
                        {copied === "link" ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="eyebrow text-[#6f6690] flex items-center gap-1.5">
                      <Share2 size={13} /> Compartir
                    </div>
                    <div className="flex flex-wrap gap-2.5 mt-3">
                      {shares.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          data-testid={`share-${s.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white hover:border-white/30 transition-colors"
                        >
                          <s.icon size={15} style={{ color: s.color }} /> {s.label}
                        </a>
                      ))}
                      <button
                        data-testid="share-instagram"
                        onClick={() => copy(message, "link")}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white hover:border-white/30 transition-colors"
                      >
                        <Instagram size={15} style={{ color: "#ff3dbe" }} /> Instagram
                      </button>
                    </div>
                    <p className="text-xs text-[#6f6690] mt-3">
                      En Instagram se copia el mensaje para que lo pegues en tu bio o historia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
                <div className="panel rounded-[22px] p-6" data-testid="referral-count">
                  <div className="eyebrow text-[#6f6690] flex items-center gap-2">
                    <Users size={13} /> Invitados
                  </div>
                  <div className="font-display text-3xl font-extrabold mt-3 text-white">{data?.total_referred ?? 0}</div>
                </div>
                <div className="panel rounded-[22px] p-6" data-testid="referral-earnings">
                  <div className="eyebrow text-[#6f6690] flex items-center gap-2">
                    <Percent size={13} /> Ganado
                  </div>
                  <div className="font-display text-3xl font-extrabold mt-3 text-[#2ee6ff]">
                    ${data?.total_earned?.toFixed(2) ?? "0.00"}
                  </div>
                </div>
              </div>
            </div>

            {/* List */}
            <h2 className="font-display text-lg font-bold mt-16 mb-6">Tus invitados</h2>
            {data?.referrals?.length ? (
              <div className="panel rounded-[22px] divide-y divide-white/[0.06] overflow-hidden" data-testid="referrals-list">
                {data.referrals.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4" data-testid="referral-row">
                    <span className="h-10 w-10 rounded-full bg-[#9b5cff]/20 border border-[#9b5cff]/40 flex items-center justify-center font-display text-xs font-extrabold text-[#c4a2ff] shrink-0">
                      {r.name?.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{r.name}</div>
                      <div className="text-xs text-[#6f6690] mt-0.5">
                        {r.joined_at ? new Date(r.joined_at).toLocaleDateString("es-ES", { dateStyle: "medium" }) : ""}
                      </div>
                    </div>
                    <div className="font-display text-base font-extrabold text-[#2ee6ff] shrink-0">
                      +${r.earned.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel rounded-[22px] p-10 text-center text-[#6f6690]" data-testid="no-referrals">
                Todavía no invitaste a nadie. Comparte tu link y empieza a ganar.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
