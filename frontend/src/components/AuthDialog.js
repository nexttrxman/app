import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";

export default function AuthDialog({ open, onOpenChange, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("¡Bienvenido de nuevo!");
      } else {
        await register(name, email, password);
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
        className="bg-[#0c0c12] border border-[#00ff9d]/30 text-white sm:max-w-md glow-green"
        data-testid="auth-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black tracking-tight flex items-center gap-2">
            <Zap className="text-[#00ff9d]" size={22} />
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            {mode === "login" ? "Accede a tu billetera INFLOW MKT." : "Regístrate y empieza a comprar en segundos."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-zinc-500">Nombre</Label>
              <Input
                data-testid="auth-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-black/40 border-white/10 text-white focus-visible:ring-[#00ff9d]"
                placeholder="Tu nombre"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-zinc-500">Email</Label>
            <Input
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/40 border-white/10 text-white focus-visible:ring-[#00ff9d]"
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-zinc-500">Contraseña</Label>
            <Input
              data-testid="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/40 border-white/10 text-white focus-visible:ring-[#00ff9d]"
              placeholder="••••••••"
            />
          </div>
          <Button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={busy}
            className="w-full bg-[#00ff9d] hover:bg-[#00ff9d] text-black font-bold rounded-full h-11 hover:scale-[1.02] transition-transform glow-green"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : mode === "login" ? "Entrar" : "Registrarme"}
          </Button>
        </form>
        <div className="text-center text-sm text-zinc-400 pt-1">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            data-testid="auth-toggle-mode"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-[#00e5ff] hover:text-glow-cyan font-semibold"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
