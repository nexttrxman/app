import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import AuthDialog from "@/components/AuthDialog";
import { useBuy, useProducts } from "@/hooks/useShop";
import { useAuth } from "@/context/AuthContext";
import { Heart, Wallet, ShieldCheck, Zap, ArrowRight, TrendingUp, UserPlus, Eye } from "lucide-react";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/ce30d6e2-6f83-4e6d-b2ea-2fc78a374f63/images/75cd8cde48c8688650772de707177fdb4df8000317b31b19df495d1c343ec436.jpeg";

const bubbles = [
  { icon: Heart, label: "+1.2k likes", c: "#ff2ec4", top: "18%", left: "56%", delay: "0s" },
  { icon: UserPlus, label: "+340 seguidores", c: "#b026ff", top: "34%", left: "72%", delay: "1.2s" },
  { icon: Eye, label: "10k views", c: "#00e5ff", top: "12%", left: "80%", delay: "2.4s" },
  { icon: TrendingUp, label: "Trending", c: "#ff4fd8", top: "48%", left: "62%", delay: "3.1s" },
  { icon: Heart, label: "+890 likes", c: "#ff2ec4", top: "60%", left: "78%", delay: "1.8s" },
];

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
      <section className="relative overflow-hidden min-h-[86vh] flex items-center">
        <img src={HERO_IMG} alt="Crece en redes sociales" className="absolute inset-0 w-full h-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07030d] via-[#07030d]/85 to-[#07030d]/20" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 radial-purple" />

        {/* floating social popups */}
        {bubbles.map((b, i) => (
          <div
            key={i}
            className="hidden md:flex absolute items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur border rise"
            style={{ top: b.top, left: b.left, borderColor: b.c, boxShadow: `0 0 18px ${b.c}66`, animationDelay: b.delay }}
          >
            <b.icon size={15} style={{ color: b.c }} />
            <span className="text-xs font-bold text-white whitespace-nowrap">{b.label}</span>
          </div>
        ))}

        <div className="relative max-w-7xl mx-auto px-5 py-24 w-full">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ff2ec4]/40 bg-[#ff2ec4]/10 text-[#ff4fd8] text-xs font-bold uppercase tracking-widest floaty">
              <Zap size={14} /> Marketplace de crecimiento social
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mt-6">
              Compra fácil,
              <br />
              <span className="text-[#ff2ec4] text-glow-pink">saldo al instante</span>
            </h1>
            <p className="text-lg text-zinc-300 mt-6 max-w-xl leading-relaxed">
              Impulsa tus redes con seguidores, likes y views. Carga tu billetera una vez y compra en
              1–2 clics. Rápido, futurista y confiable.
            </p>
            <div className="flex flex-wrap gap-4 mt-9">
              <Button
                data-testid="hero-cta-products"
                onClick={() => navigate("/productos")}
                className="bg-[#ff2ec4] hover:bg-[#ff2ec4] text-white font-bold rounded-full px-7 h-12 text-base hover:scale-105 transition-transform glow-pink"
              >
                Ver productos <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                data-testid="hero-cta-topup"
                onClick={() => (user ? navigate("/cargar-saldo") : setAuthOpen(true))}
                variant="outline"
                className="rounded-full px-7 h-12 text-base border-[#00e5ff]/50 bg-transparent text-[#00e5ff] hover:bg-[#00e5ff]/10 hover:text-[#00e5ff] hover:scale-105 transition-transform"
              >
                <Wallet size={18} className="mr-2" /> Cargar saldo
              </Button>
            </div>
            <div className="flex flex-wrap gap-8 mt-14">
              {[
                { icon: Zap, label: "Compra en 2 clics", c: "#ff2ec4" },
                { icon: TrendingUp, label: "Resultados al instante", c: "#00e5ff" },
                { icon: ShieldCheck, label: "100% seguro", c: "#b026ff" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-zinc-200">
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
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight mt-2">Paquetes populares</h2>
          </div>
          <Button
            onClick={() => navigate("/productos")}
            variant="ghost"
            className="text-[#ff2ec4] hover:text-[#ff2ec4] hover:bg-transparent hidden sm:flex"
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
