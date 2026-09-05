import { useEffect, useState, useCallback } from "react";
import { api, apiError, resolveImage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, ShieldAlert, ImageIcon } from "lucide-react";

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

  const load = useCallback(async () => {
    const { data } = await api.get("/products");
    setProducts(data);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user, load]);

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
      await api.post("/products", { name, description, price: parseFloat(price), image_url: imageUrl, category: category || "General" });
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
    return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#ff2ec4]" size={32} /></div>;
  }

  if (user?.role !== "admin") {
    return (
      <main className="max-w-md mx-auto px-5 py-32 text-center min-h-[60vh]">
        <ShieldAlert size={40} className="mx-auto text-[#ff00ff] mb-4" />
        <h1 className="font-display text-2xl font-black mb-2">Acceso restringido</h1>
        <p className="text-zinc-400">Este panel es solo para administradores.</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-14 min-h-[70vh]">
      <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">Panel de administración</span>
      <h1 className="font-display text-4xl font-black tracking-tight mt-2 mb-8">Gestión de productos</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={save} className="rounded-2xl p-6 bg-[#0c0c12] border border-[#ff00ff]/25 space-y-4 h-fit" data-testid="admin-product-form">
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Plus size={18} className="text-[#ff2ec4]" /> Nuevo producto</h2>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-zinc-500">Imagen</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                {imageUrl ? (
                  <img src={resolveImage(imageUrl)} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={22} className="text-zinc-600" />
                )}
              </div>
              <label className="cursor-pointer flex-1">
                <div className="flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-white/20 text-sm text-zinc-400 hover:border-[#ff2ec4]/50 hover:text-white transition-colors">
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                  {uploading ? "Subiendo..." : "Subir imagen"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={upload} data-testid="admin-image-input" />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-zinc-500">Nombre</Label>
            <Input data-testid="admin-name-input" value={name} onChange={(e) => setName(e.target.value)} required className="bg-black/40 border-white/10 text-white focus-visible:ring-[#ff2ec4]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-zinc-500">Descripción corta</Label>
            <Textarea data-testid="admin-desc-input" value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} className="bg-black/40 border-white/10 text-white focus-visible:ring-[#ff2ec4] resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-zinc-500">Categoría</Label>
            <Input data-testid="admin-category-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Instagram, TikTok, YouTube" className="bg-black/40 border-white/10 text-white focus-visible:ring-[#ff2ec4]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-zinc-500">Precio ($)</Label>
            <Input data-testid="admin-price-input" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-black/40 border-white/10 text-white focus-visible:ring-[#ff2ec4]" />
          </div>
          <Button data-testid="admin-save-btn" type="submit" disabled={saving} className="w-full bg-[#ff2ec4] hover:bg-[#ff2ec4] text-black font-bold rounded-full h-11 glow-pink">
            {saving ? <Loader2 className="animate-spin" size={18} /> : "Agregar producto"}
          </Button>
        </form>

        {/* List */}
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold mb-2">Productos ({products.length})</h2>
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#12121a] border border-white/10" data-testid={`admin-product-${p.id}`}>
              <img src={resolveImage(p.image_url)} alt={p.name} className="h-14 w-14 rounded-lg object-cover bg-black shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{p.name}</div>
                <div className="text-sm text-[#00e5ff] font-display font-bold">${p.price.toFixed(2)}</div>
              </div>
              <Button data-testid={`admin-delete-${p.id}`} onClick={() => remove(p.id)} variant="ghost" size="icon" className="text-zinc-500 hover:text-[#ff00ff] hover:bg-transparent">
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
