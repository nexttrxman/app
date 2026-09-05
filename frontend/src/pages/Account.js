import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, resolveImage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { Wallet, Plus, History, ArrowDownRight, ArrowUpRight, Loader2, Lock } from "lucide-react";

export default function Account() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [txs, setTxs] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const loadTx = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data } = await api.get("/wallet/transactions");
      setTxs(data);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadTx();
  }, [user, loadTx]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-[#00ff9d]" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-5 py-32 text-center min-h-[60vh]">
        <Lock size={40} className="mx-auto text-[#ff00ff] mb-4" />
        <h1 className="font-display text-2xl font-black mb-2">Inicia sesión</h1>
        <p className="text-zinc-400 mb-6">Accede a tu cuenta para ver tu saldo e historial.</p>
        <Button
          data-testid="account-login-btn"
          onClick={() => setAuthOpen(true)}
          className="bg-[#00ff9d] hover:bg-[#00ff9d] text-black font-bold rounded-full px-6 glow-green"
        >
          Entrar
        </Button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-5 py-14 min-h-[70vh]">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#00e5ff]">Mi Cuenta</span>
      <h1 className="font-display text-4xl font-black tracking-tight mt-2 mb-8">Hola, {user.name} 👋</h1>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl p-8 bg-[#0c0c12] border border-[#00ff9d]/30 glow-green mb-10">
        <div className="absolute inset-0 radial-cyan opacity-40" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm uppercase tracking-widest">
              <Wallet size={16} /> Saldo disponible
            </div>
            <div className="font-display text-6xl font-black text-[#00ff9d] text-glow-green mt-3" data-testid="account-balance">
              ${user.balance?.toFixed(2)}
            </div>
          </div>
          <Button
            data-testid="account-topup-btn"
            onClick={() => navigate("/cargar-saldo")}
            className="bg-[#00e5ff] hover:bg-[#00e5ff] text-black font-bold rounded-full px-6 h-12 hover:scale-105 transition-transform glow-cyan"
          >
            <Plus size={18} className="mr-1" /> Cargar saldo
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="flex items-center gap-2 mb-5">
        <History size={20} className="text-[#ff00ff]" />
        <h2 className="font-display text-2xl font-bold">Historial de movimientos</h2>
      </div>

      {txLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#00ff9d]" size={28} />
        </div>
      ) : txs.length === 0 ? (
        <p className="text-zinc-500 py-10 text-center">Todavía no tienes movimientos.</p>
      ) : (
        <div className="space-y-3" data-testid="transactions-list">
          {txs.map((t) => {
            const isPurchase = t.type === "purchase";
            return (
              <div
                key={t.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#12121a] border border-white/10 hover:border-white/20 transition-colors"
                data-testid="transaction-row"
              >
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isPurchase ? "rgba(255,0,255,0.12)" : "rgba(0,255,157,0.12)" }}
                >
                  {isPurchase ? (
                    <ArrowUpRight size={20} className="text-[#ff00ff]" />
                  ) : (
                    <ArrowDownRight size={20} className="text-[#00ff9d]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{t.description}</div>
                  <div className="text-xs text-zinc-500">
                    {new Date(t.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <div
                  className="font-display font-bold text-lg shrink-0"
                  style={{ color: isPurchase ? "#ff00ff" : "#00ff9d" }}
                >
                  {isPurchase ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
