import styles from './page.module.css'

export default function SobrePage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Sobre o CorrigeAI</h1>
          <p className={styles.subtitle}>
            Seu assistente inteligente para educação e produtividade
          </p>
        </header>

        <section className={styles.section}>
          <h2>O que é o CorrigeAI?</h2>
          <p>
            O CorrigeAI é uma plataforma avançada de inteligência artificial desenvolvida 
            especificamente para auxiliar educadores, estudantes e profissionais na criação, 
            correção e análise de conteúdo educacional. Nossa ferramenta combina a potência 
            do Google Gemini AI com uma interface intuitiva e funcionalidades especializadas.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Principais Funcionalidades</h2>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✅</div>
              <div className={styles.featureContent}>
                <h3>Correção Automática de Textos</h3>
                <p>
                  Identifica e corrige erros gramaticais, ortográficos e de estilo, 
                  oferecendo sugestões para melhorar a clareza e fluidez do texto.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>📄</div>
              <div className={styles.featureContent}>
                <h3>Geração de PDFs Formatados</h3>
                <p>
                  Cria documentos PDF profissionais com formatação automática, 
                  ideais para materiais didáticos, relatórios e documentos oficiais.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>🖼️</div>
              <div className={styles.featureContent}>
                <h3>Análise de Imagens</h3>
                <p>
                  Interpreta e analisa imagens, gráficos e diagramas, fornecendo 
                  descrições detalhadas e insights relevantes para o contexto educacional.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>💬</div>
              <div className={styles.featureContent}>
                <h3>Conversas Contextuais</h3>
                <p>
                  Mantém o contexto das conversas para fornecer respostas mais 
                  precisas e personalizadas ao longo da interação.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>📱</div>
              <div className={styles.featureContent}>
                <h3>Interface Responsiva</h3>
                <p>
                  Funciona perfeitamente em todos os dispositivos - desktop, 
                  tablet e smartphone - garantindo acesso em qualquer lugar.
                </p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>🎯</div>
              <div className={styles.featureContent}>
                <h3>Conteúdo Personalizado</h3>
                <p>
                  Adapta-se ao estilo e necessidades específicas de cada usuário, 
                  oferecendo sugestões e correções personalizadas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Ideal Para</h2>
          <div className={styles.audience}>
            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>👨‍🎓</div>
              <div>
                <h3>Estudantes e Pesquisadores</h3>
                <p>
                  Auxilia na elaboração de trabalhos acadêmicos, dissertações 
                  e artigos científicos com correções precisas e sugestões de melhoria.
                </p>
              </div>
            </div>

            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>👨‍🏫</div>
              <div>
                <h3>Educadores e Professores</h3>
                <p>
                  Facilita a criação de materiais didáticos, correção de trabalhos 
                  e desenvolvimento de conteúdo educacional de qualidade.
                </p>
              </div>
            </div>

            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>👨‍💼</div>
              <div>
                <h3>Profissionais e Empresas</h3>
                <p>
                  Melhora a qualidade de relatórios, apresentações e documentos 
                  corporativos com revisões automáticas e sugestões profissionais.
                </p>
              </div>
            </div>

            <div className={styles.audienceItem}>
              <div className={styles.audienceIcon}>✍️</div>
              <div>
                <h3>Escritores e Redatores</h3>
                <p>
                  Oferece suporte na revisão e aprimoramento de textos, 
                  garantindo clareza, coesão e correção linguística.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Tecnologia</h2>
          <div className={styles.technology}>
            <div className={styles.techItem}>
              <h3>🤖 Google Gemini AI</h3>
              <p>
                Utilizamos o modelo de IA mais avançado do Google para garantir 
                respostas precisas e contextualmente relevantes.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3>⚛️ Next.js & React</h3>
              <p>
                Interface moderna e responsiva desenvolvida com as mais recentes 
                tecnologias web para uma experiência fluida e rápida.
              </p>
            </div>
            <div className={styles.techItem}>
              <h3>🔒 Segurança e Privacidade</h3>
              <p>
                Seus dados são protegidos com criptografia avançada e não são 
                armazenados desnecessariamente em nossos servidores.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Como Usar</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div>
                <h3>Digite sua mensagem</h3>
                <p>Escreva o texto que deseja corrigir ou a pergunta que tem</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div>
                <h3>Anexe imagens (opcional)</h3>
                <p>Adicione imagens para análise ou contexto adicional</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div>
                <h3>Receba a resposta</h3>
                <p>Obtenha correções, sugestões ou respostas detalhadas</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div>
                <h3>Baixe o PDF (se aplicável)</h3>
                <p>Para conteúdos longos, gere um PDF formatado</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Pronto para começar?</h2>
          <p>
            Experimente o CorrigeAI agora e descubra como a inteligência artificial 
            pode revolucionar sua forma de trabalhar com textos e conteúdo educacional.
          </p>
          <a href="/" className={styles.ctaButton}>
            Começar Agora
          </a>
        </section>
      </div>
    </div>
  )
}
