import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import AuthDialog from "@/components/AuthDialog";
import { useBuy, useProducts } from "@/hooks/useShop";
import { useAuth } from "@/context/AuthContext";
import { Zap, Wallet, ShieldCheck, Rocket, ArrowRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, load } = useProducts();
  const [authOpen, setAuthOpen] = useState(false);
  const buy = useBuy(() => setAuthOpen(true));

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[78vh] flex items-center">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 radial-cyan" />
        <div className="absolute inset-0 radial-magenta" />
        <div className="relative max-w-7xl mx-auto px-5 py-24 w-full">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00ff9d]/30 bg-[#00ff9d]/5 text-[#00ff9d] text-xs font-bold uppercase tracking-widest floaty">
              <Rocket size={14} /> Marketplace con saldo interno
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter leading-none mt-6">
              Compra fácil,
              <br />
              <span className="text-[#00ff9d] text-glow-green">saldo al instante</span>
            </h1>
            <p className="text-lg text-zinc-400 mt-6 max-w-xl leading-relaxed">
              Carga tu billetera una vez y compra en 1–2 clics. Sin fricción, sin tarjetas cada vez.
              Rápido, futurista y confiable.
            </p>
            <div className="flex flex-wrap gap-4 mt-9">
              <Button
                data-testid="hero-cta-products"
                onClick={() => navigate("/productos")}
                className="bg-[#00ff9d] hover:bg-[#00ff9d] text-black font-bold rounded-full px-7 h-12 text-base hover:scale-105 transition-transform glow-green"
              >
                Ver productos <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                data-testid="hero-cta-topup"
                onClick={() => (user ? navigate("/cargar-saldo") : setAuthOpen(true))}
                variant="outline"
                className="rounded-full px-7 h-12 text-base border-[#00e5ff]/40 bg-transparent text-[#00e5ff] hover:bg-[#00e5ff]/10 hover:text-[#00e5ff] hover:scale-105 transition-transform"
              >
                <Wallet size={18} className="mr-2" /> Cargar saldo
              </Button>
            </div>
            <div className="flex flex-wrap gap-8 mt-14">
              {[
                { icon: Zap, label: "Compra en 2 clics", c: "#00ff9d" },
                { icon: Wallet, label: "Saldo al instante", c: "#00e5ff" },
                { icon: ShieldCheck, label: "100% seguro", c: "#ff00ff" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <f.icon size={18} style={{ color: f.c }} />
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-5 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#00e5ff]">Destacados</span>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight mt-2">Productos populares</h2>
          </div>
          <Button
            onClick={() => navigate("/productos")}
            variant="ghost"
            className="text-[#00ff9d] hover:text-[#00ff9d] hover:bg-transparent hidden sm:flex"
          >
            Ver todo <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} onBuy={buy} index={i} />
          ))}
        </div>
      </section>

      <Testimonials />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </main>
  );
}
