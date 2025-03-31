"use client"

import { useEffect, useState, useRef } from "react"
import "./AstralChart.css"

// Símbolos astrológicos para os signos
const zodiacSymbols = {
  Áries: "♈",
  Touro: "♉",
  Gêmeos: "♊",
  Câncer: "♋",
  Leão: "♌",
  Virgem: "♍",
  Libra: "♎",
  Escorpião: "♏",
  Sagitário: "♐",
  Capricórnio: "♑",
  Aquário: "♒",
  Peixes: "♓",
}

// Símbolos astrológicos para os planetas
const planetSymbols = {
  Sol: "☉",
  Lua: "☽",
  Mercúrio: "☿",
  Vênus: "♀",
  Marte: "♂",
  Júpiter: "♃",
  Saturno: "♄",
  Urano: "♅",
  Netuno: "♆",
  Plutão: "♇",
}

// Cores para os planetas
const planetColors = {
  Sol: "#FFD700",
  Lua: "#C0C0C0",
  Mercúrio: "#A9A9A9",
  Vênus: "#00FF7F",
  Marte: "#FF4500",
  Júpiter: "#4169E1",
  Saturno: "#708090",
  Urano: "#40E0D0",
  Netuno: "#1E90FF",
  Plutão: "#800080",
}

// Elementos dos signos (fogo, terra, ar, água)
const zodiacElements = {
  Áries: "fogo",
  Touro: "terra",
  Gêmeos: "ar",
  Câncer: "água",
  Leão: "fogo",
  Virgem: "terra",
  Libra: "ar",
  Escorpião: "água",
  Sagitário: "fogo",
  Capricórnio: "terra",
  Aquário: "ar",
  Peixes: "água",
}

// Cores para os elementos
const elementColors = {
  fogo: "#FFEDDB",
  terra: "#E6FFE6",
  ar: "#E6F2FF",
  água: "#E6ECFF",
}

