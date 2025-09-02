'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../components/Toast'
import Loading from '../../../components/Loading'
import styles from './auth.module.css'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
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
    
    if (!formData.email || !formData.password) {
      showError('Por favor, preencha todos os campos')
      return
    }
    
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        showSuccess('Login realizado com sucesso!')
        router.push('/')
      } else {
        showError(result.error || 'Erro no login')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      showError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Usar o método login do AuthContext
        login(data.user, data.token)
      } else {
        setError(data.error || 'Erro no login')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <h1>🤖 CorrigeAI</h1>
          <p>Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>
              ❌ {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Digite seu email"
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
              required
              placeholder="Digite sua senha"
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Não tem uma conta?{' '}
            <Link href="/auth/register" className={styles.link}>
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
