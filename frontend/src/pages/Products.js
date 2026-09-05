import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import AuthDialog from "@/components/AuthDialog";
import { useBuy, useProducts } from "@/hooks/useShop";
import { Loader2, PackageOpen } from "lucide-react";

export default function Products() {
  const { products, loading, load } = useProducts();
  const [authOpen, setAuthOpen] = useState(false);
  const buy = useBuy(() => setAuthOpen(true));

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="max-w-7xl mx-auto px-5 py-14 min-h-[70vh]">
      <div className="mb-10">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#00ff9d]">Catálogo</span>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mt-2">Todos los productos</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-[#00ff9d]" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-zinc-500">
          <PackageOpen size={48} className="mb-4" />
          <p>Aún no hay productos disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} onBuy={buy} index={i} />
          ))}
        </div>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </main>
  );
}
