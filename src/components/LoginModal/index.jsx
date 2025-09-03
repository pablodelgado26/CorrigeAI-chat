'use client';

import { useState } from 'react';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erro quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Login attempt:', formData);
      // Aqui você implementaria a lógica real de login
      
      onClose();
    } catch (error) {
      setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Implementar login social
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.background}>
          <div className={styles.wave}></div>
          <div className={styles.wave}></div>
          <div className={styles.wave}></div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>Entrar no CorrigeAI</h2>
            <p className={styles.subtitle}>Acesse sua conta da ESCOLA SESI</p>
            <button className={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {errors.general && (
              <div className={styles.errorAlert}>
                {errors.general}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">
                📧 Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="seu.email@sesi.org.br"
                disabled={isLoading}
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">
                🔒 Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="Digite sua senha"
                disabled={isLoading}
              />
              {errors.password && (
                <span className={styles.errorText}>{errors.password}</span>
              )}
            </div>

            <div className={styles.options}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className={styles.checkbox}
                  disabled={isLoading}
                />
                <span className={styles.checkboxText}>Lembrar de mim</span>
              </label>
              
              <button type="button" className={styles.forgotLink}>
                Esqueceu a senha?
              </button>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.loading}>
                  <span className={styles.spinner}></span>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span>ou continue com</span>
          </div>

          <div className={styles.socialButtons}>
            <button 
              className={styles.socialBtn}
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
            >
              🔍 Google
            </button>
            <button 
              className={styles.socialBtn}
              onClick={() => handleSocialLogin('microsoft')}
              disabled={isLoading}
            >
              Ⓜ️ Microsoft
            </button>
          </div>

          <div className={styles.footer}>
            <p>
              Não tem uma conta?{' '}
              <button 
                className={styles.switchBtn}
                onClick={onSwitchToSignup}
                disabled={isLoading}
              >
                Criar conta
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
