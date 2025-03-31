"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom"
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import axios from "axios"
import { supabase, getCurrentUser, signInWithEmail, signUpWithEmail, signOut } from "./supabaseClient"
import AstralChart from "./components/AstralChart"
import ChartDetail from "./components/ChartDetail"
import PrivateRoute from "./components/PrivateRoute"
import "./App.css"

// Componente PDF para download do mapa astral
const AstralPDF = ({ astralData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Mapa Astral</Text>
        <Text style={styles.subtitle}>Gerado para: {astralData.name}</Text>
        <Text style={styles.date}>Data: {new Date().toLocaleDateString()}</Text>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>
          <Text>Nome: {astralData.name}</Text>
          <Text>Data de Nascimento: {astralData.birthDate}</Text>
          <Text>Hora de Nascimento: {astralData.birthTime}</Text>
          <Text>Local de Nascimento: {astralData.birthPlace}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Elementos Principais</Text>
          <Text>Signo Solar: {astralData.sunSign}</Text>
          <Text>Signo Ascendente: {astralData.ascendant}</Text>
          <Text>Signo Lunar: {astralData.moonSign}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Posições Planetárias</Text>
          {astralData.planets &&
            astralData.planets.map((planet, index) => (
              <Text key={index}>
                {planet.name}: {planet.sign} ({planet.degree}°)
              </Text>
            ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Interpretação Personalizada</Text>
          <Text>{astralData.interpretation}</Text>
        </View>
      </View>
    </Page>
  </Document>
)

// Estilos para o PDF
const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: "#FFFFFF" },
  section: { marginBottom: 10 },
  title: { fontSize: 24, textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 5 },
  date: { fontSize: 12, textAlign: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 10, marginTop: 15, fontWeight: "bold" },
  infoSection: { marginBottom: 15 },
})

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/charts/:chartId"
          element={
            <PrivateRoute>
              <ChartDetail />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  )
}

// Componente principal para a página inicial
function Home() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }

    checkUser()

    // Listener para mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        setUser(session?.user || null)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <div className="app-container">
      <header>
        <h1>Gerador de Mapa Astral com IA</h1>
        <p>Descubra os segredos do seu mapa astral com análise personalizada</p>

        <div className="auth-buttons">
          {user ? (
            <>
              <button onClick={() => navigate("/dashboard")} className="dashboard-btn">
                Meu Painel
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Sair
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")} className="login-btn">
                Entrar
              </button>
              <button onClick={() => navigate("/signup")} className="signup-btn">
                Criar Conta
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        <GeneratorForm user={user} />
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} Mapa Astral com IA. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

// Componente para o formulário de geração de mapa astral
function GeneratorForm({ user }) {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  })
  const [astralData, setAstralData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaveSuccess(false)

    try {
      // Inclui o ID do usuário se estiver autenticado
      const requestData = {
        ...formData,
        userId: user?.id,
      }

      const response = await axios.post("http://localhost:8080/api/astral-map", requestData)
      setAstralData(response.data)

      // Se houver um ID no mapa retornado, significa que foi salvo no Supabase
      if (user && response.data.id) {
        setSaveSuccess(true)
      }
    } catch (err) {
      setError("Erro ao gerar mapa astral. Por favor, tente novamente.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="generator-section">
      <section className="form-section">
        <h2>Insira seus dados</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">Data de Nascimento</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthTime">Hora de Nascimento</label>
            <input
              type="time"
              id="birthTime"
              name="birthTime"
              value={formData.birthTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthPlace">Local de Nascimento</label>
            <input
              type="text"
              id="birthPlace"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleChange}
              placeholder="Cidade, Estado, País"
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Gerando..." : "Gerar Mapa Astral"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
        {saveSuccess && (
          <div className="success-message">Mapa astral salvo com sucesso! Você pode acessá-lo no seu painel.</div>
        )}
      </section>

      {astralData && (
        <section className="result-section">
          <h2>Seu Mapa Astral</h2>

          {/* Componente de diagrama visual */}
          <AstralChart astralData={astralData} />

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
                  <td>{astralData.sunSign}</td>
                </tr>
                <tr>
                  <td>Lua</td>
                  <td>{astralData.moonSign}</td>
                </tr>
                <tr>
                  <td>Ascendente</td>
                  <td>{astralData.ascendant}</td>
                </tr>
                <tr>
                  <td>Mercúrio</td>
                  <td>{astralData.planets.find((p) => p.name === "Mercúrio")?.sign}</td>
                </tr>
                <tr>
                  <td>Vênus</td>
                  <td>{astralData.planets.find((p) => p.name === "Vênus")?.sign}</td>
                </tr>
                <tr>
                  <td>Marte</td>
                  <td>{astralData.planets.find((p) => p.name === "Marte")?.sign}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="astral-interpretation">
            <h3>Interpretação</h3>
            <p>{astralData.interpretation}</p>
          </div>

          <div className="download-section">
            <PDFDownloadLink
              document={<AstralPDF astralData={astralData} />}
              fileName={`mapa-astral-${astralData.name.replace(/\s+/g, "-").toLowerCase()}.pdf`}
              className="download-btn"
            >
              {({ loading }) => (loading ? "Preparando PDF..." : "Baixar Mapa Astral Completo (PDF)")}
            </PDFDownloadLink>
          </div>
        </section>
      )}
    </section>
  )
}

// Componente de Login
function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signInWithEmail(email, password)
      navigate("/dashboard")
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>Gerador de Mapa Astral com IA</h1>
        <p>Descubra os segredos do seu mapa astral com análise personalizada</p>
      </header>

      <main>
        <section className="auth-section">
          <h2>Entrar</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-links">
            <p>
              Não tem uma conta? <Link to="/signup">Criar conta</Link>
            </p>
            <p>
              <Link to="/">Voltar à página inicial</Link>
            </p>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} Mapa Astral com IA. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

