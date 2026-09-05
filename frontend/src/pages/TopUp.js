import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/AuthDialog";
import { toast } from "sonner";
import { CreditCard, QrCode, Landmark, Wallet, Loader2, Lock, Check, ShieldCheck, TicketPercent, X } from "lucide-react";

const methods = [
  { id: "card", label: "Tarjeta", icon: CreditCard, color: "#ff3dbe" },
  { id: "qr", label: "QR", icon: QrCode, color: "#2ee6ff" },
  { id: "transfer", label: "Transferencia", icon: Landmark, color: "#9b5cff" },
];
const quick = [25, 50, 100, 250];

export default function TopUp() {
  const { user, setBalance } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [checking, setChecking] = useState(false);

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const { data } = await api.get("/coupons/validate", { params: { code: code.trim(), scope: "topup" } });
      setCoupon(data);
      toast.success(`Cupón ${data.code} aplicado (+${data.percent}% de saldo extra)`);
    } catch (err) {
      setCoupon(null);
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/wallet/topup", {
        amount: val,
        method,
        coupon_code: coupon ? coupon.code : null,
      });
      setBalance(data.balance);
      toast.success("¡Saldo cargado!", {
        description: data.bonus
          ? `Bono de $${data.bonus.toFixed(2)} incluido · nuevo saldo: $${data.balance.toFixed(2)}`
          : `Nuevo saldo: $${data.balance.toFixed(2)}`,
      });
      setAmount("");
      setCoupon(null);
      setCode("");
      setTimeout(() => navigate("/mi-cuenta"), 700);
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-5 py-32 min-h-[60vh]">
        <div className="panel rounded-[24px] p-8 text-center">
          <span className="h-12 w-12 rounded-2xl bg-[#9b5cff]/15 border border-[#9b5cff]/40 flex items-center justify-center mx-auto">
            <Lock size={20} className="text-[#9b5cff]" />
          </span>
          <h1 className="font-display text-xl font-extrabold mt-6">Inicia sesión</h1>
          <p className="text-base text-[#a49cbd] mt-3">Necesitas una cuenta para cargar saldo.</p>
          <Button
            data-testid="topup-login-btn"
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

  return (
    <main className="relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-x-0 top-0 h-[380px] aurora-cyan" />
      <div className="relative max-w-[720px] mx-auto px-5 py-16 lg:py-20">
        <span className="eyebrow text-[#2ee6ff]">Billetera</span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tighter mt-4">Cargar saldo</h1>
        <p className="text-base text-[#a49cbd] mt-4 flex items-center gap-2">
          <Wallet size={16} className="text-[#ff3dbe]" /> Saldo actual:
          <span className="font-display font-bold text-white">${user.balance?.toFixed(2)}</span>
        </p>

        <div className="panel rounded-[26px] p-6 sm:p-8 mt-10">
          <label className="eyebrow text-[#6f6690]">Método de pago</label>
          <div className="grid grid-cols-3 gap-3 mt-4 mb-8">
            {methods.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  data-testid={`method-${m.id}`}
                  onClick={() => setMethod(m.id)}
                  className={`relative p-5 rounded-2xl border flex flex-col items-center gap-2.5 transition-colors duration-200 ${
                    active ? "bg-white/[0.06]" : "border-white/10 hover:border-white/25"
                  }`}
                  style={active ? { borderColor: m.color, boxShadow: `0 10px 30px -14px ${m.color}` } : undefined}
                >
                  {active && <Check size={13} className="absolute top-2.5 right-2.5" style={{ color: m.color }} />}
                  <m.icon size={21} style={{ color: m.color }} />
                  <span className="text-sm font-semibold text-white">{m.label}</span>
                </button>
              );
            })}
          </div>

          <label className="eyebrow text-[#6f6690]">Monto</label>
          <div className="grid grid-cols-4 gap-3 mt-4 mb-4">
            {quick.map((q) => (
              <button
                key={q}
                data-testid={`quick-${q}`}
                onClick={() => setAmount(String(q))}
                className={`py-3 rounded-xl border font-display text-sm font-bold transition-colors duration-200 ${
                  amount === String(q)
                    ? "border-[#ff3dbe] text-[#ff3dbe] bg-[#ff3dbe]/10"
                    : "border-white/10 text-[#d7d1e8] hover:border-white/30"
                }`}
              >
                ${q}
              </button>
            ))}
          </div>

          <div className="relative mb-7">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-base text-[#6f6690]">$</span>
            <Input
              data-testid="topup-amount-input"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Otro monto"
              className="h-12 pl-10 rounded-xl bg-[#0b0617] border-white/10 text-white font-display text-base placeholder:text-[#6f6690] placeholder:font-sans focus-visible:ring-1 focus-visible:ring-[#ff3dbe] focus-visible:border-[#ff3dbe]/60"
            />
          </div>

          <label className="eyebrow text-[#6f6690] flex items-center gap-1.5">
            <TicketPercent size={13} /> Cupón (opcional)
          </label>
          <div className="flex gap-2 mt-3 mb-7">
            <Input
              data-testid="topup-coupon-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EJ: BIENVENIDA10"
              disabled={!!coupon}
              className="h-12 rounded-xl bg-[#0b0617] border-white/10 text-white placeholder:text-[#6f6690] focus-visible:ring-1 focus-visible:ring-[#ff3dbe] focus-visible:border-[#ff3dbe]/60"
            />
            {coupon ? (
              <Button
                data-testid="topup-coupon-remove-btn"
                onClick={() => { setCoupon(null); setCode(""); }}
                variant="outline"
                className="h-12 px-4 rounded-xl bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </Button>
            ) : (
              <Button
                data-testid="topup-coupon-apply-btn"
                onClick={applyCoupon}
                disabled={checking}
                variant="outline"
                className="h-12 px-5 rounded-xl bg-transparent border-[#2ee6ff]/40 text-[#2ee6ff] hover:bg-[#2ee6ff]/10 hover:text-[#2ee6ff]"
              >
                {checking ? <Loader2 className="animate-spin" size={16} /> : "Aplicar"}
              </Button>
            )}
          </div>

          {coupon && amount > 0 && (
            <div className="panel rounded-2xl p-5 mb-7 space-y-2" data-testid="topup-bonus-summary">
              <div className="flex justify-between text-sm">
                <span className="text-[#a49cbd]">Cargas</span>
                <span className="text-white">${parseFloat(amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#a49cbd]">Bono {coupon.code} (+{coupon.percent}%)</span>
                <span className="text-[#2ee6ff]">
                  +${((parseFloat(amount || 0) * coupon.percent) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-end pt-2.5 border-t border-white/[0.07]">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690]">Recibes</span>
                <span className="font-display text-xl font-extrabold text-white">
                  ${(parseFloat(amount || 0) * (1 + coupon.percent / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button
            data-testid="topup-submit-btn"
            onClick={submit}
            disabled={busy}
            className="w-full h-12 rounded-full font-semibold text-[#0a0512] bg-[#ff3dbe] hover:bg-[#ff65cc] transition-colors duration-200 shadow-[0_16px_44px_-16px_rgba(255,61,190,0.95)]"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : "Cargar saldo"}
          </Button>
          <p className="text-xs text-[#6f6690] text-center mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} /> Pasarela simulada · el saldo se acredita al instante
          </p>
        </div>
      </div>
    </main>
  );
}
