"use client"

import { useState, useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getCurrentUser } from "../supabaseClient"

const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verificando autenticação...</p>
      </div>
    )
  }

  if (!user) {
    // Redireciona para login, mas salva a localização atual para redirecionar de volta após o login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default PrivateRoute

