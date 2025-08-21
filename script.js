
class ChatBot {
    constructor() {
        this.conversations = [];
        this.currentConversation = [];
        this.isLoading = false;
        this.currentImage = null; // Para armazenar a imagem atual
        this.initialize();
    }

    initialize() {
        // Elementos DOM
        this.userInput = document.getElementById("userInput");
        this.chatOutput = document.getElementById("chatOutput");
        this.sendButton = document.getElementById("sendButton");
        this.newChatBtn = document.getElementById("newChatBtn");
        this.clearHistoryBtn = document.getElementById("clearHistoryBtn");
        this.conversationList = document.getElementById("conversationList");
        this.loadingAnimation = document.getElementById("loadingAnimation");
        this.imageInput = document.getElementById("imageInput");
        this.imageBtn = document.getElementById("imageBtn");
        this.imagePreview = document.getElementById("imagePreview");
        this.previewImg = document.getElementById("previewImg");
        this.removeImageBtn = document.getElementById("removeImage");
        this.generateImageBtn = document.getElementById("generateImageBtn");

        // Event Listeners
        this.userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !this.isLoading) this.handleUserInput();
        });
        this.sendButton.addEventListener("click", () => {
            if (!this.isLoading) this.handleUserInput();
        });
        this.newChatBtn.addEventListener("click", () => this.startNewChat());
        this.clearHistoryBtn.addEventListener("click", () => this.clearHistory());

        // Image upload events
        this.imageBtn.addEventListener("click", () => this.imageInput.click());
        this.imageInput.addEventListener("change", (e) => this.handleImageUpload(e));
        this.removeImageBtn.addEventListener("click", () => this.removeImage());
        
        // Image generation event
        this.generateImageBtn.addEventListener("click", () => this.handleImageGeneration());

        // Paste event for images
        this.userInput.addEventListener("paste", (e) => this.handlePaste(e));
        document.addEventListener("paste", (e) => this.handlePaste(e));

        // Quick suggestion buttons
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("suggestion-btn")) {
                this.handleSuggestionClick(e.target);
            }
        });

        // Carregar conversas salvas
        this.loadConversations();

        // Show welcome screen if no conversation exists
        if (
            this.currentConversation.length === 0 &&
            this.conversations.length === 0
        ) {
            this.showWelcomeScreen();
        } else {
            this.hideWelcomeScreen();
        }
        this.startNewChat();
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.sendButton.disabled = loading;
        this.userInput.disabled = loading;

        if (loading) {
            // Add loading animation directly to chat
            this.addLoadingMessage();
        } else {
            // Remove loading animation
            this.removeLoadingMessage();
        }
    }

    addLoadingMessage() {
        // Remove any existing loading message first
        this.removeLoadingMessage();
        
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "message bot-message loading-message";
        loadingDiv.id = "currentLoadingMessage";

        // Add avatar for bot messages
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "ai-avatar";
        const avatarImg = document.createElement("img");
        avatarImg.src = "assets/logo.png";
        avatarImg.alt = "AI Avatar";
        avatarDiv.appendChild(avatarImg);
        loadingDiv.appendChild(avatarDiv);

        const loadingContent = document.createElement("div");
        loadingContent.className = "loading-content";
        
        const loadingText = document.createElement("div");
        loadingText.className = "loading-text";
        loadingText.textContent = "CorrigeAI está processando sua solicitação...";
        
        const loadingDots = document.createElement("div");
        loadingDots.className = "loading-dots";
        for (let i = 0; i < 3; i++) {
            const span = document.createElement("span");
            loadingDots.appendChild(span);
        }
        
        loadingContent.appendChild(loadingText);
        loadingContent.appendChild(loadingDots);
        loadingDiv.appendChild(loadingContent);
        
        this.chatOutput.appendChild(loadingDiv);
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
    }

    removeLoadingMessage() {
        const existingLoading = document.getElementById("currentLoadingMessage");
        if (existingLoading) {
            existingLoading.remove();
        }
        
        // Also hide the static loading animation if it exists
        if (this.loadingAnimation) {
            this.loadingAnimation.style.display = "none";
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentImage = {
                    data: e.target.result,
                    name: file.name,
                    type: file.type
                };
                this.showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    handlePaste(event) {
        const items = event.clipboardData?.items;
        if (items) {
            for (let item of items) {
                if (item.type.startsWith('image/')) {
                    event.preventDefault();
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.currentImage = {
                            data: e.target.result,
                            name: 'pasted-image.png',
                            type: item.type
                        };
                        this.showImagePreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                    break;
                }
            }
        }
    }

    showImagePreview(imageSrc) {
        this.previewImg.src = imageSrc;
        this.imagePreview.style.display = 'block';
    }

    removeImage() {
        this.currentImage = null;
        this.imagePreview.style.display = 'none';
        this.imageInput.value = '';
    }

    handleSuggestionClick(button) {
        const suggestion = button.getAttribute('data-suggestion');
        const suggestionTexts = {
            'Criar uma atividade': 'Olá! Preciso de ajuda para criar uma atividade educacional. Pode me ajudar?',
            'Corrigir prova': 'Preciso corrigir uma prova ou trabalho. Como posso enviar o gabarito para você me ajudar?',
            'Plano de aula': 'Gostaria de ajuda para elaborar um plano de aula. Qual seria a melhor forma de começar?',
            'Exercícios': 'Preciso criar exercícios para meus alunos. Pode me ajudar com algumas sugestões?',
            'Análise de imagem': 'Vou enviar uma imagem para você analisar e me dar insights educacionais sobre ela.',
            'Dúvida pedagógica': 'Tenho uma dúvida sobre metodologia de ensino. Pode me orientar?'
        };

        const text = suggestionTexts[suggestion] || suggestion;
        this.userInput.value = text;
        this.userInput.focus();
        
        // Hide welcome screen
        this.hideWelcomeScreen();
    }

    async handleUserInput() {
        const text = this.userInput.value.trim();
        if (!text && !this.currentImage) return;

        // Check if user wants to generate an image using keywords
        if (this.isImageGenerationRequest(text)) {
            this.handleImageGenerationFromText(text);
            return;
        }

        try {
            this.addMessage(text, "user", this.currentImage);
            this.userInput.value = "";
            
            // Store image reference and clear it
            const imageToSend = this.currentImage;
            this.removeImage();

            this.setLoading(true);
            const response = await this.generateResponse(text, imageToSend);
            this.addMessage(response, "bot");
            this.saveConversations();
        } catch (error) {
            this.addMessage("Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.", "bot");
            console.error("Erro:", error);
        } finally {
            this.setLoading(false);
        }
    }

    isImageGenerationRequest(text) {
        const imageKeywords = [
            'gere uma imagem',
            'gerar uma imagem',
            'crie uma imagem',
            'criar uma imagem',
            'faça uma imagem',
            'fazer uma imagem',
            'desenhe uma imagem',
            'desenhar uma imagem',
            'monte uma imagem',
            'montar uma imagem',
            'produza uma imagem',
            'produzir uma imagem',
            'gere imagem',
            'gerar imagem',
            'crie imagem',
            'criar imagem',
            'faça imagem',
            'fazer imagem',
            'desenhe',
            'desenhar',
            'ilustre',
            'ilustrar',
            'visualize',
            'visualizar'
        ];

        const lowerText = text.toLowerCase();
        return imageKeywords.some(keyword => lowerText.includes(keyword));
    }

    extractImagePromptFromText(text) {
        const imageKeywords = [
            'gere uma imagem de',
            'gere uma imagem',
            'gerar uma imagem de',
            'gerar uma imagem',
            'crie uma imagem de',
            'crie uma imagem',
            'criar uma imagem de',
            'criar uma imagem',
            'faça uma imagem de',
            'faça uma imagem',
            'fazer uma imagem de',
            'fazer uma imagem',
            'desenhe uma imagem de',
            'desenhe uma imagem',
            'desenhar uma imagem de',
            'desenhar uma imagem',
            'monte uma imagem de',
            'monte uma imagem',
            'montar uma imagem de',
            'montar uma imagem',
            'produza uma imagem de',
            'produza uma imagem',
            'produzir uma imagem de',
            'produzir uma imagem',
            'gere imagem de',
            'gere imagem',
            'gerar imagem de',
            'gerar imagem',
            'crie imagem de',
            'crie imagem',
            'criar imagem de',
            'criar imagem',
            'faça imagem de',
            'faça imagem',
            'fazer imagem de',
            'fazer imagem',
            'desenhe',
            'desenhar',
            'ilustre',
            'ilustrar',
            'visualize',
            'visualizar'
        ];

        const lowerText = text.toLowerCase();
        
        // Find the longest matching keyword
        let longestMatch = '';
        for (const keyword of imageKeywords) {
            if (lowerText.includes(keyword) && keyword.length > longestMatch.length) {
                longestMatch = keyword;
            }
        }

        if (longestMatch) {
            // Extract the prompt after the keyword
            const keywordIndex = lowerText.indexOf(longestMatch);
            const afterKeyword = text.substring(keywordIndex + longestMatch.length).trim();
            
            // If there's content after the keyword, use it, otherwise use the original text
            return afterKeyword || text.replace(new RegExp(longestMatch, 'i'), '').trim();
        }

        return text;
    }

    async handleImageGenerationFromText(text) {
        const prompt = this.extractImagePromptFromText(text);
        
        if (!prompt) {
            this.addMessage("Por favor, descreva melhor a imagem que você gostaria de gerar! Por exemplo: 'Gere uma imagem de um gato estudando'", "bot");
            this.userInput.value = "";
            return;
        }

        try {
            console.log("Geração de imagem detectada automaticamente:", prompt);
            
            // Add user message with generation request
            this.addMessage(text, "user");
            this.userInput.value = "";
            
            this.setLoading(true);
            // Generate image using Pollinations API
            const imageUrl = await this.generateImage(prompt);
            console.log("Imagem gerada com sucesso:", imageUrl);
            
            // Add bot message with generated image
            this.addGeneratedImageMessage(imageUrl, prompt);
            this.saveConversations();
            
            console.log("Processo de geração de imagem concluído com sucesso!");
        } catch (error) {
            console.error("Erro detalhado na geração de imagem:", error);
            this.addMessage("Desculpe, ocorreu um erro ao gerar a imagem: " + error.message, "bot");
        } finally {
            this.setLoading(false);
        }
    }

    async handleImageGeneration() {
        const prompt = this.userInput.value.trim();
        if (!prompt) {
            alert("Por favor, descreva a imagem que você gostaria de gerar!");
            return;
        }

        try {
            this.setLoading(true);
            console.log("Iniciando geração de imagem para:", prompt);
            
            // Add user message with generation request
            this.addMessage("🎨 Gerar imagem: " + prompt, "user");
            this.userInput.value = "";
            
            // Generate image using Pollinations API
            const imageUrl = await this.generateImage(prompt);
            console.log("Imagem gerada com sucesso:", imageUrl);
            
            // Add bot message with generated image
            this.addGeneratedImageMessage(imageUrl, prompt);
            this.saveConversations();
            
            console.log("Processo de geração de imagem concluído com sucesso!");
        } catch (error) {
            console.error("Erro detalhado na geração de imagem:", error);
            this.addMessage("Desculpe, ocorreu um erro ao gerar a imagem: " + error.message, "bot");
        } finally {
            this.setLoading(false);
        }
    }

    async generateImage(prompt) {
        try {
            // Clean the prompt for URL encoding
            const cleanPrompt = encodeURIComponent(prompt);
            
            // Use Pollinations API for free image generation
            const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=512&height=512&model=flux&nologo=true`;
            
            console.log("URL da imagem gerada:", imageUrl);
            
            // Return the URL directly - Pollinations API is reliable
            return imageUrl;
        } catch (error) {
            console.error("Erro no generateImage:", error);
            throw error;
        }
    }

    addGeneratedImageMessage(imageUrl, prompt) {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message bot-message";
        
        // Add avatar for bot messages
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "ai-avatar";
        const avatarImg = document.createElement("img");
        avatarImg.src = "assets/logo.png";
        avatarImg.alt = "AI Avatar";
        avatarDiv.appendChild(avatarImg);
        messageDiv.appendChild(avatarDiv);
        
        const messageContent = document.createElement("div");
        messageContent.className = "message-content";
        
        const text = document.createElement("div");
        text.className = "message-text";
        text.innerHTML = `🎨 Imagem gerada para: "${prompt}"`;
        
        const imageContainer = document.createElement("div");
        imageContainer.className = "generated-image";
        
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = prompt;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.marginTop = "10px";
        
        imageContainer.appendChild(img);
        messageContent.appendChild(text);
        messageContent.appendChild(imageContainer);
        messageDiv.appendChild(messageContent);
        
        this.chatOutput.appendChild(messageDiv);
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
        
        // Add to conversation history
        this.currentConversation.push({ 
            sender: "bot", 
            message: `🎨 Imagem gerada para: "${prompt}"`,
            imageUrl: imageUrl
        });
    }

    addMessage(message, sender, image = null) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;

        // Create message content container
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";

        if (sender === "bot") {
            // Add avatar for bot messages
            const avatarDiv = document.createElement("div");
            avatarDiv.className = "ai-avatar";
            const avatarImg = document.createElement("img");
            avatarImg.src = "assets/logo.png";
            avatarImg.alt = "AI Avatar";
            avatarDiv.appendChild(avatarImg);
            messageDiv.appendChild(avatarDiv);
        }

        // Add image if present
        if (image) {
            const imageDiv = document.createElement("div");
            imageDiv.className = "message-image";
            const img = document.createElement("img");
            img.src = image.data;
            img.alt = image.name;
            img.style.maxWidth = "300px";
            img.style.borderRadius = "8px";
            img.style.marginBottom = "8px";
            imageDiv.appendChild(img);
            contentDiv.appendChild(imageDiv);
        }

        // Add text message if present
        if (message) {
            const textDiv = document.createElement("div");
            textDiv.className = "message-text";
            // Format message text with markdown-like syntax
            const formattedMessage = this.formatMessage(message);
            textDiv.innerHTML = formattedMessage;
            contentDiv.appendChild(textDiv);
        }

        messageDiv.appendChild(contentDiv);
        this.chatOutput.appendChild(messageDiv);
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;

        this.currentConversation.push({ sender, message, image });
    }

    async generateResponse(message, image = null) {
        return await this.getBotResponse(message, image);
    }

    async getBotResponse(message, image = null) {
        const API_KEY = "AIzaSyBmXICpEOU1V4oLuTcELyRNFehiRcD8aWw";
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

        console.log("Sending request to API:", API_URL);

        // Prepare the content parts
        let parts = [];

        // Analyze the message to provide better context
        const enhancedPrompt = this.enhancePromptForEducation(message, image);

        if (message || image) {
            parts.push({
                text: enhancedPrompt
            });
        }

        // Add image if present
        if (image) {
            const base64Data = image.data.split(',')[1]; // Remove data:image/...;base64, prefix
            parts.push({
                inline_data: {
                    mime_type: image.type,
                    data: base64Data
                }
            });
        }

        try {
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: parts
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                }),
            });

            console.log("API Response Status:", response.status);
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                throw new Error(
                    `Erro na API: ${errorData.error?.message || "Erro desconhecido"}`
                );
            }

            const data = await response.json();
            console.log("API Response Data:", data);

            if (
                data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts[0]
            ) {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.error("Invalid API Response Structure:", data);
                throw new Error("Formato de resposta inválido");
            }
        } catch (error) {
            console.error("Error details:", error);
            
            // Return different error messages based on error type
            if (error.message.includes('API')) {
                return "⚠️ **Problema de conexão com a API**\n\nDesculpe, houve um problema técnico ao conectar com o serviço. Isso pode acontecer por:\n\n• Problemas temporários de conexão\n• Limite de uso da API atingido\n• Manutenção do serviço\n\nPor favor, tente novamente em alguns minutos. Se o problema persistir, verifique sua conexão com a internet.";
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                return "🌐 **Problema de rede**\n\nParece que há um problema com sua conexão à internet. Verifique:\n\n• Se você está conectado à internet\n• Se não há bloqueios de firewall\n• Tente recarregar a página\n\nApós verificar, tente enviar sua mensagem novamente.";
            } else {
                return "🤖 **Oops, algo deu errado!**\n\nDesculpe, encontrei um problema inesperado ao processar sua solicitação. \n\n**O que você pode fazer:**\n• Tente reformular sua pergunta\n• Verifique se a imagem enviada não está corrompida\n• Recarregue a página se necessário\n\nSe o problema persistir, me informe detalhes sobre o que você estava tentando fazer para que eu possa ajudar melhor! 😊";
            }
        }
    }

    enhancePromptForEducation(message, image) {
        const basePrompt = `Você é "Corrige AI", um assistente educacional especializado para professores. Suas funções e diretrizes são:

🎯 FUNÇÕES PRINCIPAIS:
• Ler, interpretar e analisar arquivos enviados (texto, imagens, PDFs, planilhas)
• Criar atividades, exercícios, avaliações e conteúdos pedagógicos
• Corrigir provas, trabalhos e redações com base em gabaritos fornecidos
• Elaborar planos de aula e materiais didáticos
• Gerar imagens educacionais e ilustrações para aulas
• Pesquisar informações educacionais precisas e confiáveis
• Adaptar conteúdos para diferentes níveis de ensino
• Sugerir metodologias e estratégias pedagógicas

📋 DIRETRIZES DE COMPORTAMENTO:
• SEMPRE responda em português brasileiro, de forma clara e didática
• SEJA HONESTO: Se não souber algo, diga "Não tenho informações suficientes sobre isso" ou "Preciso de mais detalhes para ajudar melhor"
• NUNCA invente informações falsas ou dados inexistentes
• Pergunte detalhes quando necessário (série/ano, disciplina, objetivo da atividade)
• Seja educado, prestativo e encorajador
• Forneça respostas estruturadas e organizadas
• Ofereça alternativas e sugestões práticas

🔍 QUANDO ANALISAR IMAGENS:
• Descreva detalhadamente o que vê na imagem
• Identifique textos, gráficos, exercícios ou conteúdos educacionais
• Forneça contexto educacional relevante
• Sugira atividades relacionadas ao conteúdo da imagem

🎨 GERAÇÃO DE IMAGENS:
• POSSO criar imagens educacionais! Use comandos como "Gere uma imagem de...", "Crie uma imagem de...", "Desenhe...", etc.
• Sugira imagens relevantes para ilustrar conceitos educacionais
• Ofereça criar materiais visuais para aulas e atividades
• Use imagens para tornar o aprendizado mais visual e atrativo

⚠️ LIMITAÇÕES QUE DEVO INFORMAR:
• "Não tenho acesso à internet em tempo real para informações atualizadas"
• "Não posso acessar sistemas externos ou fazer downloads"
• "Para informações muito específicas ou técnicas, recomendo consultar fontes especializadas"`;

        // Detect the type of request and enhance accordingly
        if (!message) {
            return basePrompt + `\n\nO usuário enviou apenas uma imagem. Analise-a detalhadamente e forneça insights educacionais relevantes.`;
        }

        const lowerMessage = message.toLowerCase();
        
        // Enhanced prompts for specific educational tasks
        if (lowerMessage.includes('atividade') || lowerMessage.includes('exercício')) {
            return basePrompt + `\n\nO professor está solicitando ajuda com criação de atividade/exercício. 
            
INSTRUÇÕES ESPECÍFICAS:
• Pergunte sobre: série/ano, disciplina, tema específico, objetivos de aprendizagem
• Sugira diferentes tipos de atividades (individual, grupo, prática, teórica)
• Inclua critérios de avaliação quando relevante
• Considere diferentes níveis de dificuldade

Solicitação: ${message}`;
        }
        
        if (lowerMessage.includes('correção') || lowerMessage.includes('corrigir') || lowerMessage.includes('gabarito')) {
            return basePrompt + `\n\nO professor precisa de ajuda com correção. 
            
INSTRUÇÕES ESPECÍFICAS:
• Se não houver gabarito, solicite o critério de correção
• Forneça feedback construtivo para os alunos
• Identifique pontos fortes e áreas para melhoria
• Sugira como dar devolutiva aos estudantes

Solicitação: ${message}`;
        }
        
        if (lowerMessage.includes('plano de aula') || lowerMessage.includes('planejamento')) {
            return basePrompt + `\n\nO professor está planejando uma aula. 
            
INSTRUÇÕES ESPECÍFICAS:
• Pergunte sobre: disciplina, série/ano, tempo de aula, tema/conteúdo
• Estruture: objetivos, metodologia, recursos, avaliação
• Considere diferentes estratégias pedagógicas
• Inclua sugestões de materiais e recursos

Solicitação: ${message}`;
        }

        return basePrompt + `\n\nPergunta do usuário: ${message}\n\nResponda de acordo com essas diretrizes, sendo útil, preciso e honesto sobre suas capacidades e limitações.`;
    }

    formatMessage(message) {
        // Convert URLs to clickable links
        message = message.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );

        // Convert markdown bold (**text**) to HTML
        message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert markdown italic (*text*) to HTML
        message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert markdown lists (• item) to HTML
        message = message.replace(/^• (.+)$/gm, '<li>$1</li>');
        
        // Wrap consecutive list items in ul tags
        message = message.replace(/(<li>.*<\/li>)/gs, (match) => {
            return '<ul>' + match + '</ul>';
        });
        
        // Convert numbered lists (1. item) to HTML
        message = message.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // Wrap consecutive numbered list items in ol tags
        message = message.replace(/(<li>.*<\/li>)/gs, (match) => {
            // Only convert if it's not already in a ul
            if (!match.includes('<ul>')) {
                return '<ol>' + match + '</ol>';
            }
            return match;
        });

        // Convert emojis to larger size
        message = message.replace(
            /([\u{1F300}-\u{1F9FF}])/gu,
            '<span class="emoji">$1</span>'
        );

        // Add line breaks
        message = message.replace(/\n/g, "<br>");

        return message;
    }

    showWelcomeScreen() {
        const welcomeScreen = document.querySelector(".welcome-screen");
        if (welcomeScreen) {
            welcomeScreen.style.display = "flex";
        }
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.querySelector(".welcome-screen");
        if (welcomeScreen) {
            welcomeScreen.style.display = "none";
        }
    }

    startNewChat() {
        if (this.currentConversation.length > 0) {
            this.conversations.push([...this.currentConversation]);
            this.updateConversationList();
        }
        this.currentConversation = [];
        this.chatOutput.innerHTML = "";
        this.saveConversations();

        // Show welcome screen for new chat
        this.showWelcomeScreen();
    }

    clearHistory() {
        this.conversations = [];
        this.currentConversation = [];
        this.chatOutput.innerHTML = "";
        this.conversationList.innerHTML = "";
        this.saveConversations();

        // Show welcome screen after clearing history
        this.showWelcomeScreen();
    }

    updateStatus(newStatus) {
        const statusElement = document.querySelector(".status-selector"); // Substitua '.status-selector' pelo seletor correto
        if (statusElement) {
            statusElement.textContent = newStatus;
        } else {
            console.error("Elemento de status não encontrado!");
        }
    }

    updateConversationList() {
        this.conversationList.innerHTML = "";
        this.conversations.forEach((conv, index) => {
            const li = document.createElement("li");
            li.textContent = `Conversa ${index + 1}`;
            li.addEventListener("click", () => this.loadConversation(index));
            this.conversationList.appendChild(li);
        });
    }

    loadConversation(index) {
        this.currentConversation = [];
        this.chatOutput.innerHTML = "";

        this.conversations[index].forEach((msg) => {
            this.addMessage(msg.message, msg.sender, msg.image);
        });
    }

    saveConversations() {
        localStorage.setItem(
            "chatHistory",
            JSON.stringify({
                conversations: this.conversations,
                currentConversation: this.currentConversation,
            })
        );
    }

    loadConversations() {
        const saved = localStorage.getItem("chatHistory");
        if (saved) {
            const data = JSON.parse(saved);
            this.conversations = data.conversations;
            this.currentConversation = data.currentConversation;
            this.updateConversationList();
        }
    }
}

// Theme Switching
const initTheme = () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
};

// Modal Handling
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const themeToggle = document.getElementById("themeToggle");
const closeButtons = document.querySelectorAll(".close");

loginBtn.addEventListener("click", () => {
    loginModal.style.display = "block";
});

signupBtn.addEventListener("click", () => {
    signupModal.style.display = "block";
});

closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        loginModal.style.display = "none";
        signupModal.style.display = "none";
    });
});

window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = "none";
    }
    if (event.target === signupModal) {
        signupModal.style.display = "none";
    }
});

themeToggle.addEventListener("click", toggleTheme);

// Form Handling
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Add your login logic here
    loginModal.style.display = "none";
});

signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Add your signup logic here
    signupModal.style.display = "none";
});

// Initialize theme on page load
document.addEventListener("DOMContentLoaded", function () {
    new ChatBot();
    initTheme();
});