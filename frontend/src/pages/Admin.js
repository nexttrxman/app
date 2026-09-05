import { useEffect, useState, useCallback } from "react";
import { api, apiError, resolveImage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, ShieldAlert, ImageIcon, TicketPercent, Power } from "lucide-react";

const inputCls =
  "h-11 bg-[#0b0617] border-white/10 text-white placeholder:text-[#6f6690] rounded-xl focus-visible:ring-1 focus-visible:ring-[#ff3dbe] focus-visible:border-[#ff3dbe]/60";
const labelCls = "text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6690]";

export default function Admin() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [cCode, setCCode] = useState("");
  const [cPercent, setCPercent] = useState("");
  const [cScope, setCScope] = useState("both");
  const [cSaving, setCSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    const { data } = await api.get("/admin/coupons");
    setCoupons(data);
  }, []);

  const createCoupon = async (e) => {
    e.preventDefault();
    setCSaving(true);
    try {
      await api.post("/admin/coupons", {
        code: cCode.trim().toUpperCase(),
        percent: parseFloat(cPercent),
        scope: cScope,
      });
      toast.success("Cupón creado");
      setCCode(""); setCPercent(""); setCScope("both");
      loadCoupons();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setCSaving(false);
    }
  };

  const toggleCoupon = async (c) => {
    try {
      await api.patch(`/admin/coupons/${c.id}`, { active: !c.active });
      loadCoupons();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  const deleteCoupon = async (id) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success("Cupón eliminado");
      loadCoupons();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  const load = useCallback(async () => {
    const { data } = await api.get("/products");
    setProducts(data);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      load();
      loadCoupons();
    }
  }, [user, load, loadCoupons]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setImageUrl(data.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Sube una imagen del producto");
      return;
    }
    setSaving(true);
    try {
      await api.post("/products", {
        name,
        description,
        price: parseFloat(price),
        image_url: imageUrl,
        category: category || "General",
      });
      toast.success("Producto agregado");
      setName(""); setDescription(""); setPrice(""); setImageUrl(""); setCategory("");
      load();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success("Producto eliminado");
      load();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-[#ff3dbe]" size={30} />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <main className="max-w-md mx-auto px-5 py-32 min-h-[60vh]">
        <div className="panel rounded-[24px] p-8 text-center">
          <span className="h-12 w-12 rounded-2xl bg-[#ff3dbe]/15 border border-[#ff3dbe]/40 flex items-center justify-center mx-auto">
            <ShieldAlert size={20} className="text-[#ff3dbe]" />
          </span>
          <h1 className="font-display text-xl font-extrabold mt-6">Acceso restringido</h1>
          <p className="text-base text-[#a49cbd] mt-3">Este panel es solo para administradores.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-x-0 top-0 h-[360px] aurora-fuchsia" />
      <div className="relative max-w-[1120px] mx-auto px-5 py-16 lg:py-20">
        <span className="eyebrow text-[#9b5cff]">Panel de administración</span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tighter mt-4 mb-10">
          Gestión de productos
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <form onSubmit={save} className="panel rounded-[26px] p-7 space-y-5 h-fit" data-testid="admin-product-form">
            <h2 className="font-display text-base font-bold flex items-center gap-2">
              <Plus size={17} className="text-[#ff3dbe]" /> Nuevo producto
            </h2>

            <div className="space-y-2.5">
              <Label className={labelCls}>Imagen</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl bg-[#0b0617] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {imageUrl ? (
                    <img src={resolveImage(imageUrl)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-[#6f6690]" />
                  )}
                </div>
                <label className="cursor-pointer flex-1">
                  <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/15 text-sm text-[#a49cbd] hover:border-[#ff3dbe]/50 hover:text-white transition-colors">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    {uploading ? "Subiendo…" : "Subir imagen"}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={upload} data-testid="admin-image-input" />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelCls}>Nombre</Label>
              <Input data-testid="admin-name-input" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className={labelCls}>Descripción corta</Label>
              <Textarea
                data-testid="admin-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={2}
                className="bg-[#0b0617] border-white/10 text-white rounded-xl resize-none focus-visible:ring-1 focus-visible:ring-[#ff3dbe] focus-visible:border-[#ff3dbe]/60"
              />
            </div>
            <div className="space-y-2">
              <Label className={labelCls}>Categoría</Label>
              <Input
                data-testid="admin-category-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Instagram, TikTok, YouTube, Combos"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelCls}>Precio ($)</Label>
              <Input
                data-testid="admin-price-input"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <Button
              data-testid="admin-save-btn"
              type="submit"
              disabled={saving}
              className="w-full h-11 rounded-full font-semibold text-[#0a0512] bg-[#ff3dbe] hover:bg-[#ff65cc] transition-colors"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : "Agregar producto"}
            </Button>
          </form>

          <div>
            <h2 className="font-display text-base font-bold mb-4">Productos ({products.length})</h2>
            <div className="panel rounded-[26px] divide-y divide-white/[0.06] overflow-hidden">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.03] transition-colors" data-testid={`admin-product-${p.id}`}>
                  <img src={resolveImage(p.image_url)} alt={p.name} className="h-14 w-14 rounded-xl object-cover bg-[#0b0617] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                    <div className="text-xs text-[#6f6690] mt-0.5">{p.category || "General"}</div>
                  </div>
                  <div className="font-display text-sm font-bold text-[#2ee6ff] shrink-0">${p.price.toFixed(2)}</div>
                  <Button
                    data-testid={`admin-delete-${p.id}`}
                    onClick={() => remove(p.id)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-[#6f6690] hover:text-[#ff3dbe] hover:bg-white/5 shrink-0"
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coupons */}
        <section className="mt-16" data-testid="admin-coupons-section">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <TicketPercent size={18} className="text-[#2ee6ff]" /> Cupones de descuento
          </h2>
          <p className="text-sm text-[#a49cbd] mt-2">
            Un cupón se puede usar una sola vez por cliente. En compras descuenta el porcentaje; en cargas de saldo lo suma como bono.
          </p>

          <div className="grid lg:grid-cols-2 gap-8 mt-7">
            <form onSubmit={createCoupon} className="panel rounded-[26px] p-7 space-y-5 h-fit" data-testid="admin-coupon-form">
              <div className="space-y-2">
                <Label className={labelCls}>Código</Label>
                <Input
                  data-testid="coupon-code-input"
                  value={cCode}
                  onChange={(e) => setCCode(e.target.value.toUpperCase())}
                  required
                  placeholder="INFLOW20"
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Descuento (%)</Label>
                <Input
                  data-testid="coupon-percent-input"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={cPercent}
                  onChange={(e) => setCPercent(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Aplica a</Label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "purchase", label: "Compras" },
                    { id: "topup", label: "Cargas" },
                    { id: "both", label: "Ambas" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      data-testid={`coupon-scope-${s.id}`}
                      onClick={() => setCScope(s.id)}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${
                        cScope === s.id
                          ? "border-[#2ee6ff] text-[#2ee6ff] bg-[#2ee6ff]/10"
                          : "border-white/10 text-[#a49cbd] hover:border-white/30"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                data-testid="coupon-save-btn"
                type="submit"
                disabled={cSaving}
                className="w-full h-11 rounded-full font-semibold text-[#0a0512] bg-[#2ee6ff] hover:bg-[#66eeff] transition-colors"
              >
                {cSaving ? <Loader2 className="animate-spin" size={18} /> : "Crear cupón"}
              </Button>
            </form>

            <div>
              <h3 className="font-display text-base font-bold mb-4">Cupones ({coupons.length})</h3>
              {coupons.length === 0 ? (
                <div className="panel rounded-[26px] p-8 text-center text-[#6f6690]" data-testid="no-coupons">
                  Aún no hay cupones.
                </div>
              ) : (
                <div className="panel rounded-[26px] divide-y divide-white/[0.06] overflow-hidden" data-testid="admin-coupons-list">
                  {coupons.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-4" data-testid={`admin-coupon-${c.code}`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-sm font-extrabold text-white truncate">{c.code}</div>
                        <div className="text-xs text-[#6f6690] mt-0.5">
                          {c.scope === "purchase" ? "Compras" : c.scope === "topup" ? "Cargas" : "Compras y cargas"} · {c.uses} uso{c.uses === 1 ? "" : "s"}
                        </div>
                      </div>
                      <span className="font-display text-sm font-bold text-[#2ee6ff] shrink-0">−{c.percent}%</span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${
                          c.active ? "text-[#2ee6ff] bg-[#2ee6ff]/10" : "text-[#6f6690] bg-white/5"
                        }`}
                      >
                        {c.active ? "Activo" : "Pausado"}
                      </span>
                      <Button
                        data-testid={`coupon-toggle-${c.code}`}
                        onClick={() => toggleCoupon(c)}
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-[#6f6690] hover:text-[#2ee6ff] hover:bg-white/5 shrink-0"
                      >
                        <Power size={16} />
                      </Button>
                      <Button
                        data-testid={`coupon-delete-${c.code}`}
                        onClick={() => deleteCoupon(c.id)}
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-[#6f6690] hover:text-[#ff3dbe] hover:bg-white/5 shrink-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
