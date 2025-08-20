
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

        // Paste event for images
        this.userInput.addEventListener("paste", (e) => this.handlePaste(e));
        document.addEventListener("paste", (e) => this.handlePaste(e));

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
        this.loadingAnimation.style.display = loading ? "block" : "none";
        this.sendButton.disabled = loading;
        this.userInput.disabled = loading;

        if (loading) {
            // Scroll to bottom to show loading animation
            this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
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

    async handleUserInput() {
        const message = this.userInput.value.trim();
        if (!message && !this.currentImage) return;

        // Hide welcome screen on first message
        this.hideWelcomeScreen();

        // Add user message with image if present
        this.addMessage(message, "user", this.currentImage);
        this.userInput.value = "";

        // Store current image for API call
        const imageForAPI = this.currentImage;

        // Clear image after sending
        this.removeImage();

        // Show loading animation
        this.setLoading(true);

        try {
            // Send message with image to API
            const response = await this.getBotResponse(message, imageForAPI);

            // Hide loading animation
            this.setLoading(false);

            this.addMessage(response, "bot");
        } catch (error) {
            console.error("Erro:", error);

            // Hide loading animation
            this.setLoading(false);

            this.addMessage(
                "Desculpe, ocorreu um erro ao processar sua mensagem.",
                "bot"
            );
        }

        this.saveConversations();
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

    async getBotResponse(message, image = null) {
        const API_KEY = "AIzaSyBmXICpEOU1V4oLuTcELyRNFehiRcD8aWw";
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

        console.log("Sending request to API:", API_URL);

        // Prepare the content parts
        let parts = [];

        if (message) {
            parts.push({
                text: `Você é um assistente educacional para professores. Sua função é:
Ler e interpretar arquivos enviados (de qualquer formato, incluindo imagens).
Ajudar a criar atividades, exercícios e conteúdos para as aulas.
Corrigir provas e trabalhos com base no gabarito fornecido pelos professores.
Pesquisar e fornecer informações precisas e confiáveis, sempre em português, de forma clara, objetiva e didática.
Ser educado, prestativo e apoiar o professor em suas tarefas.
Criar imagens ilustrativas sempre que necessário para complementar o conteúdo.
Quando receber imagens, deve analisá-las e buscar informações relevantes em todas as fontes possíveis para auxiliar o professor.`
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
                        temperature: 0.9,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
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
            return "Ops, deu um erro aqui! Você tem talento pra quebrar as coisas, hein? 😅 Tenta de novo!";
        }
    }

    formatMessage(message) {
        // Convert URLs to clickable links
        message = message.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );

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