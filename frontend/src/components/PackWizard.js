import React, { useEffect, useRef, useState } from "react";

export const PLATFORM_CONFIG = {
  instagram: {
    label: "Instagram",
    gradient: "linear-gradient(45deg, rgb(240, 148, 51), rgb(230, 104, 60), rgb(220, 39, 67), rgb(204, 35, 102), rgb(188, 24, 136))",
    services: {
      seguidores: { label: "Seguidores", basePriceARS: 29.6 },
      likes: { label: "Likes", basePriceARS: 5.9 },
      views: { label: "Vistas", basePriceARS: 2.9 },
      reels: { label: "Reels", basePriceARS: 8.9 },
      guardados: { label: "Guardados", basePriceARS: 12.9 },
      shares: { label: "Shares", basePriceARS: 9.9 },
    },
  },
  youtube: {
    label: "YouTube",
    gradient: "linear-gradient(45deg, rgb(255, 0, 0), rgb(200, 0, 0))",
    services: {
      suscriptores: { label: "Suscriptores", basePriceARS: 45.0 },
      views: { label: "Vistas", basePriceARS: 3.5 },
      likes: { label: "Likes", basePriceARS: 6.5 },
      horas: { label: "Horas", basePriceARS: 15.0 },
    },
  },
  tiktok: {
    label: "TikTok",
    gradient: "linear-gradient(45deg, rgb(0, 242, 234), rgb(254, 0, 128))",
    services: {
      seguidores: { label: "Seguidores", basePriceARS: 25.0 },
      views: { label: "Vistas", basePriceARS: 2.5 },
      likes: { label: "Likes", basePriceARS: 5.5 },
      shares: { label: "Shares", basePriceARS: 8.5 },
    },
  },
  facebook: {
    label: "Facebook",
    gradient: "linear-gradient(45deg, rgb(24, 119, 242), rgb(0, 82, 204))",
    services: {
      seguidores: { label: "Seguidores", basePriceARS: 22.0 },
      likes: { label: "Likes", basePriceARS: 5.0 },
      views: { label: "Vistas", basePriceARS: 2.0 },
      shares: { label: "Shares", basePriceARS: 7.5 },
    },
  },
  spotify: {
    label: "Spotify",
    gradient: "linear-gradient(45deg, rgb(29, 185, 84), rgb(0, 128, 64))",
    services: {
      seguidores: { label: "Seguidores", basePriceARS: 35.0 },
      streams: { label: "Streams", basePriceARS: 4.5 },
      saves: { label: "Guardados", basePriceARS: 10.0 },
    },
  },
};

export const DEFAULT_PACKS = [
  { qty: 100, discount: 15, label: "100" },
  { qty: 250, discount: 22 },
  { qty: 500, discount: 30 },
  { qty: 1000, discount: 40 },
  { qty: 1500, discount: 48, bestseller: true, label: "1.5K" },
  { qty: 2000, discount: 55 },
  { qty: 2500, discount: 60 },
  { qty: 5000, discount: 65, bestPrice: true, label: "5K" },
];

const USD_RATE = 1170;

function computePrice(pack, serviceConfig, currency) {
  const listARS = Math.round(pack.qty * serviceConfig.basePriceARS);
  const saleARS = Math.round(listARS * (1 - pack.discount / 100));
  const saveARS = listARS - saleARS;
  if (currency === "ARS") {
    return {
      sale: "$" + saleARS.toLocaleString("es-AR", { minimumFractionDigits: 2 }),
      save: "$" + saveARS.toLocaleString("es-AR", { minimumFractionDigits: 2 }),
      list: "$" + listARS.toLocaleString("es-AR", { minimumFractionDigits: 2 }),
    };
  }
  const saleUSD = saleARS / USD_RATE;
  const saveUSD = saveARS / USD_RATE;
  const listUSD = listARS / USD_RATE;
  return {
    sale: "US$ " + saleUSD.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    save: "US$ " + saveUSD.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    list: "US$ " + listUSD.toLocaleString("en-US", { minimumFractionDigits: 2 }),
  };
}

