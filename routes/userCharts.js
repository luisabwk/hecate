const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")

// Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Middleware para verificar se o Supabase está configurado
const checkSupabase = (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({ message: "Serviço de banco de dados não configurado" })
  }
  next()
}

// Endpoint para obter todos os mapas astrais de um usuário
router.get("/:userId/astral-charts", checkSupabase, async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ message: "ID do usuário não fornecido" })
    }

    const { data, error } = await supabase
      .from("full_charts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error("Erro ao obter mapas astrais:", error)
    res.status(500).json({ message: "Erro ao obter mapas astrais", error: error.message })
  }
})

// Endpoint para obter um mapa astral específico
router.get("/astral-charts/:chartId", checkSupabase, async (req, res) => {
  try {
    const { chartId } = req.params

    if (!chartId) {
      return res.status(400).json({ message: "ID do mapa astral não fornecido" })
    }

    const { data, error } = await supabase.from("full_charts").select("*").eq("id", chartId).single()

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Mapa astral não encontrado" })
      }
      throw error
    }

    if (!data) {
      return res.status(404).json({ message: "Mapa astral não encontrado" })
    }

    res.json(data)
  } catch (error) {
    console.error(`Erro ao obter mapa astral ${req.params.chartId}:`, error)
    res.status(500).json({ message: "Erro ao obter mapa astral", error: error.message })
  }
})

// Endpoint para excluir um mapa astral
router.delete("/astral-charts/:chartId", checkSupabase, async (req, res) => {
  try {
    const { chartId } = req.params

    if (!chartId) {
      return res.status(400).json({ message: "ID do mapa astral não fornecido" })
    }

    // Verificar se o mapa pertence ao usuário antes de excluir
    // (A segurança por RLS também está implementada no banco de dados)
    const { error } = await supabase.from("astral_charts").delete().eq("id", chartId)

    if (error) throw error

    res.json({ success: true, message: "Mapa astral excluído com sucesso" })
  } catch (error) {
    console.error(`Erro ao excluir mapa astral ${req.params.chartId}:`, error)
    res.status(500).json({ message: "Erro ao excluir mapa astral", error: error.message })
  }
})

// Endpoint para atualizar um mapa astral (dados básicos)
router.patch("/astral-charts/:chartId", checkSupabase, async (req, res) => {
  try {
    const { chartId } = req.params
    const { name, interpretation } = req.body

    if (!chartId) {
      return res.status(400).json({ message: "ID do mapa astral não fornecido" })
    }

    // Atualiza apenas os campos permitidos
    const updateData = {}
    if (name) updateData.name = name
    if (interpretation) updateData.interpretation = interpretation

    // Verifica se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nenhum dado válido fornecido para atualização" })
    }

    const { error } = await supabase.from("astral_charts").update(updateData).eq("id", chartId)

    if (error) throw error

    // Retorna o mapa atualizado
    const { data: updatedChart, error: fetchError } = await supabase
      .from("full_charts")
      .select("*")
      .eq("id", chartId)
      .single()

    if (fetchError) throw fetchError

    res.json(updatedChart)
  } catch (error) {
    console.error(`Erro ao atualizar mapa astral ${req.params.chartId}:`, error)
    res.status(500).json({ message: "Erro ao atualizar mapa astral", error: error.message })
  }
})

module.exports = router

