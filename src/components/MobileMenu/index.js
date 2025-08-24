'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './MobileMenu.module.css'

export default function MobileMenu({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('conversas')

  const conversas = [
    { 
      id: 1, 
      titulo: 'Correção de texto acadêmico', 
      preview: 'Ajuda com correção de artigo científico...', 
      data: '2024-01-15',
      messageCount: 12
    },
    { 
      id: 2, 
      titulo: 'PDF sobre Física Quântica', 
      preview: 'Criação de material didático sobre mecânica...', 
      data: '2024-01-14',
      messageCount: 8
    },
    { 
      id: 3, 
      titulo: 'Programação em React', 
      preview: 'Explicação sobre hooks e components...', 
      data: '2024-01-13',
      messageCount: 15
    },
    { 
      id: 4, 
      titulo: 'Análise de imagem médica', 
      preview: 'Interpretação de exame radiológico...', 
      data: '2024-01-12',
      messageCount: 6
    },
    { 
      id: 5, 
      titulo: 'Tradução de documento', 
      preview: 'Tradução de contrato comercial...', 
      data: '2024-01-11',
      messageCount: 4
    },
    { 
      id: 6, 
      titulo: 'Resumo de livro científico', 
      preview: 'Criação de resumo executivo...', 
      data: '2024-01-10',
      messageCount: 9
    },
    { 
      id: 7, 
      titulo: 'Correção de dissertação', 
      preview: 'Revisão ortográfica e gramatical...', 
      data: '2024-01-09',
      messageCount: 23
    },
    { 
      id: 8, 
      titulo: 'Criação de questionário', 
      preview: 'Desenvolvimento de questionário...', 
      data: '2024-01-08',
      messageCount: 7
    },
    { 
      id: 9, 
      titulo: 'Análise de dados estatísticos', 
      preview: 'Interpretação de gráficos e tabelas...', 
      data: '2024-01-07',
      messageCount: 11
    },
    { 
      id: 10, 
      titulo: 'Reescrita de artigo', 
      preview: 'Melhoria de estilo e clareza...', 
      data: '2024-01-06',
      messageCount: 18
    }
  ]

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>CorrigeAI</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'conversas' ? styles.active : ''}`}
            onClick={() => setActiveTab('conversas')}
          >
            Conversas
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'sobre' ? styles.active : ''}`}
            onClick={() => setActiveTab('sobre')}
          >
            Sobre
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'conversas' && (
            <div className={styles.conversasList}>
              <h3>Conversas Recentes</h3>
              {conversas.map((conversa) => (
                <div key={conversa.id} className={styles.conversaItem}>
                  <div className={styles.conversaHeader}>
                    <h4>{conversa.titulo}</h4>
                    <span className={styles.data}>{conversa.data}</span>
                  </div>
                  <p className={styles.preview}>{conversa.preview}</p>
                  <div className={styles.conversaMeta}>
                    <span className={styles.messageCount}>
                      {conversa.messageCount} mensagens
                    </span>
                  </div>
                </div>
              ))}
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
