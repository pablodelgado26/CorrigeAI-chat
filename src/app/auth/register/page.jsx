'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../components/Toast/index.jsx'
import Loading from '../../../components/Loading'
import styles from './auth.module.css'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      showError('Por favor, preencha todos os campos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      showError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    
    setLoading(true)

    try {
      const result = await register(formData.name, formData.email, formData.password)
      
      if (result.success) {
        showSuccess('Cadastro realizado com sucesso!')
        router.push('/')
      } else {
        showError(result.error || 'Erro no cadastro')
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      showError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logoContainer}>
            <span className={styles.logoIcon}>🏫</span>
            <div className={styles.brandInfo}>
              <h1 className={styles.brandName}>CorrigeAI</h1>
              <p className={styles.brandSubtitle}>Escola SESI</p>
            </div>
          </div>
          <h1>Criar Conta</h1>
          <p>Cadastre-se para começar a usar o chat</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nome</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Seu nome"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Sua senha (mín. 6 caracteres)"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirme sua senha"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <Loading size="small" color="white" />
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p>
            Já tem uma conta?{' '}
            <Link href="/auth/login" className={styles.authLink}>
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
