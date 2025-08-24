
class ChatBot {
    constructor() {
        this.conversations = [];
        this.currentConversation = [];
        this.isLoading = false;
        this.currentImage = null; // Para armazenar a imagem atual
        this.currentPdf = null; // Para armazenar o PDF atual
        
        // Verificar se jsPDF foi carregado
        console.log("Verificando jsPDF no construtor:");
        console.log("window.jsPDF:", typeof window.jsPDF);
        console.log("jsPDF global:", typeof jsPDF);
        
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
        
        // PDF elements
        this.pdfInput = document.getElementById("pdfInput");
        this.pdfBtn = document.getElementById("pdfBtn");
        this.pdfPreview = document.getElementById("pdfPreview");
        this.removePdfBtn = document.getElementById("removePdf");

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
        
        // PDF upload events
        this.pdfBtn.addEventListener("click", () => this.pdfInput.click());
        this.pdfInput.addEventListener("change", (e) => this.handlePdfUpload(e));
        this.removePdfBtn.addEventListener("click", () => this.removePdf());

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

    // PDF handling methods
    async handlePdfUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            try {
                // Carregar PDF.js se não estiver carregado
                if (typeof pdfjsLib === 'undefined') {
                    await this.loadPdfJs();
                }

                const arrayBuffer = await file.arrayBuffer();
                const pdfText = await this.extractTextFromPdf(arrayBuffer);
                
                this.currentPdf = {
                    data: arrayBuffer,
                    name: file.name,
                    type: file.type,
                    text: pdfText,
                    size: file.size
                };
                
                this.showPdfPreview(file.name, pdfText);
            } catch (error) {
                console.error('Erro ao processar PDF:', error);
                alert('Erro ao processar o PDF. Tente novamente.');
            }
        } else {
            alert('Por favor, selecione um arquivo PDF válido.');
        }
    }

    async loadPdfJs() {
        return new Promise((resolve, reject) => {
            if (typeof pdfjsLib !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async extractTextFromPdf(arrayBuffer) {
        try {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `\n--- Página ${i} ---\n${pageText}\n`;
            }
            
            return fullText.trim();
        } catch (error) {
            console.error('Erro ao extrair texto do PDF:', error);
            throw new Error('Não foi possível extrair o texto do PDF');
        }
    }

    showPdfPreview(fileName, text) {
        const previewText = text.length > 500 ? text.substring(0, 500) + '...' : text;
        this.pdfPreview.innerHTML = `
            <div class="pdf-preview-header">
                <span class="pdf-icon">📄</span>
                <span class="pdf-name">${fileName}</span>
                <button class="remove-pdf-btn" onclick="chatBot.removePdf()">×</button>
            </div>
            <div class="pdf-preview-text">${previewText}</div>
        `;
        this.pdfPreview.style.display = 'block';
    }

    removePdf() {
        this.currentPdf = null;
        this.pdfPreview.style.display = 'none';
        this.pdfInput.value = '';
    }

    handleSuggestionClick(button) {
        const suggestion = button.getAttribute('data-suggestion');
        const suggestionTexts = {
            'Criar uma atividade': 'Olá! Preciso de ajuda para criar uma atividade educacional. Pode me ajudar?',
            'Corrigir prova': 'Preciso corrigir uma prova ou trabalho. Como posso enviar o gabarito para você me ajudar?',
            'Plano de aula': 'Gostaria de ajuda para elaborar um plano de aula. Qual seria a melhor forma de começar?',
            'Exercícios': 'Preciso criar exercícios para meus alunos. Pode me ajudar com algumas sugestões?',
            'Análise de imagem': 'Vou enviar uma imagem para você analisar e me dar insights educacionais sobre ela.',
            'Análise de PDF': 'Vou enviar um PDF para você analisar e me dar feedback educacional sobre o conteúdo.',
            'Criar PDF': 'Gostaria que você criasse um PDF educacional para mim. Pode me ajudar?',
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
        if (!text && !this.currentImage && !this.currentPdf) return;

        // Check if user wants to generate an image using keywords
        if (this.isImageGenerationRequest(text)) {
            this.handleImageGenerationFromText(text);
            return;
        }

        // Check if user wants to create a PDF
        if (this.isPdfCreationRequest(text)) {
            this.handlePdfCreationFromText(text);
            return;
        }

        try {
            this.addMessage(text, "user", this.currentImage, this.currentPdf);
            this.userInput.value = "";
            
            // Store file references and clear them
            const imageToSend = this.currentImage;
            const pdfToSend = this.currentPdf;
            this.removeImage();
            this.removePdf();

            this.setLoading(true);
            const response = await this.generateResponse(text, imageToSend, pdfToSend);
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

    isPdfCreationRequest(text) {
        const pdfKeywords = [
            'crie um pdf',
            'criar um pdf',
            'gere um pdf',
            'gerar um pdf',
            'faça um pdf',
            'fazer um pdf',
            'monte um pdf',
            'montar um pdf',
            'produza um pdf',
            'produzir um pdf',
            'crie pdf',
            'criar pdf',
            'gere pdf',
            'gerar pdf',
            'exporte para pdf',
            'exportar para pdf',
            'salve em pdf',
            'salvar em pdf',
            'transforme em pdf',
            'transformar em pdf'
        ];

        const lowerText = text.toLowerCase();
        return pdfKeywords.some(keyword => lowerText.includes(keyword));
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

    addMessage(message, sender, image = null, pdf = null) {
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

        // Add PDF if present
        if (pdf) {
            const pdfDiv = document.createElement("div");
            pdfDiv.className = "message-pdf";
            pdfDiv.innerHTML = `
                <div class="pdf-info">
                    <span class="pdf-icon">📄</span>
                    <span class="pdf-name">${pdf.name}</span>
                    <span class="pdf-size">(${(pdf.size / 1024).toFixed(1)} KB)</span>
                </div>
            `;
            contentDiv.appendChild(pdfDiv);
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

        this.currentConversation.push({ sender, message, image, pdf });
    }

    async generateResponse(message, image = null, pdf = null) {
        return await this.getBotResponse(message, image, pdf);
    }

    async getBotResponse(message, image = null, pdf = null) {
        const API_KEY = "AIzaSyBmXICpEOU1V4oLuTcELyRNFehiRcD8aWw";
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

        console.log("Sending request to API:", API_URL);

        // Prepare the content parts
        let parts = [];

        // Analyze the message to provide better context
        const enhancedPrompt = this.enhancePromptForEducation(message, image, pdf);

        if (message || image || pdf) {
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

    enhancePromptForEducation(message, image, pdf) {
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

📄 QUANDO ANALISAR PDFs:
• Analise todo o conteúdo de texto extraído do PDF
• Identifique o tipo de documento (prova, atividade, material didático, etc.)
• Forneça feedback educacional específico
• Sugira melhorias, correções ou atividades complementares
• Se for uma prova, ofereça critérios de correção

🎨 GERAÇÃO DE IMAGENS:
• POSSO criar imagens educacionais! Use comandos como "Gere uma imagem de...", "Crie uma imagem de...", "Desenhe...", etc.
• Sugira imagens relevantes para ilustrar conceitos educacionais
• Ofereça criar materiais visuais para aulas e atividades
• Use imagens para tornar o aprendizado mais visual e atrativo

📝 CRIAÇÃO DE PDFs:
• POSSO criar PDFs educacionais! Use comandos como "Crie um PDF sobre...", "Gere um PDF de...", etc.
• Ofereça criar materiais pedagógicos em PDF
• Sugira formatos apropriados para cada tipo de conteúdo

⚠️ LIMITAÇÕES QUE DEVO INFORMAR:
• "Não tenho acesso à internet em tempo real para informações atualizadas"
• "Não posso acessar sistemas externos ou fazer downloads"
• "Para informações muito específicas ou técnicas, recomendo consultar fontes especializadas"`;

        // Detect the type of request and enhance accordingly
        if (!message && image && !pdf) {
            return basePrompt + `\n\nO usuário enviou apenas uma imagem. Analise-a detalhadamente e forneça insights educacionais relevantes.`;
        }

        if (!message && !image && pdf) {
            return basePrompt + `\n\nO usuário enviou um PDF: "${pdf.name}". 
            
Analise o conteúdo do PDF extraído abaixo e forneça insights educacionais relevantes:

CONTEÚDO DO PDF:
${pdf.text}

Forneça uma análise educacional detalhada do documento.`;
        }

        const lowerMessage = message ? message.toLowerCase() : '';
        
        // Enhanced prompts for specific educational tasks
        if (lowerMessage.includes('atividade') || lowerMessage.includes('exercício')) {
            let prompt = basePrompt + `\n\nO professor está solicitando ajuda com criação de atividade/exercício. 
            
INSTRUÇÕES ESPECÍFICAS:
• Pergunte sobre: série/ano, disciplina, tema específico, objetivos de aprendizagem
• Sugira diferentes tipos de atividades (individual, grupo, prática, teórica)
• Inclua critérios de avaliação quando relevante
• Considere diferentes níveis de dificuldade

Solicitação: ${message}`;

            if (pdf) {
                prompt += `\n\nO usuário também enviou um PDF: "${pdf.name}". Use o conteúdo abaixo como base para criar a atividade:

CONTEÚDO DO PDF:
${pdf.text}`;
            }

            return prompt;
        }
        
        if (lowerMessage.includes('correção') || lowerMessage.includes('corrigir') || lowerMessage.includes('gabarito')) {
            let prompt = basePrompt + `\n\nO professor precisa de ajuda com correção. 
            
INSTRUÇÕES ESPECÍFICAS:
• Se não houver gabarito, solicite o critério de correção
• Forneça feedback construtivo para os alunos
• Identifique pontos fortes e áreas para melhoria
• Sugira como dar devolutiva aos estudantes

Solicitação: ${message}`;

            if (pdf) {
                prompt += `\n\nO usuário enviou um PDF para correção: "${pdf.name}". Analise o conteúdo abaixo:

CONTEÚDO DO PDF:
${pdf.text}

Forneça uma correção detalhada e feedback educacional.`;
            }

            return prompt;
        }
        
        if (lowerMessage.includes('plano de aula') || lowerMessage.includes('planejamento')) {
            let prompt = basePrompt + `\n\nO professor está planejando uma aula. 
            
INSTRUÇÕES ESPECÍFICAS:
• Pergunte sobre: disciplina, série/ano, tempo de aula, tema/conteúdo
• Estruture: objetivos, metodologia, recursos, avaliação
• Considere diferentes estratégias pedagógicas
• Inclua sugestões de materiais e recursos

Solicitação: ${message}`;

            if (pdf) {
                prompt += `\n\nO usuário enviou um PDF como material de apoio: "${pdf.name}". Use o conteúdo abaixo para o planejamento:

CONTEÚDO DO PDF:
${pdf.text}`;
            }

            return prompt;
        }

        let finalPrompt = basePrompt + `\n\nPergunta do usuário: ${message}\n\nResponda de acordo com essas diretrizes, sendo útil, preciso e honesto sobre suas capacidades e limitações.`;

        if (pdf) {
            finalPrompt += `\n\nO usuário também enviou um PDF: "${pdf.name}". Considere o conteúdo abaixo em sua resposta:

CONTEÚDO DO PDF:
${pdf.text}`;
        }

        return finalPrompt;
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

    // PDF Creation Methods
    async handlePdfCreationFromText(text) {
        try {
            console.log("=== INICIANDO CRIAÇÃO DE PDF ===");
            console.log("Texto solicitado:", text);
            
            this.addMessage(text, "user");
            this.userInput.value = "";
            
            this.setLoading(true);
            
            console.log("Tentando carregar jsPDF...");
            
            // Tentar carregar jsPDF, mas se falhar, usar método alternativo
            try {
                await this.loadJsPdf();
                
                if (typeof window.jsPDF === 'undefined') {
                    throw new Error("jsPDF não foi carregado");
                }
                
                console.log("jsPDF carregado com sucesso!");
            } catch (error) {
                console.log("jsPDF não pôde ser carregado, usando método alternativo:", error.message);
                // Continuar com método alternativo - não parar aqui
            }
            
            const testContent = `FÍSICA QUÂNTICA - INTRODUÇÃO

Este é um material educacional sobre os fundamentos da física quântica.

PRINCIPAIS CONCEITOS:

1. Quantum
   - Menor quantidade de energia que pode ser emitida ou absorvida
   - Base da teoria quântica

2. Dualidade Onda-Partícula
   - Partículas subatômicas podem se comportar como ondas
   - Experimento da dupla fenda

3. Princípio da Incerteza de Heisenberg
   - Impossibilidade de determinar simultaneamente posição e velocidade
   - Fundamental para a mecânica quântica

APLICAÇÕES PRÁTICAS:
- Computadores quânticos
- Lasers e tecnologia óptica
- Ressonância magnética
- Energia nuclear

Este material foi criado pelo CorrigeAI para fins educacionais.`;

            console.log("Criando documento...");
            const pdfBlob = await this.createPdfFromContent(testContent, "Física Quântica - Material Educacional");
            
            console.log("Documento criado, adicionando à conversa...");
            this.addPdfMessage(testContent, pdfBlob, "Física Quântica - Material Educacional");
            this.saveConversations();
            
            console.log("=== PROCESSO CONCLUÍDO COM SUCESSO ===");
            
        } catch (error) {
            console.error("=== ERRO NO PROCESSO ===");
            console.error("Erro:", error.message);
            console.error("Stack:", error.stack);
            this.addMessage(`Erro ao criar documento: ${error.message}`, "bot");
        } finally {
            this.setLoading(false);
        }
    }

    async createPdfFromContent(content, title) {
        console.log("=== CRIANDO DOCUMENTO ===");
        console.log("Título:", title);
        console.log("Verificando jsPDF:", typeof window.jsPDF);
        
        // Se jsPDF está disponível, tentar usá-lo
        if (typeof window.jsPDF !== 'undefined') {
            try {
                console.log("Usando jsPDF para criar PDF...");
                const { jsPDF } = window;
                const doc = new jsPDF();
                
                // Configurações básicas
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 20;
                const maxWidth = pageWidth - (margin * 2);
                let currentY = margin;

                // Título
                doc.setFontSize(16);
                doc.text(title, margin, currentY);
                currentY += 20;

                // Conteúdo simplificado
                doc.setFontSize(12);
                const simpleContent = content.replace(/[#*•]/g, '').substring(0, 1000);
                const lines = doc.splitTextToSize(simpleContent, maxWidth);
                
                for (let i = 0; i < Math.min(lines.length, 50); i++) {
                    if (currentY > pageHeight - margin) {
                        doc.addPage();
                        currentY = margin;
                    }
                    doc.text(lines[i], margin, currentY);
                    currentY += 6;
                }

                const blob = doc.output('blob');
                console.log("PDF real criado com sucesso:", blob.size, "bytes");
                return blob;
                
            } catch (pdfError) {
                console.log("Erro ao criar PDF com jsPDF:", pdfError.message);
                console.log("Usando método alternativo...");
                // Continuar para método alternativo
            }
        }
        
        // Método alternativo - sempre funciona
        console.log("Criando documento HTML como alternativa...");
        return await this.createPdfFallback(content, title);
    }

    async createPdfFallback(content, title) {
        console.log("=== CRIANDO DOCUMENTO HTML ALTERNATIVO ===");
        
        try {
            // Processar o conteúdo para melhor formatação
            const processedContent = content
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^(\d+\..*)/gm, '<div style="margin-left: 20px;">$1</div>')
                .replace(/^(-|•)(.*)/gm, '<div style="margin-left: 20px;">• $2</div>');
            
            // Criar um documento HTML bem formatado
            const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.8;
            color: #333;
            background: #fff;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
            font-size: 28px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 22px;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 25px;
            margin-bottom: 10px;
            font-size: 18px;
        }
        p {
            margin-bottom: 15px;
            text-align: justify;
        }
        .content {
            font-size: 14px;
            line-height: 1.8;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
        }
        .highlight {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        strong {
            color: #2c3e50;
        }
        @media print {
            body { margin: 0; padding: 20px; }
            .footer { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="content">
        <p>${processedContent}</p>
    </div>
    <div class="footer">
        <p><strong>Documento criado pelo CorrigeAI</strong></p>
        <p>Data de criação: ${new Date().toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</p>
        <p><em>Para salvar como PDF: Ctrl+P → Salvar como PDF</em></p>
    </div>
</body>
</html>`;
            
            // Criar um blob com o conteúdo HTML
            const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
            console.log("Documento HTML criado:", blob.size, "bytes");
            console.log("Tipo do blob:", blob.type);
            
            return blob;
            
        } catch (error) {
            console.error("Erro no método alternativo:", error);
            
            // Fallback ainda mais simples
            const simpleHtml = `<html><head><title>${title}</title></head><body><h1>${title}</h1><pre>${content}</pre><p>Criado em ${new Date().toLocaleString('pt-BR')}</p></body></html>`;
            return new Blob([simpleHtml], { type: 'text/html' });
        }
    }

    async loadJsPdf() {
        console.log("=== CARREGANDO jsPDF ===");
        
        return new Promise((resolve, reject) => {
            // Primeiro verificar se já está disponível
            if (typeof window.jsPDF !== 'undefined') {
                console.log("jsPDF já está disponível");
                resolve();
                return;
            }
            
            // Lista de CDNs para tentar
            const cdnUrls = [
                'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
                'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
            ];
            
            let currentIndex = 0;
            
            const tryLoadFromCdn = () => {
                if (currentIndex >= cdnUrls.length) {
                    reject(new Error("Não foi possível carregar jsPDF de nenhum CDN"));
                    return;
                }
                
                console.log(`Tentando carregar jsPDF de: ${cdnUrls[currentIndex]}`);
                
                const script = document.createElement('script');
                script.src = cdnUrls[currentIndex];
                
                script.onload = () => {
                    console.log(`jsPDF carregado com sucesso de: ${cdnUrls[currentIndex]}`);
                    // Aguardar um pouco para garantir inicialização
                    setTimeout(() => {
                        if (typeof window.jsPDF !== 'undefined') {
                            console.log("jsPDF confirmado e pronto");
                            resolve();
                        } else {
                            console.log("jsPDF não foi inicializado corretamente, tentando próximo CDN");
                            currentIndex++;
                            tryLoadFromCdn();
                        }
                    }, 200);
                };
                
                script.onerror = () => {
                    console.log(`Falha ao carregar de: ${cdnUrls[currentIndex]}`);
                    currentIndex++;
                    tryLoadFromCdn();
                };
                
                document.head.appendChild(script);
            };
            
            tryLoadFromCdn();
        });
    }

    processMarkdownForPdf(content) {
        // Remove formatação markdown para texto simples no PDF
        return content
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
            .replace(/\*(.*?)\*/g, '$1')      // Remove italic
            .replace(/^#+\s+/gm, '')          // Remove headers
            .replace(/^[-•]\s+/gm, '• ')      // Padroniza bullets
            .replace(/^\d+\.\s+/gm, '• ');    // Converte números em bullets
    }

    addPdfMessage(content, pdfBlob, title) {
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
        
        // Conteúdo formatado
        const text = document.createElement("div");
        text.className = "message-text";
        text.innerHTML = this.formatMessage(content);
        
        // Container do PDF
        const pdfContainer = document.createElement("div");
        pdfContainer.className = "pdf-download-container";
        
        const downloadBtn = document.createElement("button");
        downloadBtn.className = "pdf-download-btn";
        
        // Verificar o tipo do arquivo
        const isHtml = pdfBlob.type === 'text/html';
        const fileExtension = isHtml ? '.html' : '.pdf';
        const fileIcon = isHtml ? '📄' : '📋';
        const fileDescription = isHtml ? 'Documento HTML' : 'PDF';
        
        downloadBtn.innerHTML = `
            <span class="pdf-icon">${fileIcon}</span>
            <span>Baixar ${fileDescription}: ${title}</span>
        `;
        
        downloadBtn.onclick = () => {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}${fileExtension}`;
            a.click();
            URL.revokeObjectURL(url);
        };
        
        pdfContainer.appendChild(downloadBtn);
        messageContent.appendChild(text);
        messageContent.appendChild(pdfContainer);
        messageDiv.appendChild(messageContent);
        
        this.chatOutput.appendChild(messageDiv);
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
        
        // Add to conversation history
        this.currentConversation.push({ 
            sender: "bot", 
            message: content,
            pdfTitle: title,
            hasPdf: true
        });
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
document.addEventListener("DOMContentLoaded", async function () {
    console.log("DOM carregado, verificando dependências...");
    
    // Aguardar um pouco para garantir que scripts externos sejam carregados
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("Verificação final do jsPDF:");
    console.log("window.jsPDF:", typeof window.jsPDF);
    console.log("global jsPDF:", typeof jsPDF);
    
    window.chatBot = new ChatBot();
    initTheme();
    
    console.log("ChatBot e tema inicializados");
});