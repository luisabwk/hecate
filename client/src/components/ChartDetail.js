"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { PDFDownloadLink } from "@react-pdf/renderer"
import axios from "axios"
import AstralChart from "./AstralChart"

const ChartDetail = () => {
  const [chart, setChart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { chartId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchChartDetails = async () => {
      try {
        const response = await axios.get(`/api/astral-charts/${chartId}`)
        setChart(response.data)
      } catch (err) {
        setError("Erro ao carregar dados do mapa astral")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchChartDetails()
  }, [chartId])

  if (loading) {
    return <div className="loading-message">Carregando dados do mapa astral...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (!chart) {
    return <div className="error-message">Mapa astral não encontrado</div>
  }

  // Formata os dados para o componente AstralChart
  const formattedChartData = {
    name: chart.name,
    sunSign: chart.sun_sign,
    moonSign: chart.moon_sign,
    ascendant: chart.ascendant,
    planets: chart.planets || [],
    interpretation: chart.interpretation,
  }

  return (
    <div className="app-container">
      <header>
        <h1>Detalhes do Mapa Astral</h1>
        <div className="nav-links">
          <button onClick={() => navigate("/dashboard")} className="back-link">
            Voltar ao Painel
          </button>
        </div>
      </header>

      <main>
        <section className="chart-detail-section">
          <div className="chart-title">
            <h2>{chart.name}</h2>
            <span className="chart-date">Criado em: {new Date(chart.created_at).toLocaleDateString()}</span>
          </div>

          <div className="birth-info">
            <p>
              <strong>Data de Nascimento:</strong> {chart.birth_date}
            </p>
            <p>
              <strong>Hora de Nascimento:</strong> {chart.birth_time}
            </p>
            <p>
              <strong>Local de Nascimento:</strong> {chart.birth_place}
            </p>
          </div>

          {/* Componente de diagrama visual */}
          <AstralChart astralData={formattedChartData} />

          <div className="chart-data">
            <div className="astral-summary">
              <h3>Resumo do Mapa</h3>
              <table>
                <thead>
                  <tr>
                    <th>Elemento</th>
                    <th>Posição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sol</td>
                    <td>{chart.sun_sign}</td>
                  </tr>
                  <tr>
                    <td>Lua</td>
                    <td>{chart.moon_sign}</td>
                  </tr>
                  <tr>
                    <td>Ascendente</td>
                    <td>{chart.ascendant}</td>
                  </tr>
                  {chart.planets &&
                    chart.planets.map((planet, index) => (
                      <tr key={index}>
                        <td>{planet.name}</td>
                        <td>
                          {planet.sign} ({planet.degree}°)
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="astral-interpretation">
              <h3>Interpretação</h3>
              <p>{chart.interpretation}</p>
            </div>

            <div className="download-section">
              <PDFDownloadLink
                document={<AstralPDF astralData={formattedChartData} />}
                fileName={`mapa-astral-${chart.name.replace(/\s+/g, "-").toLowerCase()}.pdf`}
                className="download-btn"
              >
                {({ loading }) => (loading ? "Preparando PDF..." : "Baixar Mapa Astral Completo (PDF)")}
              </PDFDownloadLink>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} Mapa Astral com IA. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

export default ChartDetail

