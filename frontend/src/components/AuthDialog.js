import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Sparkles, Gift } from "lucide-react";

const inputCls =
  "h-11 bg-[#0b0617] border-white/10 text-white placeholder:text-[#6f6690] rounded-xl focus-visible:ring-1 focus-visible:ring-[#ff3dbe] focus-visible:border-[#ff3dbe]/60";

export default function AuthDialog({ open, onOpenChange, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(localStorage.getItem("inflow_ref") || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem("inflow_ref");
      if (stored) {
        setReferral(stored);
        setMode("register");
      }
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("¡Bienvenido de nuevo!");
      } else {
        await register(name, email, password, referral.trim());
        toast.success("Cuenta creada con éxito");
      }
      onOpenChange(false);
      setPassword("");
      onSuccess && onSuccess();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#110a1e] border border-white/10 text-white sm:max-w-[420px] rounded-[24px] p-7 shadow-[0_40px_120px_-40px_rgba(255,61,190,0.7)]"
        data-testid="auth-dialog"
      >
        <DialogHeader className="space-y-2">
          <span className="h-11 w-11 rounded-2xl bg-[#ff3dbe]/15 border border-[#ff3dbe]/40 flex items-center justify-center">
            <Sparkles size={19} className="text-[#ff3dbe]" />
          </span>
          <DialogTitle className="font-display text-xl font-extrabold tracking-tight pt-2">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#a49cbd]">
            {mode === "login"
              ? "Accede a tu billetera INFLOW MKT."
              : "Regístrate y empieza a comprar en segundos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 pt-3">
          {mode === "register" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690]">Nombre</Label>
              <Input
                data-testid="auth-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
                placeholder="Tu nombre"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690]">Email</Label>
            <Input
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690]">Contraseña</Label>
            <Input
              data-testid="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputCls}
              placeholder="••••••••"
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690] flex items-center gap-1.5">
                <Gift size={12} /> Código de invitación (opcional)
              </Label>
              <Input
                data-testid="auth-referral-input"
                value={referral}
                onChange={(e) => setReferral(e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="Ej: SOFI1A2B"
              />
              <p className="text-xs text-[#6f6690]">Con un código válido arrancas con saldo de regalo.</p>
            </div>
          )}
          <Button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-full font-semibold text-[#0a0512] bg-[#ff3dbe] hover:bg-[#ff65cc] transition-colors duration-200"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : mode === "login" ? "Entrar" : "Registrarme"}
          </Button>
        </form>

        <div className="text-center text-sm text-[#a49cbd] pt-1">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            data-testid="auth-toggle-mode"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-[#2ee6ff] hover:text-[#7ff0ff] font-semibold transition-colors"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
