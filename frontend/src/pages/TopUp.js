import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/AuthDialog";
import { toast } from "sonner";
import { CreditCard, QrCode, Landmark, Wallet, Loader2, Lock, Check } from "lucide-react";

const methods = [
  { id: "card", label: "Tarjeta", icon: CreditCard, color: "#ff2ec4" },
  { id: "qr", label: "QR", icon: QrCode, color: "#00e5ff" },
  { id: "transfer", label: "Transferencia", icon: Landmark, color: "#ff00ff" },
];
const quick = [25, 50, 100, 250];

export default function TopUp() {
  const { user, setBalance } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const submit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/wallet/topup", { amount: val, method });
      setBalance(data.balance);
      toast.success(`¡Saldo cargado!`, { description: `Nuevo saldo: $${data.balance.toFixed(2)}` });
      setAmount("");
      setTimeout(() => navigate("/mi-cuenta"), 700);
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-5 py-32 text-center min-h-[60vh]">
        <Lock size={40} className="mx-auto text-[#ff00ff] mb-4" />
        <h1 className="font-display text-2xl font-black mb-2">Inicia sesión</h1>
        <p className="text-zinc-400 mb-6">Necesitas una cuenta para cargar saldo.</p>
        <Button onClick={() => setAuthOpen(true)} className="bg-[#ff2ec4] hover:bg-[#ff2ec4] text-black font-bold rounded-full px-6 glow-pink">
          Entrar
        </Button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-14 min-h-[70vh]">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#00e5ff]">Billetera</span>
      <h1 className="font-display text-4xl font-black tracking-tight mt-2 mb-2">Cargar saldo</h1>
      <p className="text-zinc-400 mb-8 flex items-center gap-2">
        <Wallet size={16} className="text-[#ff2ec4]" /> Saldo actual:{" "}
        <span className="text-[#ff2ec4] font-bold">${user.balance?.toFixed(2)}</span>
      </p>

      <div className="rounded-2xl p-6 sm:p-8 bg-[#0c0c12] border border-white/10">
        {/* Method */}
        <label className="text-xs uppercase tracking-widest text-zinc-500">Método de pago</label>
        <div className="grid grid-cols-3 gap-3 mt-3 mb-6">
          {methods.map((m) => (
            <button
              key={m.id}
              data-testid={`method-${m.id}`}
              onClick={() => setMethod(m.id)}
              className={`relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === m.id ? "border-[var(--c)] bg-white/5" : "border-white/10 hover:border-white/20"
              }`}
              style={{ "--c": m.color }}
            >
              {method === m.id && (
                <Check size={14} className="absolute top-2 right-2" style={{ color: m.color }} />
              )}
              <m.icon size={22} style={{ color: m.color }} />
              <span className="text-sm font-semibold text-white">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Quick amounts */}
        <label className="text-xs uppercase tracking-widest text-zinc-500">Monto</label>
        <div className="grid grid-cols-4 gap-3 mt-3 mb-4">
          {quick.map((q) => (
            <button
              key={q}
              data-testid={`quick-${q}`}
              onClick={() => setAmount(String(q))}
              className={`py-2.5 rounded-lg border font-display font-bold transition-all ${
                amount === String(q)
                  ? "border-[#ff2ec4] text-[#ff2ec4] bg-[#ff2ec4]/10"
                  : "border-white/10 text-zinc-300 hover:border-white/30"
              }`}
            >
              ${q}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-display text-lg">$</span>
          <Input
            data-testid="topup-amount-input"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Otro monto"
            className="bg-black/40 border-white/10 text-white h-12 pl-8 text-lg font-display focus-visible:ring-[#ff2ec4]"
          />
        </div>

        <Button
          data-testid="topup-submit-btn"
          onClick={submit}
          disabled={busy}
          className="w-full h-12 bg-[#ff2ec4] hover:bg-[#ff2ec4] text-black font-bold rounded-full text-base hover:scale-[1.02] transition-transform glow-pink"
        >
          {busy ? <Loader2 className="animate-spin" size={18} /> : "Cargar saldo (simulado)"}
        </Button>
        <p className="text-xs text-zinc-600 text-center mt-3">
          Pasarela de pago simulada · el saldo se acredita al instante.
        </p>
      </div>
    </main>
  );
}
