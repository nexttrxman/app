import { useState } from "react";
import { resolveImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";

export default function ProductCard({ product, onBuy, index = 0 }) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await onBuy(product);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group rounded-xl overflow-hidden bg-[#12121a] border border-white/10 hover:border-[#00ff9d]/60 hover:-translate-y-1 transition-all duration-300 flex flex-col fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <img
          src={resolveImage(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur border border-[#00e5ff]/40">
          <span className="font-display font-bold text-[#00e5ff] text-sm">${product.price.toFixed(2)}</span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-lg text-white">{product.name}</h3>
        <p className="text-sm text-zinc-400 mt-1 line-clamp-2 flex-1">{product.description}</p>
        <Button
          data-testid={`buy-btn-${product.id}`}
          onClick={handle}
          disabled={busy}
          className="mt-4 w-full bg-[#00ff9d] hover:bg-[#00ff9d] text-black font-bold rounded-full hover:scale-[1.03] transition-transform group-hover:glow-green"
        >
          {busy ? <Loader2 className="animate-spin" size={18} /> : <><ShoppingCart size={16} className="mr-2" /> Comprar</>}
        </Button>
      </div>
    </div>
  );
}
