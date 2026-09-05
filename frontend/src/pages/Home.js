import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import AuthDialog from "@/components/AuthDialog";
import { useBuy, useProducts } from "@/hooks/useShop";
import { useAuth } from "@/context/AuthContext";
import {
  Heart, Wallet, ShieldCheck, Zap, ArrowRight, TrendingUp, UserPlus, Eye,
  Instagram, Youtube, Music2, Sparkles, CreditCard, ShoppingBag,
} from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1712431922265-cc87f466a63b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHw0fHx3b21hbiUyMHBvcnRyYWl0JTIwcGluayUyMG5lb24lMjBsaWdodCUyMHBob25lfGVufDB8fHx8MTc4ODYxMjg2NHww&ixlib=rb-4.1.0&q=85";
const CREATOR_IMG =
  "https://images.unsplash.com/photo-1681552303458-9ae08ae3a283?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwcGluayUyMG5lb24lMjBsaWdodCUyMHBob25lfGVufDB8fHx8MTc4ODYxMjg2NHww&ixlib=rb-4.1.0&q=85";

const badges = [
  { icon: Heart, label: "+1.240 likes", color: "#ff3dbe", pos: "top-[8%] -left-6 sm:-left-10", delay: 0 },
  { icon: UserPlus, label: "+380 seguidores", color: "#9b5cff", pos: "top-[38%] -left-4 sm:-left-12", delay: 0.6 },
  { icon: Eye, label: "24.5k views", color: "#2ee6ff", pos: "bottom-[26%] -right-4 sm:-right-10", delay: 1.2 },
  { icon: TrendingUp, label: "En tendencia", color: "#ff8de0", pos: "top-[14%] -right-3 sm:-right-8", delay: 1.8 },
];

const steps = [
  { icon: CreditCard, title: "Carga tu saldo", text: "Elige monto y método. Se acredita al instante en tu billetera.", color: "#2ee6ff" },
  { icon: ShoppingBag, title: "Elige tu paquete", text: "Seguidores, likes, views o suscriptores. Filtra por red social.", color: "#ff3dbe" },
  { icon: Zap, title: "Recibe el impulso", text: "Se descuenta del saldo y arranca el crecimiento. Sin fricción.", color: "#9b5cff" },
];