// Componente de Cadastro
function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    try {
      await signUpWithEmail(email, password, name)
      navigate("/dashboard")
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>Gerador de Mapa Astral com IA</h1>
        <p>Descubra os segredos do seu mapa astral com análise personalizada</p>
      </header>

      <main>
        <section className="auth-section">
          <h2>Criar Conta</h2>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}

          <div className="auth-links">
            <p>
              Já tem uma conta? <Link to="/login">Entrar</Link>
            </p>
            <p>
              <Link to="/">Voltar à página inicial</Link>
            </p>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} Mapa Astral com IA. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

// Componente de Painel do Usuário
function Dashboard() {
  const [userCharts, setUserCharts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserCharts = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          navigate("/login")
          return
        }

        const response = await axios.get(`/api/user/${user.id}/astral-charts`)
        setUserCharts(response.data)
      } catch (err) {
        setError("Erro ao carregar seus mapas astrais")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCharts()
  }, [navigate])

  const handleDeleteChart = async (chartId) => {
    if (window.confirm("Tem certeza que deseja excluir este mapa astral?")) {
      try {
        await axios.delete(`/api/astral-charts/${chartId}`)
        setUserCharts(userCharts.filter((chart) => chart.id !== chartId))
      } catch (err) {
        setError("Erro ao excluir mapa astral")
        console.error(err)
      }
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>Meu Painel</h1>
        <div className="nav-links">
          <Link to="/" className="back-link">
            Voltar à página inicial
          </Link>
        </div>
      </header>

      <main>
        <section className="dashboard-section">
          <h2>Meus Mapas Astrais</h2>

          {loading ? (
            <div className="loading-message">Carregando seus mapas astrais...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : userCharts.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não tem mapas astrais salvos.</p>
              <Link to="/" className="create-chart-btn">
                Criar meu primeiro mapa
              </Link>
            </div>
          ) : (
            <div className="charts-grid">
              {userCharts.map((chart) => (
                <div className="chart-card" key={chart.id}>
                  <div className="chart-header">
                    <h3>{chart.name}</h3>
                    <span className="chart-date">{new Date(chart.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="chart-summary">
                    <p>
                      <strong>Data de Nascimento:</strong> {chart.birth_date}
                    </p>
                    <p>
                      <strong>Sol:</strong> {chart.sun_sign}
                    </p>
                    <p>
                      <strong>Lua:</strong> {chart.moon_sign}
                    </p>
                    <p>
                      <strong>Ascendente:</strong> {chart.ascendant}
                    </p>
                  </div>

                  <div className="chart-actions">
                    <button onClick={() => navigate(`/charts/${chart.id}`)} className="view-btn">
                      Ver Detalhes
                    </button>
                    <button onClick={() => handleDeleteChart(chart.id)} className="delete-btn">
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} Mapa Astral com IA. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

export default App

