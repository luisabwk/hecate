const express = require("express")
const cors = require("cors")
const path = require("path")
const axios = require("axios")
const dotenv = require("dotenv")
const moment = require("moment")
const NodeGeocoder = require("node-geocoder")
const { createClient } = require("@supabase/supabase-js")
const ephemeris = require("ephemeris")
const fs = require("fs")

// Configuração de variáveis de ambiente
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080 // Mudando para 8080 para evitar conflitos

// Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Variáveis de ambiente do Supabase não configuradas. O armazenamento dos mapas astrais não funcionará.")
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL || true : "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())

// Servir arquivos estáticos apenas se o diretório de build existir
const buildPath = path.join(__dirname, "client/build")
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath))
}

// Configuração do geocoder para obter coordenadas geográficas
const geocoder = NodeGeocoder({
  provider: "openstreetmap",
})

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
  return signs[signIndex]
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
  return signs[signIndex]
}

// Função para calcular o ascendente com ephemeris
function getAscendant(date, latitude, longitude) {
  // Calculamos o RAMC (Right Ascension of the Midheaven)
  // e usamos a função arctg para derivar o ascendente

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
  return signs[signIndex]
}

// Função para calcular posições planetárias usando ephemeris
function calculatePlanetPositions(date, latitude, longitude) {
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
      const signIndex = Math.floor(longitude / signDegrees)
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
}

// Função para calcular aspectos planetários
function calculateAspects(planets) {
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
}

// Importação de rotas
const astralMapRoutes = require("./routes/astralMap")
const userChartRoutes = require("./routes/userCharts")

// Rotas da API
app.use("/api/astral-map", astralMapRoutes)
app.use("/api/user", userChartRoutes)

// Endpoint para servir uma página de teste
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "test.html"))
})

// Verificação de saúde da API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Para qualquer rota não definida, redireciona para o React app
// apenas se o diretório de build existir
app.get("*", (req, res) => {
  const buildPath = path.join(__dirname, "client/build", "index.html")
  if (fs.existsSync(buildPath)) {
    res.sendFile(buildPath)
  } else {
    res.status(404).send("Frontend not built yet. Please run npm run build-client first.")
  }
})

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err)
  res.status(500).json({
    message: "Ocorreu um erro interno no servidor",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  })
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`)

  // Verificar configurações críticas
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn(
      "⚠️ Variáveis de ambiente do Supabase não configuradas. O armazenamento dos mapas astrais não funcionará.",
    )
  }

  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "⚠️ Nenhuma chave de API de IA configurada (OpenAI ou Claude). As interpretações personalizadas não estarão disponíveis.",
    )
  }
})

// Tratamento de exceções não capturadas
process.on("uncaughtException", (err) => {
  console.error("Exceção não capturada:", err)
  // Em produção, você pode querer notificar um serviço de monitoramento aqui
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promessa rejeitada não tratada:", reason)
  // Em produção, você pode querer notificar um serviço de monitoramento aqui
})

module.exports = app

