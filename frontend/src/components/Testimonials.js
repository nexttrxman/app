import Marquee from "react-fast-marquee";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Valentina Ríos", city: "Buenos Aires, AR", text: "Cargué saldo y compré en segundos. Nunca fue tan rápido.", color: "#ff3dbe" },
  { name: "Mateo Fernández", city: "Madrid, ES", text: "La interfaz es preciosa y súper intuitiva. Todo en dos clics.", color: "#2ee6ff" },
  { name: "Camila Torres", city: "Bogotá, CO", text: "Me encanta ver mi saldo al instante. Confianza total.", color: "#9b5cff" },
  { name: "Diego Morales", city: "Lima, PE", text: "Compré tres paquetes sin complicaciones. Excelente.", color: "#ff8de0" },
  { name: "Lucía Sánchez", city: "CDMX, MX", text: "Mis views de TikTok subieron el mismo día. Brutal.", color: "#ff3dbe" },
  { name: "Sebastián Rojas", city: "Santiago, CL", text: "Cargar saldo por QR fue facilísimo. Recomendado.", color: "#2ee6ff" },
  { name: "Antonella Bruno", city: "Montevideo, UY", text: "Rápido, moderno y confiable. Mi tienda favorita.", color: "#9b5cff" },
  { name: "Joaquín Vega", city: "Córdoba, AR", text: "El descuento del saldo es automático, me ahorra tiempo.", color: "#ff8de0" },
  { name: "Isabella Cruz", city: "Quito, EC", text: "Interfaz limpia, sin ruido. Comprar es un placer.", color: "#ff3dbe" },
  { name: "Tomás Herrera", city: "Guadalajara, MX", text: "Todo funciona perfecto desde el móvil. Impecable.", color: "#2ee6ff" },
  { name: "Martina López", city: "Rosario, AR", text: "Cargué saldo una vez y ya compré cinco veces. Genial.", color: "#9b5cff" },
  { name: "Emilia Castro", city: "Valparaíso, CL", text: "El sistema de saldo interno es súper cómodo.", color: "#ff8de0" },
  { name: "Benjamín Díaz", city: "Asunción, PY", text: "Mis seguidores de Instagram crecieron sin bajones.", color: "#ff3dbe" },
  { name: "Renata Gómez", city: "Barcelona, ES", text: "Confiable y elegante. Cada pedido llegó completo.", color: "#2ee6ff" },
  { name: "Facundo Peña", city: "Mendoza, AR", text: "La mejor experiencia de compra que probé este año.", color: "#9b5cff" },
];

function Card({ t }) {
  return (
    <div
      className="w-[330px] mx-3 p-6 rounded-[22px] panel hover:border-white/25 transition-colors duration-300"
      data-testid="testimonial-card"
    >
      <div className="flex gap-1 mb-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={13} fill={t.color} style={{ color: t.color }} />
        ))}
      </div>
      <p className="text-[15px] text-[#e6e2f2] leading-relaxed min-h-[68px]">“{t.text}”</p>
      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/[0.07]">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center font-display text-xs font-extrabold text-[#0a0512] shrink-0"
          style={{ backgroundColor: t.color }}
        >
          {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{t.name}</div>
          <div className="text-xs text-[#6f6690]">{t.city}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="relative py-20 lg:py-24 overflow-hidden" data-testid="testimonials-section">
      <div className="max-w-[1220px] mx-auto px-5 mb-12">
        <span className="eyebrow text-[#ff8de0]">Comunidad INFLOW</span>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-3 max-w-lg">
          Creadores que ya despegaron con nosotros
        </h2>
      </div>
      <Marquee gradient gradientColor="#07030f" gradientWidth={90} speed={32} pauseOnHover>
        {testimonials.map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </Marquee>
    </section>
  );
}
