import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { Wallet, LogOut, Menu, X, ShieldCheck } from "lucide-react";

const LOGO = "https://customer-assets-lxgj4vgw.emergentagent.net/job_ce30d6e2-6f83-4e6d-b2ea-2fc78a374f63/artifacts/n37krot0_d2cdbdf9-bbf2-4745-99a1-4c8db85bb267.jpeg";

const navItems = [
  { to: "/", label: "Inicio" },
  { to: "/productos", label: "Productos" },
  { to: "/mi-cuenta", label: "Mi Cuenta" },
  { to: "/cargar-saldo", label: "Cargar Saldo" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050507]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-5 h-[68px] flex items-center justify-between gap-4">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-3 shrink-0">
          <img src={LOGO} alt="INFLOW" className="h-10 w-10 rounded-full object-cover border border-[#ff00ff]/50 glow-magenta" />
          <span className="font-display text-xl font-black tracking-tight">
            INFLOW <span className="text-[#00ff9d] text-glow-green">MKT</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                location.pathname === item.to ? "text-[#00ff9d] text-glow-green" : "text-zinc-400 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              data-testid="nav-admin"
              className="px-4 py-2 rounded-full text-sm font-semibold text-[#ff00ff] hover:text-glow-magenta flex items-center gap-1"
            >
              <ShieldCheck size={15} /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/cargar-saldo"
                data-testid="header-balance"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-[#00e5ff]/40 bg-[#00e5ff]/5 glow-cyan hover:scale-105 transition-transform"
              >
                <Wallet size={16} className="text-[#00e5ff]" />
                <span className="font-display font-bold text-[#00e5ff]">${user.balance?.toFixed(2)}</span>
              </Link>
              <Button
                data-testid="logout-btn"
                onClick={() => { logout(); navigate("/"); }}
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-[#ff00ff] hover:bg-transparent"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : (
            <Button
              data-testid="header-login-btn"
              onClick={() => setAuthOpen(true)}
              className="bg-[#00ff9d] hover:bg-[#00ff9d] text-black font-bold rounded-full px-5 hover:scale-105 transition-transform glow-green"
            >
              Entrar
            </Button>
          )}
          <button
            className="md:hidden text-white"
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-white/10 bg-[#0c0c12] px-5 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-semibold text-[#ff00ff]">
              Admin
            </Link>
          )}
          {user && <div className="px-3 py-2.5 text-sm text-[#00e5ff] font-bold">Saldo: ${user.balance?.toFixed(2)}</div>}
        </nav>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
