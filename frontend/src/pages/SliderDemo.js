import { Slider } from "@/components/ui/slider"
import { useState } from "react"

export default function SliderDemo() {
  const [singleValue, setSingleValue] = useState([50])
  const [rangeValue, setRangeValue] = useState([20, 80])
  const [volumeValue, setVolumeValue] = useState([75])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black p-8 pt-24">
      <div className="max-w-2xl mx-auto">
        {/* Título */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-shine mb-3">Slider Neón</h1>
          <p className="text-muted eyebrow">Componentes interactivos con estilo futurista</p>
        </div>

        {/* Slider Simple */}
        <div className="glass panel p-8 rounded-2xl mb-8 grain">
          <label className="eyebrow text-cyan block mb-2">Slider Simple</label>
          <p className="text-sm text-muted mb-4">Ajusta un valor de 0 a 100</p>
          
          <Slider 
            className="slider-neon mb-4"
            value={singleValue}
            onValueChange={setSingleValue}
            min={0}
            max={100}
            step={1}
          />
          
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-muted">Valor:</span>
            <span className="text-3xl font-bold text-shine">{singleValue[0]}%</span>
          </div>
        </div>

        {/* Slider Rango (Min-Max) */}
        <div className="glass panel p-8 rounded-2xl mb-8 grain">
          <label className="eyebrow text-cyan block mb-2">Rango de Precio</label>
          <p className="text-sm text-muted mb-4">Selecciona un rango de precios</p>
          
          <Slider 
            className="slider-neon mb-4"
            value={rangeValue}
            onValueChange={setRangeValue}
            min={0}
            max={1000}
            step={10}
          />
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
              <p className="text-2xl font-bold text-fuchsia">${rangeValue[0]}</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Máximo</p>
              <p className="text-2xl font-bold text-cyan">${rangeValue[1]}</p>
            </div>
          </div>
        </div>

        {/* Slider Volumen */}
        <div className="glass panel p-8 rounded-2xl mb-8 grain">
          <label className="eyebrow text-cyan block mb-2">Control de Volumen</label>
          <p className="text-sm text-muted mb-4">Ajusta el nivel de volumen</p>
          
          <div className="flex items-center gap-4">
            <span className="text-xl">🔊</span>
            <Slider 
              className="slider-neon flex-1"
              value={volumeValue}
              onValueChange={setVolumeValue}
              min={0}
              max={100}
              step={1}
            />
            <span className="text-xl">🔔</span>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted mb-2">Nivel de volumen</p>
            <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-fuchsia to-cyan h-full transition-all duration-300"
                style={{ width: `${volumeValue[0]}%` }}
              ></div>
            </div>
            <p className="text-2xl font-bold text-shine mt-3">{volumeValue[0]}%</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-secondary/30 border border-primary/20 rounded-xl p-6 text-center">
          <p className="text-sm text-muted">
            💡 Este es un componente <span className="text-cyan font-semibold">Slider Neón</span> personalizado
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Construido con Radix UI + Tailwind CSS + Estilos Neón personalizados
          </p>
        </div>
      </div>
    </div>
  )
}
