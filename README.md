# CorrigeAI - ChatBot com Gemini AI

## 📋 Sobre o Projeto

CorrigeAI é uma aplicação web moderna desenvolvida em Next.js que integra com a API do Google Gemini para fornecer assistência de IA conversacional. O projeto inclui funcionalidades avançadas como:

- 💬 Chat em tempo real com IA
- 📄 Geração de PDFs a partir de comandos de texto
- 🖼️ Suporte para análise de imagens
- 🌙 Modo escuro/claro
- 📱 Design responsivo
- 🔒 Sistema de login/cadastro (interface)

## 🚀 Tecnologias Utilizadas

- **Next.js 15.5.0** - Framework React
- **React 18** - Biblioteca de interface
- **Google Gemini AI** - Modelo de IA conversacional
- **CSS Modules** - Estilização componentizada
- **jsPDF** - Geração de documentos PDF

## 📦 Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd gemini-google
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

4. **Acesse a aplicação:**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🎯 Funcionalidades

### Chat com IA
- Digite qualquer pergunta ou solicitação
- A IA responderá usando o modelo Gemini
- Suporte para conversas contextuais

### Geração de PDFs
Para gerar um PDF, use o comando:
```
Crie um PDF sobre [seu tópico]
```

Exemplos:
- "Crie um PDF sobre física quântica"
- "Crie um PDF sobre programação em Python"
- "Crie um PDF sobre receitas vegetarianas"

### Upload de Imagens
- Clique no ícone 📎 para anexar imagens
- A IA pode analisar e responder sobre o conteúdo das imagens
- Suporta formatos: JPG, PNG, GIF, etc.

### Temas
- Alterne entre modo claro e escuro
- Clique no ícone 🌙/☀️ no canto superior direito
- Configuração salva automaticamente

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js          # API route para Gemini
│   ├── globals.css               # Estilos globais e variáveis CSS
│   ├── layout.js                 # Layout principal
│   └── page.js                   # Página inicial
├── components/
│   ├── ChatContainer.js          # Container principal do chat
│   ├── ChatMessage.js            # Componente de mensagem
│   ├── ImageUpload.js            # Upload de imagens
│   ├── LoginModal.js             # Modal de login
│   ├── Navbar.js                 # Barra de navegação
│   ├── SignupModal.js            # Modal de cadastro
│   └── Sidebar.js                # Barra lateral
└── utils/
    └── pdfGenerator.js           # Utilitário para geração de PDFs
```

## 🎨 Personalização

### Cores e Temas
Edite as variáveis CSS em `src/app/globals.css`:
```css
:root {
  --primary-color: #007bff;
  --accent-color: #0056b3;
  /* ... outras variáveis */
}
```

### Adicionando Novos Componentes
1. Crie o arquivo `.js` em `src/components/`
2. Crie o arquivo `.module.css` correspondente
3. Importe e use no componente pai

## 🐛 Solução de Problemas

### PDFs não são gerados
- O sistema usa fallback automático para HTML se o PDF falhar
- Verifique o console do navegador para erros
- Certifique-se de que o navegador permite downloads

### Imagens não carregam
- Verifique se o arquivo está no formato suportado
- Confirme se o tamanho não excede os limites do navegador
- Teste com uma imagem menor

### Erro de conexão
- Verifique sua conexão com a internet
- Aguarde alguns momentos e tente novamente
- Se o problema persistir, recarregue a página

## 📈 Próximos Passos

- [ ] Implementar autenticação real
- [ ] Adicionar histórico de conversas
- [ ] Melhorar sistema de temas
- [ ] Adicionar suporte a mais formatos de arquivo
- [ ] Implementar compartilhamento de conversas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas:
1. Verifique a seção de solução de problemas acima
2. Consulte a documentação do [Next.js](https://nextjs.org/docs)
3. Consulte a documentação do [Google Gemini](https://ai.google.dev/docs)

---

Desenvolvido com ❤️ usando Next.js e Google Gemini AI