export function PackWizard({ platform = "instagram", serviceType = "seguidores", packs = DEFAULT_PACKS, onContinue, onClose }) {
  const [username, setUsername] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [index, setIndex] = useState(7);
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);

  const platformConfig = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.instagram;
  const serviceConfig = platformConfig.services[serviceType] || platformConfig.services.seguidores;
  const pack = packs[index];
  const price = computePrice(pack, serviceConfig, currency);
  const canContinue = username.trim().length >= 2;
  const progressPercent = (index / (packs.length - 1)) * 100;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUsernameChange = (e) => {
    const clean = e.target.value.replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30);
    setUsername(clean);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (onContinue) onContinue({ username, pack, currency, platform, serviceType });
  };

  return (
    <div id="pedilo" className="relative scroll-mt-24 w-full max-w-[460px] mx-auto font-sans">
      <div className="rounded-[24px] bg-white border border-black/10 shadow-[0_20px_60px_-30px_rgba(26,21,35,0.20)]">
        <div className="rounded-[24px] bg-white p-6 md:p-7 transition-shadow duration-300">
          {/* PASO 1: USUARIO */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full text-white text-[12px] font-bold shrink-0 shadow-sm" style={{ background: platformConfig.gradient }}>1</span>
                <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1a1523]">Usuario de {platformConfig.label}</span>
              </div>
            </div>
            <div className="flex items-center overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200" style={{ borderColor: isFocused ? "rgba(225, 48, 108, 0.55)" : "rgba(0, 0, 0, 0.1)", boxShadow: isFocused ? "0 0 0 4px rgba(225, 48, 108, 0.12)" : "none" }}>
              <span className="flex h-[52px] items-center bg-[#faf6f1]/60 px-4 font-mono text-[15px] text-[#5c5668] border-r border-black/[0.05]">@</span>
              <input placeholder="tu_usuario" className="h-[52px] w-full bg-transparent px-4 text-[16px] text-[#1a1523] outline-none placeholder:text-[#8b8494]/60" type="text" value={username} autoComplete="off" spellCheck={false} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={handleUsernameChange} />
            </div>
            <p className="mt-2 text-[12.5px] text-[#8b8494] leading-snug">Tu cuenta debe ser pública para recibir {serviceConfig.label.toLowerCase()}</p>
          </div>

          {/* PASO 2: ELEGÍ TU PACK */}
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full text-white text-[12px] font-bold shrink-0 shadow-sm" style={{ background: platformConfig.gradient }}>2</span>
                <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#1a1523]">Elegí tu pack</span>
              </div>
              <div className="inline-flex rounded-full border border-black/[0.08] bg-[#faf6f1]/60 p-0.5 text-[11px]">
                <button type="button" onClick={() => setCurrency("ARS")} className={"px-2.5 py-1 rounded-full font-mono font-semibold transition-colors " + (currency === "ARS" ? "bg-[#1a1523] text-[#faf6f1]" : "text-[#8b8494] hover:text-[#5c5668]")}>ARS</button>
                <button type="button" onClick={() => setCurrency("USD")} className={"px-2.5 py-1 rounded-full font-mono font-semibold transition-colors " + (currency === "USD" ? "bg-[#1a1523] text-[#faf6f1]" : "text-[#8b8494] hover:text-[#5c5668]")}>USD</button>
              </div>
            </div>

            {/* BOTON TARJETA / SELECTOR DESPLEGABLE */}
            <div className="relative" ref={dropdownRef}>
              <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((prev) => !prev)} className="relative w-full overflow-hidden rounded-[18px] border-2 p-4 text-left cursor-pointer transition-all duration-200" tabIndex={0} style={{ borderColor: "rgba(225, 48, 108, 0.333)", background: "linear-gradient(rgba(225, 48, 108, 0.063) 0%, white 100%)", boxShadow: "rgba(225, 48, 108, 0.333) 0px 10px 30px -14px, rgba(225, 48, 108, 0.1) 0px 0px 0px 3px" }}>
                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full opacity-[0.10] blur-2xl" style={{ background: platformConfig.gradient }} />
                <div className="relative flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-[32px] -tracking-[0.02em] text-[#1a1523] leading-none">{pack.qty.toLocaleString("es-AR")}</span>
                      <span className="text-[13px] text-[#5c5668] lowercase">{serviceConfig.label.toLowerCase()}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b8494] transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                    <div className="mt-2 flex items-center gap-x-2 gap-y-1 flex-wrap">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold tracking-wide whitespace-nowrap text-white" style={{ background: platformConfig.gradient }}>−{pack.discount}%</span>
                      {pack.bestPrice && <span className="rounded-full px-2 py-0.5 text-[9.5px] font-mono font-bold tracking-wide whitespace-nowrap bg-[#1a1523] text-[#faf6f1]">MEJOR PRECIO</span>}
                      {pack.bestseller && <span className="rounded-full px-2 py-0.5 text-[9.5px] font-mono font-bold tracking-wide whitespace-nowrap bg-[#1a1523] text-[#faf6f1]">MAS VENDIDO</span>}
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#1c9a55]"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> ahorrás {price.save}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[26px] -tracking-[0.02em] leading-none whitespace-nowrap" style={{ color: "rgb(225, 48, 108)" }}>{price.sale}</div>
                    <div className="mt-1 text-[10px] font-mono font-semibold text-[#8b8494] uppercase tracking-wider">{currency}</div>
                  </div>
                </div>
              </button>

              {open && (
                <div role="listbox" className="absolute z-30 mt-2 w-full overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_24px_50px_-18px_rgba(26,21,35,0.35)]">
                  <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1">
                    {packs.map((item, i) => {
                      const itemPrice = computePrice(item, serviceConfig, currency);
                      const isSelected = i === index;
                      return (
                        <button key={item.qty} type="button" role="option" aria-selected={isSelected} onClick={() => { setIndex(i); setOpen(false); }} className={"flex w-full items-center justify-between gap-3 rounded-[14px] px-3.5 py-2.5 text-left transition-colors cursor-pointer " + (isSelected ? "bg-[#e1306c]/[0.08]" : "hover:bg-[#faf6f1]")}>
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-[17px] text-[#1a1523]">{item.qty.toLocaleString("es-AR")}</span>
                              <span className="text-[11px] text-[#5c5668]">{serviceConfig.label.toLowerCase()}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-[#e1306c]">−{item.discount}%</span>
                              {item.bestPrice && <span className="text-[9px] font-mono font-bold text-[#1a1523]">MEJOR PRECIO</span>}
                              {item.bestseller && <span className="text-[9px] font-mono font-bold text-[#8b8494]">MAS VENDIDO</span>}
                            </div>
                          </div>
                          <span className="font-bold text-[15px] text-[#e1306c] whitespace-nowrap">{itemPrice.sale}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SLIDER DE CANTIDAD */}
            <div className="relative pt-9">
              <div className="pointer-events-none absolute z-10" style={{ top: "0px", left: "calc(57.1429% - 1.71429px)", transform: "translateX(-50%)" }}>
                <div className="relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide whitespace-nowrap text-white" style={{ background: "linear-gradient(135deg, rgb(26, 26, 46) 0%, rgb(45, 45, 74) 100%)", boxShadow: "rgba(0, 0, 0, 0.35) 0px 6px 18px -4px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" /></svg> MAS VENDIDO
                  <span aria-hidden="true" className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgb(26, 26, 46)" }} />
                </div>
              </div>
              {index !== 4 && (
                <div className="pointer-events-none absolute z-20" style={{ top: "2px", left: "calc(" + progressPercent + "% + " + (12 - (index / (packs.length - 1)) * 24) + "px)", transform: "translateX(-50%)" }}>
                  <div className="relative inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap text-white" style={{ background: "rgb(225, 48, 108)", boxShadow: "rgba(225, 48, 108, 0.667) 0px 6px 16px -4px" }}>
                    {pack.qty.toLocaleString("es-AR")}
                    <span aria-hidden="true" className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgb(225, 48, 108)" }} />
                  </div>
                </div>
              )}
              <input min={0} max={packs.length - 1} step={1} aria-label="Cantidad" className="sg-pack-slider w-full" type="range" value={index} onChange={(e) => setIndex(Number(e.target.value))} style={{ "--accent": "#e1306c", "--progress": progressPercent + "%", "--accent-shadow": "#e1306c66" }} />
              <div className="relative mt-3 h-9">
                {packs.map((item, i) => {
                  const leftPercent = (i / (packs.length - 1)) * 100;
                  const isBestseller = item.bestseller;
                  return (
                    <button key={item.qty} type="button" aria-label={item.label || item.qty.toString()} onClick={() => setIndex(i)} className="absolute top-0 flex flex-col items-center gap-1.5 cursor-pointer p-1 -m-1" style={{ left: `calc(${leftPercent}% + ${12 - (leftPercent / 100) * 24}px)`, transform: "translateX(-50%)" }}>
                      <span className="block rounded-full transition-all" style={{ width: isBestseller ? "10px" : (index === i ? "6px" : "4px"), height: isBestseller ? "10px" : (index === i ? "6px" : "4px"), background: isBestseller ? "rgb(225, 48, 108)" : (index === i ? "rgb(225, 48, 108)" : "rgba(0, 0, 0, 0.18)"), boxShadow: isBestseller ? "rgba(225, 48, 108, 0.2) 0px 0px 0px 4px" : "none" }} />
                      {i === 0 || i === packs.length - 1 || isBestseller ? <span className="text-[10px] font-mono whitespace-nowrap text-[#8b8494] font-semibold">{item.label || item.qty.toLocaleString("es-AR")}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-2 text-[11px] text-[#8b8494] text-center">Entrega gradual · 24–48hs · Reposición 30 días</p>
          </div>

          {/* BENEFICIOS */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-x-3 gap-y-1.5 text-[10.5px] font-mono uppercase tracking-wider text-[#8b8494]">
            <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1c9a55]" /> Sin contraseña</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1c9a55]" /> Reposición 30 días</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#1c9a55]" /> Pago 100% seguro</span>
          </div>

          {/* BOTON CONTINUAR */}
          <button type="button" disabled={!canContinue} onClick={handleContinue} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer" style={{ background: platformConfig.gradient, boxShadow: "rgba(225, 48, 108, 0.6) 0px 16px 36px -12px" }}>
            Continuar
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
