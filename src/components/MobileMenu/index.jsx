'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import styles from './MobileMenu.module.css'

function MobileMenu({ isOpen, onClose, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('conversas')

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🤖 CorrigeAI</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Seção do usuário */}
        {user && (
          <div className={styles.userSection}>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </div>
            
            <div className={styles.accountActions}>
              <button className={styles.accountBtn}>
                <span className={styles.actionIcon}>👤</span>
                Meu Perfil
              </button>
              <button className={styles.accountBtn}>
                <span className={styles.actionIcon}>⚙️</span>
                Configurações
              </button>
              <button 
                className={`${styles.accountBtn} ${styles.logoutBtn}`}
                onClick={handleLogout}
              >
                <span className={styles.actionIcon}>🚪</span>
                Sair da Conta
              </button>
            </div>
          </div>
        )}

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'conversas' ? styles.active : ''}`}
            onClick={() => setActiveTab('conversas')}
          >
            💬 Conversas
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'sobre' ? styles.active : ''}`}
            onClick={() => setActiveTab('sobre')}
          >
            ℹ️ Sobre
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'conversas' && (
            <div className={styles.conversasList}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💬</div>
                <h3>Conversas Anteriores</h3>
                <p className={styles.emptyDescription}>
                  Suas conversas aparecerão aqui quando você começar a usar o chat.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sobre' && (
            <div className={styles.sobreContent}>
              <h3>Sobre o CorrigeAI</h3>
              <p className={styles.description}>
                O CorrigeAI é uma ferramenta avançada de inteligência artificial projetada para ajudar 
                na correção, criação e análise de diversos tipos de conteúdo.
              </p>

              <div className={styles.features}>
                <h4>Principais Funcionalidades:</h4>
                <ul>
                  <li>✅ Correção automática de textos</li>
                  <li>📄 Geração de PDFs formatados</li>
                  <li>🖼️ Análise de imagens</li>
                  <li>💬 Conversas contextuais</li>
                  <li>📱 Interface responsiva</li>
                </ul>
              </div>

              <div className={styles.audience}>
                <h4>Ideal para:</h4>
                <ul>
                  <li>👨‍🎓 Estudantes e pesquisadores</li>
                  <li>👨‍💼 Profissionais e empresas</li>
                  <li>👨‍🏫 Educadores e professores</li>
                  <li>✍️ Escritores e redatores</li>
                </ul>
              </div>

              <div className={styles.technology}>
                <h4>Tecnologia:</h4>
                <p>Powered by Google Gemini AI</p>
                <p>Interface desenvolvida com Next.js e React</p>
              </div>

              <Link href="/sobre" className={styles.moreInfoBtn} onClick={onClose}>
                Ver mais informações
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