const AstralChart = ({ astralData }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const resizeListenerRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Armazenar a referência para poder remover o listener depois
    resizeListenerRef.current = handleResize
    window.addEventListener("resize", handleResize)

    return () => {
      // Limpar o event listener quando o componente for desmontado
      if (resizeListenerRef.current) {
        window.removeEventListener("resize", resizeListenerRef.current)
      }
    }
  }, [])

  // Verificar se temos dados válidos
  if (!astralData || !astralData.sunSign || !astralData.moonSign || !astralData.ascendant) {
    return (
      <div className="astral-chart-container">
        <h3>Mapa Astral Visual</h3>
        <div className="chart-error">Dados insuficientes para renderizar o mapa astral.</div>
      </div>
    )
  }

  // Determina o tamanho do gráfico baseado na tela
  const chartSize = windowWidth < 600 ? 320 : windowWidth < 960 ? 480 : 600
  const center = chartSize / 2
  const radius = chartSize * 0.45 // 90% do tamanho para permitir margem

  // Ordem dos signos no sentido anti-horário (como num mapa astral tradicional)
  const signOrder = [
    "Áries",
    "Touro",
    "Gêmeos",
    "Câncer",
    "Leão",
    "Virgem",
    "Libra",
    "Escorpião",
    "Sagitário",
    "Capricórnio",
    "Aquário",
    "Peixes",
  ]

  // Cria os segmentos do zodíaco (12 casas)
  const createZodiacSegments = () => {
    const segments = []
    const anglePerSign = 360 / 12

    // Encontrar o índice do ascendente
    const ascendantIndex = signOrder.findIndex((sign) => sign === astralData.ascendant)

    // Se o ascendente não for encontrado, usar Áries como padrão
    const effectiveAscendantIndex = ascendantIndex !== -1 ? ascendantIndex : 0

    signOrder.forEach((sign, index) => {
      // Ajustando o ângulo para colocar o ascendente à esquerda (9h)
      const adjustedIndex = (index - effectiveAscendantIndex + 12) % 12
      const startAngle = adjustedIndex * anglePerSign - 90 // -90 para começar às 12h
      const endAngle = startAngle + anglePerSign

      // Conversão para radianos
      const startRadians = (startAngle * Math.PI) / 180
      const endRadians = (endAngle * Math.PI) / 180

      // Cálculo dos pontos para o arco
      const x1 = center + radius * Math.cos(startRadians)
      const y1 = center + radius * Math.sin(startRadians)
      const x2 = center + radius * Math.cos(endRadians)
      const y2 = center + radius * Math.sin(endRadians)

      // Determina se o arco é "maior" (mais de 180 graus)
      const largeArcFlag = 0 // Sempre 0 para arcos menores que 180 graus

      // Caminho do arco
      const path = `
        M ${center} ${center}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `

      // Calcular posição do texto
      const textRadius = radius * 0.85
      const textAngle = startAngle + anglePerSign / 2
      const textRadians = (textAngle * Math.PI) / 180
      const textX = center + textRadius * Math.cos(textRadians)
      const textY = center + textRadius * Math.sin(textRadians)

      // Cor baseada no elemento
      const backgroundColor = elementColors[zodiacElements[sign]] || "#FFFFFF"

      segments.push({
        path,
        sign,
        textX,
        textY,
        backgroundColor,
        index: adjustedIndex,
      })
    })

    return segments
  }

  // Posiciona os planetas na roda do zodíaco
  const positionPlanets = () => {
    if (!astralData.planets || !Array.isArray(astralData.planets) || astralData.planets.length === 0) {
      return []
    }

    const planets = []
    const anglePerSign = 360 / 12
    const ascendantIndex = signOrder.findIndex((sign) => sign === astralData.ascendant)

    // Se o ascendente não for encontrado, usar Áries como padrão
    const effectiveAscendantIndex = ascendantIndex !== -1 ? ascendantIndex : 0

    // Agrupar planetas por signo e grau para evitar sobreposição
    const planetGroups = {}

    astralData.planets.forEach((planet) => {
      if (!planet || !planet.sign) return

      const signIndex = signOrder.findIndex((sign) => sign === planet.sign)
      if (signIndex === -1) return

      const key = `${signIndex}-${Math.floor((planet.degree || 0) / 5)}`
      if (!planetGroups[key]) {
        planetGroups[key] = []
      }
      planetGroups[key].push(planet)
    })

    // Posicionar cada grupo de planetas
    Object.entries(planetGroups).forEach(([key, planetGroup], groupIndex) => {
      const [signIndexStr] = key.split("-")
      const signIndex = Number.parseInt(signIndexStr)

      planetGroup.forEach((planet, planetIndex) => {
        // Ajustando o ângulo para alinhar com o ascendente
        const adjustedIndex = (signIndex - effectiveAscendantIndex + 12) % 12
        const baseAngle = adjustedIndex * anglePerSign - 90

        // Distribuir planetas no mesmo grupo
        const spreadFactor = 0.2 // Espaçamento entre planetas no mesmo grupo
        const angleOffset = (planetIndex - (planetGroup.length - 1) / 2) * spreadFactor * anglePerSign

        // Ângulo final considerando posição no signo e ajuste para evitar sobreposição
        const finalAngle = baseAngle + ((planet.degree || 0) / 30) * anglePerSign + angleOffset

        // Distância do centro (planetas mais afastados para evitar sobreposição)
        const planetRadius = radius * (0.5 + 0.05 * planetIndex)

        // Conversão para radianos
        const radians = (finalAngle * Math.PI) / 180

        // Posição do planeta
        const planetX = center + planetRadius * Math.cos(radians)
        const planetY = center + planetRadius * Math.sin(radians)

        planets.push({
          ...planet,
          x: planetX,
          y: planetY,
          color: planetColors[planet.name] || "#000000",
        })
      })
    })

    return planets
  }

  const zodiacSegments = createZodiacSegments()
  const planetPositions = positionPlanets()

  return (
    <div className="astral-chart-container">
      <h3>Mapa Astral Visual</h3>
      <div className="chart-wrapper">
        <svg
          width={chartSize}
          height={chartSize}
          viewBox={`0 0 ${chartSize} ${chartSize}`}
          className="astral-chart"
          aria-label="Mapa astral visual"
        >
          {/* Círculo externo */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#333" strokeWidth="2" />

          {/* Círculo interno */}
          <circle
            cx={center}
            cy={center}
            r={radius * 0.7}
            fill="none"
            stroke="#333"
            strokeWidth="1"
            strokeDasharray="5,5"
          />

          {/* Segmentos do zodíaco */}
          {zodiacSegments.map((segment, i) => (
            <g key={`segment-${i}`}>
              <path d={segment.path} fill={segment.backgroundColor} stroke="#333" strokeWidth="1" />
              <text
                x={segment.textX}
                y={segment.textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={chartSize * 0.03}
                fontWeight="bold"
              >
                {zodiacSymbols[segment.sign] || ""} {segment.sign}
              </text>
              <text
                x={center}
                y={center}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={chartSize * 0.05}
                fontWeight="bold"
                fill="#444"
              >
                {astralData.name || "Mapa Astral"}
              </text>
            </g>
          ))}

          {/* Linhas das casas */}
          {zodiacSegments.map((segment, i) => {
            const angle = ((segment.index * 30 - 90) * Math.PI) / 180
            const x2 = center + radius * Math.cos(angle)
            const y2 = center + radius * Math.sin(angle)

            return <line key={`line-${i}`} x1={center} y1={center} x2={x2} y2={y2} stroke="#333" strokeWidth="1" />
          })}

          {/* Planetas */}
          {planetPositions.map((planet, i) => (
            <g key={`planet-${i}`} className="planet-symbol">
              <circle
                cx={planet.x}
                cy={planet.y}
                r={chartSize * 0.02}
                fill={planet.color}
                stroke="#333"
                strokeWidth="1"
              />
              <text
                x={planet.x}
                y={planet.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={chartSize * 0.025}
                fill="#000"
                fontWeight="bold"
              >
                {planetSymbols[planet.name] || ""}
              </text>
              <title>{`${planet.name} em ${planet.sign} a ${planet.degree}°`}</title>
            </g>
          ))}
        </svg>
      </div>

      <div className="chart-legend">
        <h4>Legenda</h4>
        <div className="legend-container">
          <div className="legend-planets">
            {Object.entries(planetSymbols).map(([planet, symbol]) => (
              <div key={planet} className="legend-item">
                <span className="planet-dot" style={{ backgroundColor: planetColors[planet] }}>
                  {symbol}
                </span>
                <span>{planet}</span>
              </div>
            ))}
          </div>

          <div className="legend-elements">
            {Object.entries(elementColors).map(([element, color]) => (
              <div key={element} className="element-item">
                <span className="element-color" style={{ backgroundColor: color }}></span>
                <span>{element.charAt(0).toUpperCase() + element.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AstralChart

