import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050507] mt-24">
      <div className="max-w-7xl mx-auto px-5 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-display text-xl font-black tracking-tight flex items-center gap-2">
            <Zap size={18} className="text-[#ff2ec4]" /> INFLOW <span className="text-[#ff2ec4]">MKT</span>
          </div>
          <p className="text-sm text-zinc-500 mt-3 max-w-xs">
            Compra fácil, saldo al instante. El marketplace futurista con billetera interna.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-widest text-zinc-600 mb-1">Navegación</span>
          <Link to="/" className="text-zinc-400 hover:text-[#00e5ff]">Inicio</Link>
          <Link to="/productos" className="text-zinc-400 hover:text-[#00e5ff]">Productos</Link>
          <Link to="/mi-cuenta" className="text-zinc-400 hover:text-[#00e5ff]">Mi Cuenta</Link>
          <Link to="/cargar-saldo" className="text-zinc-400 hover:text-[#00e5ff]">Cargar Saldo</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-widest text-zinc-600 mb-1">Soporte</span>
          <span className="text-zinc-400">Ayuda</span>
          <span className="text-zinc-400">Términos</span>
          <span className="text-zinc-400">Privacidad</span>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} INFLOW MKT. Todos los derechos reservados.
      </div>
    </footer>
  );
}
