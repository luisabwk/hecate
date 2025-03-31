import { createClient } from "@supabase/supabase-js"

// Inicializa o cliente Supabase com as variáveis de ambiente
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("As variáveis de ambiente do Supabase não estão configuradas.")
}

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para autenticação com email/senha
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao fazer login:", error.message)
    throw error
  }
}

// Função para cadastro de usuário
export const signUpWithEmail = async (email, password, name) => {
  try {
    // Primeiro, registra o usuário na auth do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // Em seguida, adiciona o nome à tabela users personalizada
    const { error: profileError } = await supabase.from("users").insert([{ id: authData.user.id, name, email }])

    if (profileError) throw profileError

    return authData
  } catch (error) {
    console.error("Erro ao criar conta:", error.message)
    throw error
  }
}

// Função para logout
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error("Erro ao fazer logout:", error.message)
    throw error
  }
}

// Função para obter usuário atual
export const getCurrentUser = async () => {
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error.message)
    return null
  }
}

// Função para salvar um mapa astral
export const saveAstralChart = async (chartData) => {
  try {
    // Obter o usuário atual
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) throw new Error("Usuário não autenticado")

    const userId = userData.user.id

    // Preparar dados principais do mapa
    const chartMainData = {
      user_id: userId,
      name: chartData.name,
      birth_date: chartData.birthDate,
      birth_time: chartData.birthTime,
      birth_place: chartData.birthPlace,
      latitude: chartData.latitude,
      longitude: chartData.longitude,
      sun_sign: chartData.sunSign,
      moon_sign: chartData.moonSign,
      ascendant: chartData.ascendant,
      julian_day: chartData.julianDay,
      interpretation: chartData.interpretation,
    }

    // Inserir dados principais do mapa
    const { data: chartResult, error: chartError } = await supabase
      .from("astral_charts")
      .insert([chartMainData])
      .select()

    if (chartError) throw chartError

    const chartId = chartResult[0].id

    // Inserir posições planetárias
    if (chartData.planets && chartData.planets.length > 0) {
      const planetData = chartData.planets.map((planet) => ({
        chart_id: chartId,
        planet_name: planet.name,
        sign: planet.sign,
        degree: planet.degree,
        retrograde: planet.retrograde || false,
        house: planet.house,
      }))

      const { error: planetError } = await supabase.from("planet_positions").insert(planetData)

      if (planetError) throw planetError
    }

    // Inserir aspectos planetários se existirem
    if (chartData.aspects && chartData.aspects.length > 0) {
      const aspectData = chartData.aspects.map((aspect) => ({
        chart_id: chartId,
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        aspect_type: aspect.aspectType,
        orb: aspect.orb,
      }))

      const { error: aspectError } = await supabase.from("planet_aspects").insert(aspectData)

      if (aspectError) throw aspectError
    }

    // Inserir casas astrológicas se existirem
    if (chartData.houses && chartData.houses.length > 0) {
      const houseData = chartData.houses.map((house) => ({
        chart_id: chartId,
        house_number: house.houseNumber,
        sign: house.sign,
        degree: house.degree,
      }))

      const { error: houseError } = await supabase.from("houses").insert(houseData)

      if (houseError) throw houseError
    }

    return chartResult[0]
  } catch (error) {
    console.error("Erro ao salvar mapa astral:", error.message)
    throw error
  }
}

// Função para obter todos os mapas astrais do usuário
export const getUserAstralCharts = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) throw new Error("Usuário não autenticado")

    const { data, error } = await supabase
      .from("full_charts")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao obter mapas astrais:", error.message)
    throw error
  }
}

// Função para obter um mapa astral específico
export const getAstralChart = async (chartId) => {
  try {
    const { data, error } = await supabase.from("full_charts").select("*").eq("id", chartId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error(`Erro ao obter mapa astral ${chartId}:`, error.message)
    throw error
  }
}

// Configuração de Axios para API base URL
import axios from "axios"
axios.defaults.baseURL = "http://localhost:8080"

// Função para excluir um mapa astral
export const deleteAstralChart = async (chartId) => {
  try {
    const { error } = await supabase.from("astral_charts").delete().eq("id", chartId)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Erro ao excluir mapa astral ${chartId}:`, error.message)
    throw error
  }
}

// Função para atualizar um mapa astral
export const updateAstralChart = async (chartId, chartData) => {
  try {
    // Atualizar dados principais do mapa
    const { error: chartError } = await supabase
      .from("astral_charts")
      .update({
        name: chartData.name,
        interpretation: chartData.interpretation,
      })
      .eq("id", chartId)

    if (chartError) throw chartError

    return await getAstralChart(chartId)
  } catch (error) {
    console.error(`Erro ao atualizar mapa astral ${chartId}:`, error.message)
    throw error
  }
}