const platforms = [
  { icon: Instagram, label: "Instagram", color: "#ff3dbe" },
  { icon: Music2, label: "TikTok", color: "#2ee6ff" },
  { icon: Youtube, label: "YouTube", color: "#ff5f6d" },
  { icon: Sparkles, label: "Combos", color: "#9b5cff" },
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
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden grain" data-testid="hero-section">
        <div className="absolute inset-0 aurora-fuchsia" />
        <div className="absolute inset-0 aurora-violet" />
        <div className="absolute inset-0 hairline-grid opacity-70" />

        <div className="relative max-w-[1220px] mx-auto px-5 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-16 lg:gap-10 items-center">
          {/* copy */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass eyebrow text-[#ff8de0] fade-up">
              <Zap size={13} /> Marketplace de crecimiento social
            </span>

            <h1
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.02] mt-7 fade-up"
              style={{ animationDelay: "80ms" }}
            >
              Tus redes,
              <br />
              <span className="text-shine">en modo turbo</span>
            </h1>

            <p
              className="text-base text-[#a49cbd] mt-6 max-w-lg leading-relaxed fade-up"
              style={{ animationDelay: "160ms" }}
            >
              Compra seguidores, likes, views y suscriptores con tu billetera interna.
              Cargás una vez y comprás en dos clics — sin tarjetas, sin esperas.
            </p>

            <div className="flex flex-wrap gap-3 mt-9 fade-up" style={{ animationDelay: "240ms" }}>
              <Button
                data-testid="hero-cta-products"
                onClick={() => navigate("/productos")}
                className="rounded-full h-12 px-7 text-[15px] font-semibold text-[#0a0512] bg-[#ff3dbe] hover:bg-[#ff65cc] transition-colors duration-200 shadow-[0_16px_44px_-14px_rgba(255,61,190,0.95)]"
              >
                Ver paquetes <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                data-testid="hero-cta-topup"
                onClick={() => (user ? navigate("/cargar-saldo") : setAuthOpen(true))}
                variant="outline"
                className="rounded-full h-12 px-7 text-[15px] font-semibold bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white hover:border-[#2ee6ff]/50 transition-colors duration-200"
              >
                <Wallet size={18} className="mr-2 text-[#2ee6ff]" /> Cargar saldo
              </Button>
            </div>

            <div
              className="grid grid-cols-3 gap-4 mt-14 max-w-md fade-up"
              style={{ animationDelay: "320ms" }}
              data-testid="hero-stats"
            >
              {[
                { n: "12k+", l: "Pedidos entregados" },
                { n: "2 clics", l: "Para comprar" },
                { n: "24/7", l: "Soporte activo" },
              ].map((s) => (
                <div key={s.l} className="border-l border-white/10 pl-4">
                  <div className="font-display text-xl font-extrabold text-white">{s.n}</div>
                  <div className="text-xs text-[#a49cbd] mt-1 leading-snug">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* real photo */}
          <div className="relative lg:pl-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-[28px] overflow-hidden border border-white/10 shadow-[0_40px_120px_-40px_rgba(255,61,190,0.6)]"
            >
              <img
                src={HERO_IMG}
                alt="Creadora de contenido usando su celular con luces neón"
                className="w-full h-[440px] sm:h-[540px] object-cover object-center"
                data-testid="hero-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07030f] via-[#07030f]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="glass rounded-2xl p-4 flex items-center gap-3" data-testid="hero-live-card">
                  <img
                    src={CREATOR_IMG}
                    alt="Creadora INFLOW"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-[#ff3dbe]/70 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">@sofi.creator</div>
                    <div className="text-xs text-[#a49cbd]">Compró Pack Growth Pro · hace 2 min</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-[#2ee6ff] shrink-0">
                    <TrendingUp size={16} />
                    <span className="font-display text-sm font-bold">+18%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* floating social popups */}
            {badges.map((b) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: [0, -10, 0] }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.5 + b.delay },
                  y: { repeat: Infinity, duration: 4.4, ease: "easeInOut", delay: b.delay },
                }}
                className={`absolute ${b.pos} hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl glass`}
                style={{ borderColor: `${b.color}55`, boxShadow: `0 12px 34px -14px ${b.color}` }}
                data-testid={`hero-badge-${b.label}`}
              >
                <b.icon size={15} style={{ color: b.color }} />
                <span className="text-xs font-semibold text-white whitespace-nowrap">{b.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* platform strip */}
        <div className="relative border-y border-white/[0.07] bg-[#0b0617]">
          <div className="max-w-[1220px] mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-6">
            <span className="eyebrow text-[#6f6690]">Impulsamos</span>
            {platforms.map((p) => (
              <div key={p.label} className="flex items-center gap-2.5">
                <p.icon size={18} style={{ color: p.color }} />
                <span className="text-sm font-semibold text-[#d7d1e8]">{p.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm text-[#a49cbd]">
              <ShieldCheck size={16} className="text-[#2ee6ff]" /> Pagos protegidos
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURED ---------------- */}
      <section className="max-w-[1220px] mx-auto px-5 py-20 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <span className="eyebrow text-[#2ee6ff]">Destacados</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-3">Paquetes más comprados</h2>
          </div>
          <Button
            data-testid="featured-see-all"
            onClick={() => navigate("/productos")}
            variant="ghost"
            className="rounded-full text-[#ff3dbe] hover:text-[#ff65cc] hover:bg-[#ff3dbe]/10 transition-colors"
          >
            Ver catálogo completo <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="featured-grid">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} onBuy={buy} index={i} />
          ))}
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="relative overflow-hidden border-y border-white/[0.07] bg-[#0b0617]" data-testid="how-it-works">
        <div className="absolute inset-0 aurora-cyan" />
        <div className="relative max-w-[1220px] mx-auto px-5 py-20 lg:py-24 grid lg:grid-cols-[0.9fr_1.1fr] gap-14">
          <div>
            <span className="eyebrow text-[#9b5cff]">Cómo funciona</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-3 max-w-sm">
              Tres pasos y tu perfil despega
            </h2>
            <p className="text-base text-[#a49cbd] mt-5 max-w-sm leading-relaxed">
              Nada de carritos eternos ni formularios. Tu saldo vive en INFLOW y cada compra
              se descuenta al instante.
            </p>
            <Button
              data-testid="how-cta"
              onClick={() => (user ? navigate("/cargar-saldo") : setAuthOpen(true))}
              className="mt-8 rounded-full h-11 px-6 font-semibold text-[#0a0512] bg-[#2ee6ff] hover:bg-[#66eeff] transition-colors duration-200"
            >
              Empezar ahora
            </Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="panel rounded-2xl p-6 hover:-translate-y-1.5 hover:border-white/20 transition-[transform,border-color] duration-300"
                data-testid={`step-card-${i}`}
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}1f`, border: `1px solid ${s.color}44` }}
                >
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div className="font-display text-xs font-bold mt-6" style={{ color: s.color }}>
                  0{i + 1}
                </div>
                <h3 className="font-display text-base font-bold mt-2 text-white">{s.title}</h3>
                <p className="text-sm text-[#a49cbd] mt-2.5 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </main>
  );
}
