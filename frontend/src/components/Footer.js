import { Link } from "react-router-dom";
import { Instagram, Youtube, Music2, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#0b0617]" data-testid="footer">
      <div className="absolute inset-0 aurora-fuchsia opacity-40" />
      <div className="relative max-w-[1220px] mx-auto px-5 py-16 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="font-display text-lg font-extrabold tracking-tight flex items-center gap-2">
            <Zap size={17} className="text-[#ff3dbe]" /> INFLOW<span className="text-shine"> MKT</span>
          </div>
          <p className="text-sm text-[#a49cbd] mt-4 max-w-xs leading-relaxed">
            Marketplace de crecimiento social con billetera interna. Cargá una vez, comprá siempre.
          </p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Music2, Youtube].map((Icon, i) => (
              <span
                key={i}
                className="h-10 w-10 rounded-xl panel flex items-center justify-center text-[#a49cbd] hover:text-[#ff3dbe] hover:border-[#ff3dbe]/40 transition-colors duration-200"
              >
                <Icon size={17} />
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="eyebrow text-[#6f6690] mb-1">Navegación</span>
          <Link to="/" className="text-[#a49cbd] hover:text-white transition-colors">Inicio</Link>
          <Link to="/productos" className="text-[#a49cbd] hover:text-white transition-colors">Productos</Link>
          <Link to="/mi-cuenta" className="text-[#a49cbd] hover:text-white transition-colors">Mi Cuenta</Link>
          <Link to="/cargar-saldo" className="text-[#a49cbd] hover:text-white transition-colors">Cargar Saldo</Link>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="eyebrow text-[#6f6690] mb-1">Paquetes</span>
          <span className="text-[#a49cbd]">Instagram</span>
          <span className="text-[#a49cbd]">TikTok</span>
          <span className="text-[#a49cbd]">YouTube</span>
          <span className="text-[#a49cbd]">Combos</span>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <span className="eyebrow text-[#6f6690] mb-1">Soporte</span>
          <span className="text-[#a49cbd]">Ayuda</span>
          <span className="text-[#a49cbd]">Términos</span>
          <span className="text-[#a49cbd]">Privacidad</span>
        </div>
      </div>
      <div className="relative border-t border-white/[0.05] py-6 text-center text-xs text-[#6f6690]">
        © {new Date().getFullYear()} INFLOW MKT · Pasarela de pago simulada para demo
      </div>
    </footer>
  );
}
