import { useState } from "react";
import { resolveImage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";

const CAT_COLOR = {
  Instagram: "#ff3dbe",
  TikTok: "#2ee6ff",
  YouTube: "#ff5f6d",
  Combos: "#9b5cff",
};

export default function ProductCard({ product, onBuy, index = 0 }) {
  const [busy, setBusy] = useState(false);
  const accent = CAT_COLOR[product.category] || "#9b5cff";

  const handle = async () => {
    setBusy(true);
    try {
      await onBuy(product);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group relative rounded-[22px] overflow-hidden panel flex flex-col hover:-translate-y-2 transition-[transform,border-color] duration-300 fade-up"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[#0b0617]">
        <img
          src={resolveImage(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.06] transition-[opacity,transform] duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#110a1e] via-transparent to-transparent" />
        {product.category && (
          <span
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] glass"
            style={{ color: accent, borderColor: `${accent}55` }}
            data-testid={`product-category-${product.id}`}
          >
            {product.category}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-base font-bold text-white leading-snug">{product.name}</h3>
        <p className="text-sm text-[#a49cbd] mt-2.5 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>

        <div className="flex items-end justify-between mt-6 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-[#6f6690] font-semibold">Precio</div>
            <div className="font-display text-2xl font-extrabold text-white mt-1" data-testid={`product-price-${product.id}`}>
              ${product.price.toFixed(2)}
            </div>
          </div>
          <Button
            data-testid={`buy-btn-${product.id}`}
            onClick={handle}
            disabled={busy}
            className="rounded-full h-11 px-5 font-semibold text-[#0a0512] bg-white hover:bg-[#ff3dbe] transition-colors duration-200 shrink-0"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : <><ShoppingCart size={16} className="mr-2" /> Comprar</>}
          </Button>
        </div>
      </div>

      <span
        className="absolute inset-x-0 bottom-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
    </article>
  );
}
