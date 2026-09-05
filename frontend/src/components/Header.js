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
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-[1220px] mx-auto px-5 h-[72px] flex items-center gap-6">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-3 shrink-0 group">
          <span className="relative">
            <img
              src={LOGO}
              alt="INFLOW"
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-[#ff3dbe]/50 group-hover:ring-[#2ee6ff]/60 transition-[box-shadow,--tw-ring-color] duration-300"
            />
            <span className="absolute -inset-1 rounded-2xl pulse-ring pointer-events-none" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight leading-none">
            INFLOW<span className="text-shine"> MKT</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  active ? "text-white" : "text-[#a49cbd] hover:text-white"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute left-4 right-4 -bottom-0.5 h-[2px] rounded-full bg-[#ff3dbe] shadow-[0_0_12px_#ff3dbe]" />
                )}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              data-testid="nav-admin"
              className="px-4 py-2 text-sm font-medium text-[#9b5cff] hover:text-[#c4a2ff] transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={15} /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <>
              <Link
                to="/cargar-saldo"
                data-testid="header-balance"
                className="hidden sm:flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full border border-[#2ee6ff]/35 bg-[#2ee6ff]/[0.07] hover:bg-[#2ee6ff]/[0.14] transition-colors duration-200"
              >
                <Wallet size={16} className="text-[#2ee6ff]" />
                <span className="font-display text-sm font-bold text-[#2ee6ff]">${user.balance?.toFixed(2)}</span>
              </Link>
              <Button
                data-testid="logout-btn"
                onClick={() => { logout(); navigate("/"); }}
                variant="ghost"
                size="icon"
                className="rounded-full text-[#a49cbd] hover:text-[#ff3dbe] hover:bg-white/5"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : (
            <Button
              data-testid="header-login-btn"
              onClick={() => setAuthOpen(true)}
              className="rounded-full h-10 px-6 font-semibold text-[#0a0512] bg-[#ff3dbe] hover:bg-[#ff65cc] transition-colors duration-200 shadow-[0_10px_30px_-10px_rgba(255,61,190,0.85)]"
            >
              Entrar
            </Button>
          )}
          <button
            className="lg:hidden text-white p-1"
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-white/10 bg-[#110a1e] px-5 py-4 flex flex-col gap-1" data-testid="mobile-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-3 rounded-xl text-sm font-semibold text-[#d7d1e8] hover:bg-white/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-3 rounded-xl text-sm font-semibold text-[#9b5cff]">
              Admin
            </Link>
          )}
          {user && (
            <div className="px-3 py-3 text-sm font-bold text-[#2ee6ff]">Saldo: ${user.balance?.toFixed(2)}</div>
          )}
        </nav>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
