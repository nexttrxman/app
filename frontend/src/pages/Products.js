import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import AuthDialog from "@/components/AuthDialog";
import { Input } from "@/components/ui/input";
import { useBuy, useProducts } from "@/hooks/useShop";
import { Loader2, PackageOpen, Search } from "lucide-react";

export default function Products() {
  const { products, loading, load } = useProducts();
  const [authOpen, setAuthOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const buy = useBuy(() => setAuthOpen(true));

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const set = Array.from(new Set(products.map((p) => p.category || "General")));
    return ["Todos", ...set.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = category === "Todos" || (p.category || "General") === category;
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, query, category]);

  return (
    <main className="max-w-7xl mx-auto px-5 py-14 min-h-[70vh]">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff2ec4]">Catálogo</span>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mt-2">Todos los productos</h1>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          data-testid="product-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos..."
          className="bg-black/40 border-white/10 text-white h-12 pl-11 rounded-full focus-visible:ring-[#ff2ec4]"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-10" data-testid="category-filters">
        {categories.map((c) => (
          <button
            key={c}
            data-testid={`category-chip-${c}`}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              category === c
                ? "border-[#ff2ec4] text-[#ff2ec4] bg-[#ff2ec4]/10 glow-pink"
                : "border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-[#ff2ec4]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-zinc-500" data-testid="no-products">
          <PackageOpen size={48} className="mb-4" />
          <p>No se encontraron productos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} onBuy={buy} index={i} />
          ))}
        </div>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </main>
  );
}
