import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, apiError, resolveImage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, TicketPercent, Check, X } from "lucide-react";

export default function PurchaseDialog({ product, onClose }) {
  const { user, setBalance } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCode("");
    setCoupon(null);
  }, [product?.id]);

  if (!product) return null;

  const discount = coupon ? Math.round(product.price * coupon.percent) / 100 : 0;
  const total = Math.max(0, Math.round((product.price - discount) * 100) / 100);
  const enough = (user?.balance ?? 0) >= total;

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const { data } = await api.get("/coupons/validate", { params: { code: code.trim(), scope: "purchase" } });
      setCoupon(data);
      toast.success(`Cupón ${data.code} aplicado (-${data.percent}%)`);
    } catch (err) {
      setCoupon(null);
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setChecking(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/wallet/purchase/${product.id}`, {
        coupon_code: coupon ? coupon.code : null,
      });
      setBalance(data.balance);
      toast.success(`¡Compraste ${product.name}!`, {
        description: `Pagaste $${data.total.toFixed(2)} · nuevo saldo: $${data.balance.toFixed(2)}`,
      });
      onClose();
    } catch (err) {
      const msg = apiError(err.response?.data?.detail);
      toast.error(msg, {
        action: { label: "Cargar saldo", onClick: () => navigate("/cargar-saldo") },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-[#110a1e] border border-white/10 text-white sm:max-w-[430px] rounded-[24px] p-7"
        data-testid="purchase-dialog"
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-display text-lg font-extrabold tracking-tight">Confirmar compra</DialogTitle>
          <DialogDescription className="text-sm text-[#a49cbd]">
            Se descontará de tu saldo al confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 mt-2">
          <img
            src={resolveImage(product.image_url)}
            alt={product.name}
            className="h-16 w-16 rounded-2xl object-cover bg-[#0b0617] shrink-0"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{product.name}</div>
            <div className="text-xs text-[#6f6690] mt-0.5">{product.category}</div>
          </div>
        </div>

        {/* Coupon */}
        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690] flex items-center gap-1.5">
            <TicketPercent size={13} /> ¿Tienes un cupón?
          </label>
          <div className="flex gap-2 mt-2.5">
            <Input
              data-testid="coupon-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EJ: INFLOW20"
              disabled={!!coupon}
              className="h-11 bg-[#0b0617] border-white/10 text-white rounded-xl placeholder:text-[#6f6690] focus-visible:ring-1 focus-visible:ring-[#ff3dbe] focus-visible:border-[#ff3dbe]/60"
            />
            {coupon ? (
              <Button
                data-testid="coupon-remove-btn"
                onClick={() => { setCoupon(null); setCode(""); }}
                variant="outline"
                className="h-11 px-4 rounded-xl bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </Button>
            ) : (
              <Button
                data-testid="coupon-apply-btn"
                onClick={applyCoupon}
                disabled={checking}
                variant="outline"
                className="h-11 px-5 rounded-xl bg-transparent border-[#2ee6ff]/40 text-[#2ee6ff] hover:bg-[#2ee6ff]/10 hover:text-[#2ee6ff]"
              >
                {checking ? <Loader2 className="animate-spin" size={16} /> : "Aplicar"}
              </Button>
            )}
          </div>
          {coupon && (
            <div className="flex items-center gap-1.5 text-xs text-[#2ee6ff] mt-2.5" data-testid="coupon-applied">
              <Check size={13} /> Cupón {coupon.code} aplicado · −{coupon.percent}%
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="mt-6 panel rounded-2xl p-5 space-y-2.5" data-testid="purchase-summary">
          <div className="flex justify-between text-sm">
            <span className="text-[#a49cbd]">Precio</span>
            <span className="text-white">${product.price.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm" data-testid="purchase-discount">
              <span className="text-[#a49cbd]">Descuento</span>
              <span className="text-[#2ee6ff]">−${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-end pt-2.5 border-t border-white/[0.07]">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690]">Total</span>
            <span className="font-display text-2xl font-extrabold text-white" data-testid="purchase-total">
              ${total.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-[#6f6690]">Tu saldo: ${user?.balance?.toFixed(2)}</div>
        </div>

        {!enough && (
          <p className="text-xs text-[#ff6b9d] mt-3" data-testid="purchase-insufficient">
            Saldo insuficiente. Carga saldo para completar tu compra.
          </p>
        )}

        <Button
          data-testid="purchase-confirm-btn"
          onClick={enough ? confirm : () => navigate("/cargar-saldo")}
          disabled={busy}
          className="w-full h-12 mt-5 rounded-full font-semibold text-[#0a0512] bg-[#ff3dbe] hover:bg-[#ff65cc] transition-colors"
        >
          {busy ? <Loader2 className="animate-spin" size={18} /> : enough ? `Pagar $${total.toFixed(2)}` : "Cargar saldo"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
