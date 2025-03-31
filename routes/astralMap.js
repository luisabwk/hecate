const express = require("express")
const router = express.Router()
const axios = require("axios")
const moment = require("moment")
const NodeGeocoder = require("node-geocoder")
const ephemeris = require("ephemeris")
const { createClient } = require("@supabase/supabase-js")
const {
  getSunSign,
  getMoonSign,
  getAscendant,
  calculatePlanetPositions,
  calculateAspects,
} = require("../utils/astrology")

// Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Configuração do geocoder para obter coordenadas geográficas
const geocoder = NodeGeocoder({
  provider: "openstreetmap",
})

// Endpoint para obter o mapa astral
router.post("/", async (req, res) => {
  try {
    const { name, birthDate, birthTime, birthPlace, userId } = req.body

    // Validação de entrada
    if (!name || !birthDate || !birthTime || !birthPlace) {
      return res.status(400).json({
        message: "Dados incompletos. Por favor, forneça nome, data, hora e local de nascimento.",
      })
    }

    // Converte data e hora para formato utilizável
    const birthDateTime = moment(`${birthDate} ${birthTime}`)

    if (!birthDateTime.isValid()) {
      return res.status(400).json({
        message: "Data ou hora de nascimento inválida",
      })
    }

    // Obtém coordenadas geográficas do local de nascimento
    const locations = await geocoder.geocode(birthPlace)

    if (!locations || locations.length === 0) {
      return res.status(400).json({ message: "Local de nascimento não encontrado" })
    }

    const location = locations[0]
    const { latitude, longitude } = location

    // Cria o objeto de data para ephemeris (formato JavaScript Date)
    const jsDate = new Date(birthDateTime.format("YYYY-MM-DD HH:mm:ss"))

    // Calculamos as posições planetárias usando ephemeris
    const planets = calculatePlanetPositions(jsDate, latitude, longitude)

    // Encontra o Sol e a Lua nas posições calculadas
    const sun = planets.find((p) => p.name === "Sol")
    const moon = planets.find((p) => p.name === "Lua")

    if (!sun || !moon) {
      return res.status(500).json({ message: "Erro ao calcular posições planetárias" })
    }

    // Calcula o ascendente usando ephemeris
    const ascendant = getAscendant(jsDate, latitude, longitude)

    // Calcula as casas astrológicas
    const houses = []

    // Usando ephemeris para obter as casas astrológicas
    const ephemerisResult = ephemeris.getAllPlanets(jsDate, longitude, latitude)

    for (let i = 1; i <= 12; i++) {
      const houseCusp = ephemerisResult.house.cusp[i]
      const signIndex = Math.floor(houseCusp / 30)
      const degree = houseCusp % 30

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

      houses.push({
        houseNumber: i,
        sign: signs[signIndex],
        degree: degree,
      })
    }

    // Calcula aspectos planetários
    const aspects = calculateAspects(planets)

    // Gera interpretação personalizada usando IA (Claude ou OpenAI)
    let interpretationText = ""

    try {
      // Verifica qual API utilizar (Claude ou OpenAI)
      const useClaudeAPI = !!process.env.ANTHROPIC_API_KEY

      if (useClaudeAPI) {
        // Usando a API da Anthropic (Claude)
        const response = await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: "claude-3-haiku-20240307",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: `Como astrólogo profissional, faça uma interpretação detalhada e personalizada do mapa astral com os seguintes elementos:
                Nome: ${name}
                Data de Nascimento: ${birthDate}
                Hora de Nascimento: ${birthTime}
                Local de Nascimento: ${birthPlace}
                Signo Solar: ${sun.sign}
                Signo Lunar: ${moon.sign}
                Ascendente: ${ascendant}
                Posições Planetárias: ${planets.map((p) => `${p.name} em ${p.sign}`).join(", ")}
                
                Por favor, forneça uma interpretação abrangente, mas concisa (máximo 800 palavras), que inclua:
                1. Características da personalidade baseadas no signo solar, lunar e ascendente
                2. Influências principais dos planetas em suas posições
                3. Potenciais desafios e forças
                4. Recomendações para crescimento pessoal
                
                Mantenha um tom positivo e construtivo.`,
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
            },
          },
        )

        interpretationText = response.data.content[0].text
      } else if (process.env.OPENAI_API_KEY) {
        // Usando a API da OpenAI
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "Você é um astrólogo profissional especializado em interpretação de mapas astrais.",
              },
              {
                role: "user",
                content: `Faça uma interpretação detalhada e personalizada do mapa astral com os seguintes elementos:
                Nome: ${name}
                Data de Nascimento: ${birthDate}
                Hora de Nascimento: ${birthTime}
                Local de Nascimento: ${birthPlace}
                Signo Solar: ${sun.sign}
                Signo Lunar: ${moon.sign}
                Ascendente: ${ascendant}
                Posições Planetárias: ${planets.map((p) => `${p.name} em ${p.sign}`).join(", ")}
                
                Por favor, forneça uma interpretação abrangente, mas concisa (máximo 800 palavras), que inclua:
                1. Características da personalidade baseadas no signo solar, lunar e ascendente
                2. Influências principais dos planetas em suas posições
                3. Potenciais desafios e forças
                4. Recomendações para crescimento pessoal
                
                Mantenha um tom positivo e construtivo.`,
              },
            ],
            max_tokens: 1000,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          },
        )

        interpretationText = response.data.choices[0].message.content
      } else {
        interpretationText =
          "Interpretação não disponível. Configure uma chave de API (OpenAI ou Claude) para obter interpretações personalizadas."
      }
    } catch (error) {
      console.error("Erro ao obter interpretação da IA:", error)
      interpretationText =
        "Não foi possível gerar a interpretação. Por favor, verifique sua chave de API e tente novamente."
    }

    // Cria o objeto de resposta final
    const astralMapData = {
      name,
      birthDate,
      birthTime,
      birthPlace,
      latitude,
      longitude,
      sunSign: sun.sign,
      moonSign: moon.sign,
      ascendant,
      planets,
      houses,
      aspects,
      interpretation: interpretationText,
    }

    // Salva no Supabase se o cliente estiver configurado e o userId for fornecido
    let savedChartId = null

    if (supabase && userId) {
      try {
        // Dados do mapa principal
        const chartMainData = {
          user_id: userId,
          name: name,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_place: birthPlace,
          latitude: latitude,
          longitude: longitude,
          sun_sign: sun.sign,
          moon_sign: moon.sign,
          ascendant: ascendant,
          interpretation: interpretationText,
        }

        // Insere na tabela astral_charts
        const { data: chartResult, error: chartError } = await supabase
          .from("astral_charts")
          .insert([chartMainData])
          .select()

        if (chartError) throw chartError

        savedChartId = chartResult[0].id

        // Insere posições planetárias
        const planetData = planets.map((planet) => ({
          chart_id: savedChartId,
          planet_name: planet.name,
          sign: planet.sign,
          degree: planet.degree,
          retrograde: planet.retrograde || false,
        }))

        const { error: planetError } = await supabase.from("planet_positions").insert(planetData)

        if (planetError) throw planetError

        // Insere casas astrológicas
        const houseData = houses.map((house) => ({
          chart_id: savedChartId,
          house_number: house.houseNumber,
          sign: house.sign,
          degree: house.degree,
        }))

        const { error: houseError } = await supabase.from("houses").insert(houseData)

        if (houseError) throw houseError

        // Insere aspectos planetários
        if (aspects && aspects.length > 0) {
          const aspectData = aspects.map((aspect) => ({
            chart_id: savedChartId,
            planet1: aspect.planet1,
            planet2: aspect.planet2,
            aspect_type: aspect.aspectType,
            orb: aspect.orb,
          }))

          const { error: aspectError } = await supabase.from("planet_aspects").insert(aspectData)

          if (aspectError) throw aspectError
        }

        console.log(`Mapa astral salvo com sucesso. ID: ${savedChartId}`)
      } catch (dbError) {
        console.error("Erro ao salvar no Supabase:", dbError)
        // Não falha o endpoint se o salvamento falhar
      }
    }

    // Inclui o ID salvo na resposta, se disponível
    if (savedChartId) {
      astralMapData.id = savedChartId
    }

    res.json(astralMapData)
  } catch (error) {
    console.error("Erro ao gerar mapa astral:", error)
    res.status(500).json({ message: "Erro ao gerar mapa astral", error: error.message })
  }
})

module.exports = router

