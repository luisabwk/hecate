const ephemeris = require("ephemeris")

// Função para calcular o signo baseado na posição do Sol
function getSunSign(sunLongitude) {
  const signDegrees = 30
  const signIndex = Math.floor(sunLongitude / signDegrees)
  const signs = [
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
  return signs[signIndex % 12] // Garantir que o índice esteja dentro do intervalo
}

// Função para calcular o signo lunar
function getMoonSign(moonLongitude) {
  const signDegrees = 30
  const signIndex = Math.floor(moonLongitude / signDegrees)
  const signs = [
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
  return signs[signIndex % 12] // Garantir que o índice esteja dentro do intervalo
}

// Função para calcular o ascendente com ephemeris
function getAscendant(date, latitude, longitude) {
  try {
    const result = ephemeris.getAllPlanets(date, longitude, latitude)
    const ascendantLongitude = result.house.ascendant

    // Converte o grau para signo
    const signDegrees = 30
    const signIndex = Math.floor(ascendantLongitude / signDegrees)
    const signs = [
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
    return signs[signIndex % 12] // Garantir que o índice esteja dentro do intervalo
  } catch (error) {
    console.error("Erro ao calcular ascendente:", error)
    return "Desconhecido"
  }
}

// Função para calcular posições planetárias usando ephemeris
function calculatePlanetPositions(date, latitude, longitude) {
  try {
    // Calcula as posições usando ephemeris
    const result = ephemeris.getAllPlanets(date, longitude, latitude)

    // Mapeia os resultados para o formato que estamos usando
    const planetMap = {
      sun: { name: "Sol" },
      moon: { name: "Lua" },
      mercury: { name: "Mercúrio" },
      venus: { name: "Vênus" },
      mars: { name: "Marte" },
      jupiter: { name: "Júpiter" },
      saturn: { name: "Saturno" },
      uranus: { name: "Urano" },
      neptune: { name: "Netuno" },
      pluto: { name: "Plutão" },
    }

    const positions = []

    // Para cada planeta, extraímos a longitude e convertemos para o formato desejado
    Object.entries(planetMap).forEach(([key, planetInfo]) => {
      if (result[key]) {
        const longitude = result[key].apparentLongitude

        // Calcula o signo
        const signDegrees = 30
        const signIndex = Math.floor(longitude / signDegrees) % 12 // Garantir que o índice esteja dentro do intervalo
        const signs = [
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

        // Calcula o grau no signo
        const degree = Math.floor(longitude % signDegrees)

        positions.push({
          name: planetInfo.name,
          sign: signs[signIndex],
          degree: degree,
          // Adicionamos a propriedade retrógrada se disponível
          retrograde: result[key].retrograde,
        })
      }
    })

    return positions
  } catch (error) {
    console.error("Erro ao calcular posições planetárias:", error)
    return []
  }
}

// Função para calcular aspectos planetários
function calculateAspects(planets) {
  try {
    const aspects = []
    const aspectTypes = {
      conjunção: { angle: 0, orb: 8 },
      sextil: { angle: 60, orb: 4 },
      quadratura: { angle: 90, orb: 6 },
      trígono: { angle: 120, orb: 6 },
      oposição: { angle: 180, orb: 8 },
    }

    // Converte o signo e grau para longitude total em graus
    function getPlanetLongitude(planet) {
      const signs = [
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

      const signIndex = signs.indexOf(planet.sign)
      if (signIndex === -1) return 0

      return signIndex * 30 + planet.degree
    }

    // Calcula a diferença angular entre dois pontos no zodíaco
    function getAngleDifference(angle1, angle2) {
      let diff = Math.abs(angle1 - angle2) % 360
      if (diff > 180) diff = 360 - diff
      return diff
    }

    // Verifica todos os pares de planetas
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const planet1 = planets[i]
        const planet2 = planets[j]

        const longitude1 = getPlanetLongitude(planet1)
        const longitude2 = getPlanetLongitude(planet2)
        const angleDiff = getAngleDifference(longitude1, longitude2)

        // Verifica cada tipo de aspecto
        for (const [aspectType, aspectInfo] of Object.entries(aspectTypes)) {
          const orb = Math.abs(angleDiff - aspectInfo.angle)

          if (orb <= aspectInfo.orb) {
            aspects.push({
              planet1: planet1.name,
              planet2: planet2.name,
              aspectType,
              orb: orb.toFixed(2),
            })
            break // Um par de planetas só pode ter um tipo de aspecto
          }
        }
      }
    }

    return aspects
  } catch (error) {
    console.error("Erro ao calcular aspectos planetários:", error)
    return []
  }
}

module.exports = {
  getSunSign,
  getMoonSign,
  getAscendant,
  calculatePlanetPositions,
  calculateAspects,
}

