'use client'

import React, { useEffect } from 'react'
import styles from './page.module.css'

function SobrePage() {
  useEffect(() => {
    // Inicializar otimizações de scroll
    const initScrollOptimizations = () => {
      // Observer para animações
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible)
          }
        })
      }, { 
        threshold: 0.1,
        rootMargin: '50px'
      })

      // Observar todas as seções
      document.querySelectorAll('.' + styles.section).forEach(section => {
        observer.observe(section)
      })

      // Smooth scroll para links internos
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault()
          const target = document.querySelector(link.getAttribute('href'))
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            })
          }
        })
      })

      // Cleanup function
      return () => {
        observer.disconnect()
      }
    }

    const cleanup = initScrollOptimizations()
    return cleanup
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            <span className={styles.headerIcon}>🎯</span>
            <div>
              <h1 className={styles.brandTitle}>CorrigeAI</h1>
              <div className={styles.schoolBadge}>ESCOLA SESI</div>
            </div>
          </div>
          <p className={styles.subtitle}>
            Inteligência Artificial Educacional para Excelência Acadêmica
          </p>
        </header>

        <section className={styles.section}>
          <h2>Sobre o CorrigeAI</h2>
          <p>
            O <strong>CorrigeAI</strong> é uma plataforma revolucionária de inteligência artificial 
            desenvolvida especialmente para a <strong>Escola SESI</strong>, criada para elevar 
            o padrão de excelência educacional através da tecnologia mais avançada. Nossa missão 
            é empoderar educadores e estudantes com ferramentas inteligentes que transformam 
            o processo de ensino-aprendizagem.
          </p>
          <div className={styles.highlight}>
            <p>
              🏆 <strong>Comprometimento com a Qualidade:</strong> Desenvolvido seguindo os mais altos 
              padrões da educação SESI, focando na inovação e na formação integral dos estudantes.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Funcionalidades Exclusivas</h2>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📋</div>
              <div className={styles.featureContent}>
                <h3>Correção de Provas Automática</h3>
                <p>
                  Sistema avançado de correção que analisa provas escaneadas, compara 
                  com gabaritos e gera relatórios pedagógicos detalhados para cada aluno.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>�</div>
              <div className={styles.featureContent}>
                <h3>Análise Pedagógica Inteligente</h3>
                <p>
                  Identifica padrões de aprendizagem, questões mais desafiadoras e 
                  fornece insights valiosos para personalizar o ensino.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>�</div>
              <div className={styles.featureContent}>
                <h3>Relatórios SESI Personalizados</h3>
                <p>
                  Gera documentos PDF profissionais seguindo os padrões visuais 
                  e metodológicos da Escola SESI.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>�</div>
              <div className={styles.featureContent}>
                <h3>OCR Educacional Avançado</h3>
                <p>
                  Reconhecimento óptico de caracteres especializado em materiais 
                  educacionais, fórmulas matemáticas e diagramas científicos.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>�</div>
              <div className={styles.featureContent}>
                <h3>Suporte Multi-usuário</h3>
                <p>
                  Sistema colaborativo que permite professores, coordenadores e 
                  gestores trabalharem de forma integrada e eficiente.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>�</div>
              <div className={styles.featureContent}>
                <h3>Design SESI Institucional</h3>
                <p>
                  Interface desenvolvida com as cores e identidade visual da 
                  Escola SESI, garantindo familiaridade e profissionalismo.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Ideal Para a Comunidade SESI</h2>
          <div className={styles.audience}>
            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>👨‍�</div>
              <div>
                <h3>Professores e Educadores</h3>
                <p>
                  Otimização do tempo de correção, análises pedagógicas automáticas 
                  e criação de materiais didáticos alinhados com a metodologia SESI.
                </p>
              </div>
            </div>

            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>�</div>
              <div>
                <h3>Coordenadores Pedagógicos</h3>
                <p>
                  Relatórios gerenciais, análises de desempenho por turma e 
                  identificação de oportunidades de melhoria no processo educacional.
                </p>
              </div>
            </div>

            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>🎓</div>
              <div>
                <h3>Estudantes SESI</h3>
                <p>
                  Feedback instantâneo, correções detalhadas e orientações 
                  personalizadas para potencializar o aprendizado.
                </p>
              </div>
            </div>

            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>🏛️</div>
              <div>
                <h3>Gestão Escolar</h3>
                <p>
                  Dados consolidados sobre performance educacional, relatórios 
                  institucionais e métricas de qualidade de ensino.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Tecnologia de Ponta</h2>
          <div className={styles.technology}>
            <div className={styles.techItem}>
              <h3>🤖 Google Gemini AI</h3>
              <p>
                Modelo de IA de última geração, especializado em análise educacional 
                e processamento de linguagem natural em português brasileiro.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3>🔍 OCR Avançado + PyMuPDF</h3>
              <p>
                Tecnologia de reconhecimento óptico otimizada para documentos 
                educacionais, incluindo fórmulas matemáticas e gráficos científicos.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3>⚛️ Next.js 15 + React</h3>
              <p>
                Frontend moderno e responsivo com performance otimizada para 
                uso intensivo em ambiente escolar.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3>🏗️ Arquitetura Escalável</h3>
              <p>
                Sistema projetado para suportar toda a demanda da Escola SESI, 
                com alta disponibilidade e performance garantida.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3>🔒 Segurança LGPD</h3>
              <p>
                Proteção total dos dados educacionais em conformidade com 
                a Lei Geral de Proteção de Dados e políticas institucionais.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3>📱 PWA Ready</h3>
              <p>
                Aplicativo web progressivo que funciona offline e pode ser 
                instalado em dispositivos móveis como app nativo.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Processo de Correção Inteligente</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div>
                <h3>Upload das Provas</h3>
                <p>Escaneie ou fotografe as provas e o gabarito usando qualquer dispositivo</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div>
                <h3>Processamento OCR</h3>
                <p>Sistema extrai texto, identifica respostas e compara com gabarito automaticamente</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div>
                <h3>Análise Pedagógica</h3>
              <p>IA analisa padrões de erro, performance por questão e gera insights educacionais</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div>
                <h3>Relatório SESI</h3>
                <p>Gera relatório completo em PDF com branding institucional e dados detalhados</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.highlight}>
          <h2>🚀 Inovação Educacional SESI</h2>
          <p>
            O CorrigeAI representa o compromisso da Escola SESI com a inovação tecnológica 
            aplicada à educação. Nossa plataforma não apenas automatiza processos, mas 
            potencializa a capacidade pedagógica dos educadores, permitindo mais tempo 
            para o que realmente importa: <strong>o aprendizado dos nossos estudantes</strong>.
          </p>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>95%</div>
              <div className={styles.statLabel}>Precisão na Correção</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>80%</div>
              <div className={styles.statLabel}>Redução no Tempo</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Relatórios Automáticos</div>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Transforme sua Prática Pedagógica</h2>
          <p>
            Junte-se à revolução educacional da Escola SESI. Experimente o CorrigeAI 
            e descubra como a inteligência artificial pode potencializar seu trabalho 
            educacional, proporcionando mais qualidade e eficiência no processo de ensino-aprendizagem.
          </p>
          <a href="/" className={styles.ctaButton}>
            🎯 Começar Agora
          </a>
          <div className={styles.ctaSubtext}>
            Desenvolvido com ❤️ para a excelência educacional SESI
          </div>
        </section>
      </div>
    </div>
  )
}

export default SobrePage