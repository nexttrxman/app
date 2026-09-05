import Marquee from "react-fast-marquee";
import { Quote } from "lucide-react";

const testimonials = [
  { name: "Valentina Ríos", city: "Buenos Aires, AR", text: "Cargué saldo y compré en segundos. Nunca fue tan rápido.", color: "#ff2ec4" },
  { name: "Mateo Fernández", city: "Madrid, ES", text: "La interfaz es preciosa y súper intuitiva. Todo en dos clics.", color: "#00e5ff" },
  { name: "Camila Torres", city: "Bogotá, CO", text: "Me encanta ver mi saldo al instante. Confianza total.", color: "#ff00ff" },
  { name: "Diego Morales", city: "Lima, PE", text: "Compré tres productos sin complicaciones. Excelente.", color: "#b026ff" },
  { name: "Lucía Sánchez", city: "CDMX, MX", text: "El diseño neón es brutal y la compra fue inmediata.", color: "#ff2ec4" },
  { name: "Sebastián Rojas", city: "Santiago, CL", text: "Cargar saldo por QR fue facilísimo. Recomendado.", color: "#00e5ff" },
  { name: "Antonella Bruno", city: "Montevideo, UY", text: "Rápido, moderno y confiable. Mi tienda favorita.", color: "#ff00ff" },
  { name: "Joaquín Vega", city: "Córdoba, AR", text: "El descuento del saldo es automático, me ahorra tiempo.", color: "#b026ff" },
  { name: "Isabella Cruz", city: "Quito, EC", text: "Interfaz limpia, sin ruido. Comprar es un placer.", color: "#ff2ec4" },
  { name: "Tomás Herrera", city: "Guadalajara, MX", text: "Todo funciona perfecto desde el móvil. Impecable.", color: "#00e5ff" },
  { name: "Martina López", city: "Rosario, AR", text: "Cargué saldo una vez y ya compré cinco veces. Genial.", color: "#ff00ff" },
  { name: "Emilia Castro", city: "Valparaíso, CL", text: "El sistema de saldo interno es súper cómodo.", color: "#b026ff" },
  { name: "Benjamín Díaz", city: "Asunción, PY", text: "Rapidísimo y con un estilo futurista increíble.", color: "#ff2ec4" },
  { name: "Renata Gómez", city: "Barcelona, ES", text: "Confiable y elegante. Mis compras llegan sin líos.", color: "#00e5ff" },
  { name: "Facundo Peña", city: "Mendoza, AR", text: "La mejor experiencia de compra que probé este año.", color: "#ff00ff" },
];

function Card({ t }) {
  return (
    <div
      className="w-[320px] mx-3 p-6 rounded-xl bg-[#12121a] border border-white/10 hover:border-[var(--c)] transition-colors"
      style={{ "--c": t.color }}
      data-testid="testimonial-card"
    >
      <Quote size={22} style={{ color: t.color }} className="mb-3" />
      <p className="text-zinc-200 text-[15px] leading-relaxed mb-5 min-h-[66px]">"{t.text}"</p>
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center font-display font-black text-black text-sm shrink-0"
          style={{ backgroundColor: t.color }}
        >
          {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{t.name}</div>
          <div className="text-xs text-zinc-500">{t.city}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-20 relative overflow-hidden" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto px-5 mb-10 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">Comunidad INFLOW</span>
        <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight mt-3">
          Lo que dicen nuestros compradores
        </h2>
      </div>
      <Marquee gradient gradientColor="#050507" gradientWidth={80} speed={40} pauseOnHover>
        {testimonials.map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </Marquee>
    </section>
  );
}
