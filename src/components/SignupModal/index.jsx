'use client';

import { useState } from 'react';
import styles from './SignupModal.module.css';

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    receiveUpdates: false
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
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter ao menos 1 letra minúscula, 1 maiúscula e 1 número';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Signup attempt:', formData);
      // Aqui você implementaria a lógica real de registro
      
      onClose();
    } catch (error) {
      setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider) => {
    console.log(`Signup with ${provider}`);
    // Implementar registro social
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
            <h2 className={styles.title}>Criar Conta SESI</h2>
            <p className={styles.subtitle}>Junte-se à comunidade educacional CorrigeAI</p>
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

            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="firstName">
                  👤 Nome
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                  placeholder="Seu nome"
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <span className={styles.errorText}>{errors.firstName}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="lastName">
                  👥 Sobrenome
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                  placeholder="Seu sobrenome"
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <span className={styles.errorText}>{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">
                📧 Email institucional
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
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
              />
              {errors.password && (
                <span className={styles.errorText}>{errors.password}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="confirmPassword">
                🔐 Confirmar senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                placeholder="Digite a senha novamente"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <span className={styles.errorText}>{errors.confirmPassword}</span>
              )}
            </div>

            <div className={styles.checkboxes}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className={styles.checkbox}
                  disabled={isLoading}
                />
                <span className={styles.checkboxText}>
                  Aceito os <button type="button" className={styles.linkBtn}>termos de uso</button> e 
                  <button type="button" className={styles.linkBtn}> política de privacidade</button>
                </span>
              </label>
              {errors.acceptTerms && (
                <span className={styles.errorText}>{errors.acceptTerms}</span>
              )}
              
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="receiveUpdates"
                  checked={formData.receiveUpdates}
                  onChange={handleChange}
                  className={styles.checkbox}
                  disabled={isLoading}
                />
                <span className={styles.checkboxText}>
                  Quero receber atualizações sobre novos recursos
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.loading}>
                  <span className={styles.spinner}></span>
                  Criando conta...
                </span>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span>ou cadastre-se com</span>
          </div>

          <div className={styles.socialButtons}>
            <button 
              className={styles.socialBtn}
              onClick={() => handleSocialSignup('google')}
              disabled={isLoading}
            >
              🔍 Google
            </button>
            <button 
              className={styles.socialBtn}
              onClick={() => handleSocialSignup('microsoft')}
              disabled={isLoading}
            >
              Ⓜ️ Microsoft
            </button>
          </div>

          <div className={styles.footer}>
            <p>
              Já tem uma conta?{' '}
              <button 
                className={styles.switchBtn}
                onClick={onSwitchToLogin}
                disabled={isLoading}
              >
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
