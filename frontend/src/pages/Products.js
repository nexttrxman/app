import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import AuthDialog from "@/components/AuthDialog";
import PurchaseDialog from "@/components/PurchaseDialog";
import { Input } from "@/components/ui/input";
import { usePurchaseGate, useProducts } from "@/hooks/useShop";
import { Loader2, PackageOpen, Search, X } from "lucide-react";

export default function Products() {
  const { products, loading, load } = useProducts();
  const [authOpen, setAuthOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const { pending, request: buy, close } = usePurchaseGate(() => setAuthOpen(true));

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
    <main className="relative overflow-hidden min-h-[80vh]">
      <div className="absolute inset-x-0 top-0 h-[420px] aurora-violet" />

      <div className="relative max-w-[1220px] mx-auto px-5 py-16 lg:py-20">
        <span className="eyebrow text-[#ff8de0]">Catálogo</span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-4 max-w-xl leading-[1.05]">
          Elige tu <span className="text-shine">impulso</span>
        </h1>
        <p className="text-base text-[#a49cbd] mt-5 max-w-md leading-relaxed">
          Busca por nombre o filtra por red social. Se descuenta de tu saldo al instante.
        </p>

        {/* Search + filters */}
        <div className="mt-12 flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="relative w-full lg:max-w-sm">
            <Search size={17} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6f6690]" />
            <Input
              data-testid="product-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar paquetes…"
              className="h-12 pl-12 pr-11 rounded-full bg-[#110a1e] border-white/10 text-white placeholder:text-[#6f6690] focus-visible:ring-1 focus-visible:ring-[#ff3dbe] focus-visible:border-[#ff3dbe]/60"
            />
            {query && (
              <button
                data-testid="clear-search-btn"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6f6690] hover:text-white transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 lg:ml-auto" data-testid="category-filters">
            {categories.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  data-testid={`category-chip-${c}`}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors duration-200 ${
                    active
                      ? "bg-[#ff3dbe] border-[#ff3dbe] text-[#0a0512]"
                      : "bg-white/[0.04] border-white/10 text-[#a49cbd] hover:text-white hover:border-white/25"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-sm text-[#6f6690]" data-testid="results-count">
          {loading ? "Cargando paquetes…" : `${filtered.length} ${filtered.length === 1 ? "paquete" : "paquetes"}`}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-28">
              <Loader2 className="animate-spin text-[#ff3dbe]" size={30} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-28 text-[#6f6690]" data-testid="no-products">
              <PackageOpen size={44} className="mb-5" />
              <p className="text-base">No encontramos paquetes con ese filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} onBuy={buy} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <PurchaseDialog product={pending} onClose={close} />
    </main>
  );
}
