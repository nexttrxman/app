import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { Wallet, Plus, History, ArrowDownLeft, ArrowUpRight, Loader2, Lock, ShoppingBag } from "lucide-react";

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
          <p className="text-base text-[#a49cbd] mt-3">Accede a tu cuenta para ver tu saldo e historial.</p>
          <Button
            data-testid="account-login-btn"
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

  const purchases = txs.filter((t) => t.type === "purchase").length;
  const loaded = txs.filter((t) => t.type !== "purchase").reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <main className="relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-x-0 top-0 h-[380px] aurora-violet" />
      <div className="relative max-w-[1000px] mx-auto px-5 py-16 lg:py-20">
        <span className="eyebrow text-[#2ee6ff]">Mi cuenta</span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tighter mt-4">
          Hola, {user.name}
        </h1>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 mt-10">
          {/* Balance */}
          <div className="relative overflow-hidden rounded-[26px] panel p-8 grain">
            <div className="absolute inset-0 aurora-fuchsia" />
            <div className="relative">
              <div className="flex items-center gap-2 eyebrow text-[#a49cbd]">
                <Wallet size={14} /> Saldo disponible
              </div>
              <div
                className="font-display text-5xl sm:text-6xl font-extrabold tracking-tighter mt-5 text-shine"
                data-testid="account-balance"
              >
                ${user.balance?.toFixed(2)}
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <Button
                  data-testid="account-topup-btn"
                  onClick={() => navigate("/cargar-saldo")}
                  className="rounded-full h-11 px-6 font-semibold text-[#0a0512] bg-[#2ee6ff] hover:bg-[#66eeff] transition-colors"
                >
                  <Plus size={17} className="mr-1.5" /> Cargar saldo
                </Button>
                <Button
                  data-testid="account-shop-btn"
                  onClick={() => navigate("/productos")}
                  variant="outline"
                  className="rounded-full h-11 px-6 font-semibold bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white transition-colors"
                >
                  <ShoppingBag size={16} className="mr-2" /> Comprar
                </Button>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <div className="panel rounded-[22px] p-6" data-testid="stat-purchases">
              <div className="eyebrow text-[#6f6690]">Compras</div>
              <div className="font-display text-3xl font-extrabold mt-3 text-white">{purchases}</div>
            </div>
            <div className="panel rounded-[22px] p-6" data-testid="stat-loaded">
              <div className="eyebrow text-[#6f6690]">Total cargado</div>
              <div className="font-display text-3xl font-extrabold mt-3 text-[#2ee6ff]">${loaded.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="flex items-center gap-2.5 mt-16 mb-6">
          <History size={18} className="text-[#ff3dbe]" />
          <h2 className="font-display text-lg font-bold">Historial de movimientos</h2>
        </div>

        {txLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#ff3dbe]" size={26} />
          </div>
        ) : txs.length === 0 ? (
          <div className="panel rounded-[22px] p-10 text-center text-[#6f6690]" data-testid="no-transactions">
            Todavía no tienes movimientos.
          </div>
        ) : (
          <div className="panel rounded-[22px] divide-y divide-white/[0.06] overflow-hidden" data-testid="transactions-list">
            {txs.map((t) => {
              const isPurchase = t.type === "purchase";
              const color = isPurchase ? "#ff3dbe" : "#2ee6ff";
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors"
                  data-testid="transaction-row"
                >
                  <span
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}1f`, border: `1px solid ${color}44` }}
                  >
                    {isPurchase ? (
                      <ArrowUpRight size={18} style={{ color }} />
                    ) : (
                      <ArrowDownLeft size={18} style={{ color }} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{t.description}</div>
                    <div className="text-xs text-[#6f6690] mt-0.5">
                      {new Date(t.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                  <div className="font-display text-base font-extrabold shrink-0" style={{ color }}>
                    {isPurchase ? "−" : "+"}${Math.abs(t.amount).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
