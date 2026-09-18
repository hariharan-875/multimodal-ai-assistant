// ============================================================
// MULTIMODAL AI - FRONTEND JAVASCRIPT
// ============================================================


// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL = "/generate";


// ============================================================
// DOM ELEMENTS
// ============================================================

const promptInput = document.getElementById("promptInput");
const inputType = document.getElementById("inputType");
const fileInput = document.getElementById("fileInput");

const sendButton = document.getElementById("sendButton");

const messages = document.getElementById("messages");
const chatList = document.getElementById("chatList");

const welcomeScreen = document.getElementById("welcomeScreen");
const filePreview = document.getElementById("filePreview");

const sidebar = document.getElementById("sidebar");


// ============================================================
// APPLICATION STATE
// ============================================================

let currentFile = null;

let chatHistory = [];


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    loadChatHistory();

    autoResize(promptInput);

    setupKeyboardEvents();

});


// ============================================================
// KEYBOARD EVENTS
// ============================================================

function setupKeyboardEvents() {

    promptInput.addEventListener("keydown", (event) => {

        // Enter = Send
        // Shift + Enter = New line

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    });

}


// ============================================================
// SIDEBAR TOGGLE
// ============================================================

function toggleSidebar() {

    sidebar.classList.toggle("open");

}


// ============================================================
// NEW CHAT
// ============================================================

function newChat() {

    currentFile = null;

    promptInput.value = "";

    messages.innerHTML = "";

    filePreview.innerHTML = "";

    welcomeScreen.style.display = "block";

    fileInput.value = "";

    autoResize(promptInput);

    promptInput.focus();

}


// ============================================================
// AUTO RESIZE TEXTAREA
// ============================================================

function autoResize(element) {

    if (!element) {
        return;
    }

    element.style.height = "auto";

    element.style.height =
        Math.min(
            element.scrollHeight,
            160
        ) + "px";

}


// ============================================================
// INPUT TYPE CHANGE
// ============================================================

function changeInputType() {

    const type = inputType.value;

    // Clear previous file

    currentFile = null;

    fileInput.value = "";

    filePreview.innerHTML = "";


    // Configure accepted file types

    if (type === "image") {

        fileInput.accept =
            "image/png,image/jpeg,image/jpg";

    } else if (type === "pdf") {

        fileInput.accept =
            "application/pdf";

    } else if (type === "audio") {

        fileInput.accept =
            "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a";

    } else {

        fileInput.accept = "";

    }

}


// ============================================================
// HANDLE FILE
// ============================================================

function handleFile(input) {

    if (!input.files || input.files.length === 0) {

        currentFile = null;

        filePreview.innerHTML = "";

        return;

    }


    const file = input.files[0];

    currentFile = file;


    showFilePreview(file);

}


// ============================================================
// SHOW FILE PREVIEW
// ============================================================

function showFilePreview(file) {

    const fileSize =
        formatFileSize(file.size);


    filePreview.innerHTML = "";


    const chip =
        document.createElement("div");

    chip.className = "file-chip";


    let icon = "📎";


    if (
        file.type.startsWith("image/")
    ) {

        icon = "🖼️";

    } else if (
        file.type === "application/pdf"
    ) {

        icon = "📄";

    } else if (
        file.type.startsWith("audio/")
    ) {

        icon = "🎵";

    }


    chip.innerHTML = `
        <span>${icon}</span>
        <span>${escapeHtml(file.name)}</span>
        <span>(${fileSize})</span>

        <button
            type="button"
            class="remove-file"
            onclick="removeFile()"
            style="
                border:none;
                background:transparent;
                cursor:pointer;
                font-size:16px;
                margin-left:4px;
            "
        >
            ×
        </button>
    `;


    filePreview.appendChild(chip);

}


// ============================================================
// REMOVE FILE
// ============================================================

function removeFile() {

    currentFile = null;

    fileInput.value = "";

    filePreview.innerHTML = "";

}


// ============================================================
// FORMAT FILE SIZE
// ============================================================

function formatFileSize(bytes) {

    if (bytes === 0) {

        return "0 Bytes";

    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(1024, index)
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );

}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const prompt =
        promptInput.value.trim();


    const type =
        inputType.value;


    // --------------------------------------------------------
    // VALIDATE PROMPT
    // --------------------------------------------------------

    if (!prompt) {

        promptInput.focus();

        return;

    }


    // --------------------------------------------------------
    // VALIDATE FILE
    // --------------------------------------------------------

    if (
        type !== "text" &&
        !currentFile
    ) {

        showTemporaryMessage(
            `Please upload a ${
                type === "image"
                    ? "image"
                    : type === "pdf"
                        ? "PDF"
                        : "audio file"
            }.`
        );

        return;

    }


    // --------------------------------------------------------
    // SHOW USER MESSAGE
    // --------------------------------------------------------

    addUserMessage(
        prompt,
        currentFile
    );


    // --------------------------------------------------------
    // HIDE WELCOME
    // --------------------------------------------------------

    welcomeScreen.style.display = "none";


    // --------------------------------------------------------
    // LOADING
    // --------------------------------------------------------

    const loadingId =
        showLoadingMessage();


    // --------------------------------------------------------
    // DISABLE SEND
    // --------------------------------------------------------

    setSendingState(true);


    try {

        // ====================================================
        // FORM DATA
        // ====================================================

        const formData =
            new FormData();


        formData.append(
            "prompt",
            prompt
        );


        formData.append(
            "input_type",
            type
        );


        if (currentFile) {

            formData.append(
                "file",
                currentFile
            );

        }


        // ====================================================
        // API REQUEST
        // ====================================================

        const response =
            await fetch(
                API_URL, {
                    method: "POST",
                    body: formData
                }
            );


        // ====================================================
        // CHECK HTTP RESPONSE
        // ====================================================

        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        // ====================================================
        // JSON
        // ====================================================

        const data =
            await response.json();


        // ====================================================
        // REMOVE LOADING
        // ====================================================

        removeLoadingMessage(
            loadingId
        );


        // ====================================================
        // API ERROR
        // ====================================================

        if (!data.success) {

            addAIMessage(
                data.response ||
                "Something went wrong."
            );

        } else {

            addAIMessage(
                data.response
            );

        }


        // ====================================================
        // SAVE CHAT
        // ====================================================

        saveChat(
            prompt,
            data.response,
            type,
            currentFile
        );


    } catch (error) {

        console.error(
            "API Error:",
            error
        );


        removeLoadingMessage(
            loadingId
        );


        addAIMessage(
            `Something went wrong: ${error.message}`
        );

    } finally {

        // ----------------------------------------------------
        // RESET INPUT
        // ----------------------------------------------------

        promptInput.value = "";

        autoResize(promptInput);


        currentFile = null;

        fileInput.value = "";

        filePreview.innerHTML = "";


        setSendingState(false);


        promptInput.focus();

    }

}


// ============================================================
// ADD USER MESSAGE
// ============================================================

function addUserMessage(
    text,
    file = null
) {

    const message =
        document.createElement("div");


    message.className =
        "user-message";


    const content =
        document.createElement("div");


    content.className =
        "user-message-content";


    let html = "";


    // Text

    html += `
        <div>
            ${formatText(text)}
        </div>
    `;


    // File information

    if (file) {

        let icon = "📎";


        if (
            file.type.startsWith("image/")
        ) {

            icon = "🖼️";

        } else if (
            file.type === "application/pdf"
        ) {

            icon = "📄";

        } else if (
            file.type.startsWith("audio/")
        ) {

            icon = "🎵";

        }


        html += `
            <div
                style="
                    margin-top:10px;
                    padding:8px 10px;
                    background:#ffffff;
                    border-radius:10px;
                    font-size:12px;
                "
            >
                ${icon}
                ${escapeHtml(file.name)}
            </div>
        `;

    }


    content.innerHTML = html;


    message.appendChild(
        content
    );


    messages.appendChild(
        message
    );


    scrollToBottom();

}


// ============================================================
// ADD AI MESSAGE
// ============================================================

function addAIMessage(text) {

    const message =
        document.createElement("div");


    message.className =
        "ai-message";


    const avatar =
        document.createElement("div");


    // No robot icon

    avatar.className =
        "ai-avatar";


    const content =
        document.createElement("div");


    content.className =
        "ai-message-content";


    content.innerHTML =
        formatAIResponse(text);


    message.appendChild(
        avatar
    );


    message.appendChild(
        content
    );


    messages.appendChild(
        message
    );


    scrollToBottom();

}


// ============================================================
// FORMAT AI RESPONSE
// ============================================================

function formatAIResponse(text) {

    if (!text) {

        return "No response received.";

    }


    let result =
        escapeHtml(String(text));


    // Bold

    result =
        result.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // Inline code

    result =
        result.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    // Bullet points

    result =
        result.replace(
            /^\s*\*\s+/gm,
            "• "
        );


    // Numbered lists

    result =
        result.replace(
            /^\s*(\d+)\.\s+/gm,
            "$1. "
        );


    // New lines

    result =
        result.replace(
            /\n/g,
            "<br>"
        );


    return result;

}


// ============================================================
// FORMAT USER TEXT
// ============================================================

function formatText(text) {

    return escapeHtml(
        text
    ).replace(
        /\n/g,
        "<br>"
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// LOADING MESSAGE
// ============================================================

function showLoadingMessage() {

    const id =
        "loading-" +
        Date.now();


    const message =
        document.createElement("div");


    message.className =
        "ai-message";


    message.id = id;


    const avatar =
        document.createElement("div");


    avatar.className =
        "ai-avatar";


    const content =
        document.createElement("div");


    content.className =
        "ai-message-content";


    content.innerHTML = `
        <span class="loading-text">
            Thinking
        </span>

        <span class="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
        </span>
    `;


    message.appendChild(
        avatar
    );


    message.appendChild(
        content
    );


    messages.appendChild(
        message
    );


    scrollToBottom();


    return id;

}


// ============================================================
// REMOVE LOADING
// ============================================================

function removeLoadingMessage(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.remove();

    }

}


// ============================================================
// SENDING STATE
// ============================================================

function setSendingState(
    sending
) {

    sendButton.disabled =
        sending;


    if (sending) {

        sendButton.style.opacity =
            "0.55";

        sendButton.style.cursor =
            "not-allowed";

    } else {

        sendButton.style.opacity =
            "1";

        sendButton.style.cursor =
            "pointer";

    }

}


// ============================================================
// TEMPORARY MESSAGE
// ============================================================

function showTemporaryMessage(
    text
) {

    const message =
        document.createElement("div");


    message.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #252b31;
        color: white;
        padding: 11px 18px;
        border-radius: 10px;
        font-size: 13px;
        z-index: 9999;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    `;


    message.textContent =
        text;


    document.body.appendChild(
        message
    );


    setTimeout(
        () => {

            message.remove();

        },
        2500
    );

}


// ============================================================
// SCROLL TO BOTTOM
// ============================================================

function scrollToBottom() {

    setTimeout(
        () => {

            const container =
                document.getElementById(
                    "chatContainer"
                );


            if (container) {

                container.scrollTop =
                    container.scrollHeight;

            }

        },
        50
    );

}


// ============================================================
// SAVE CHAT
// ============================================================

function saveChat(
    question,
    response,
    type,
    file
) {

    const chat = {

        id: Date.now(),

        question: question,

        response: response,

        type: type,

        fileName: file ?
            file.name : null,

        time: new Date().toISOString()

    };


    chatHistory.push(
        chat
    );


    localStorage.setItem(
        "multimodal_chat_history",
        JSON.stringify(
            chatHistory
        )
    );


    updateSidebar();

}


// ============================================================
// LOAD CHAT HISTORY
// ============================================================

function loadChatHistory() {

    try {

        const saved =
            localStorage.getItem(
                "multimodal_chat_history"
            );


        if (saved) {

            chatHistory =
                JSON.parse(saved);

        }

    } catch (error) {

        console.error(
            "Unable to load chat history:",
            error
        );

        chatHistory = [];

    }


    updateSidebar();

}


// ============================================================
// UPDATE SIDEBAR
// ============================================================

function updateSidebar() {
    if (!chatList) return;

    chatList.innerHTML = "";

    if (chatHistory.length === 0) {
        chatList.innerHTML = `
            <div class="empty-chat">
                <div class="empty-chat-icon">💬</div>
                <div>No chats yet.</div>
                <small>Start a new conversation!</small>
            </div>
        `;
        return;
    }

    const reversed = [...chatHistory].reverse();

    reversed.forEach((chat) => {

        const item = document.createElement("div");

        item.className = "chat-history-item";

        item.innerHTML = `
            <div class="chat-history-content">
                <div class="chat-history-title">
                    ${escapeHtml(
                        chat.question.length > 32
                            ? chat.question.substring(0, 32) + "..."
                            : chat.question
                    )}
                </div>

                <div class="chat-history-type">
                    ${escapeHtml(chat.type)}
                </div>
            </div>

            <button
                class="delete-history-btn"
                title="Delete"
                type="button"
            >
                🗑
            </button>
        `;

        // Open chat
        item.querySelector(".chat-history-content")
            .addEventListener("click", () => {
                loadChat(chat);
            });

        // Delete chat
        item.querySelector(".delete-history-btn")
            .addEventListener("click", (event) => {
                event.stopPropagation();

                deleteChat(chat.id);
            });

        chatList.appendChild(item);
    });
}


// ============================================================
// DELETE SINGLE HISTORY
// ============================================================

function deleteChat(chatId) {

    chatHistory = chatHistory.filter(
        chat => chat.id !== chatId
    );

    localStorage.setItem(
        "multimodal_chat_history",
        JSON.stringify(chatHistory)
    );

    updateSidebar();

    newChat();
}


// ============================================================
// DELETE SINGLE CHAT
// ============================================================

function deleteChat(chatId) {

    const confirmed =
        confirm("Delete this chat?");

    if (!confirmed) {
        return;
    }


    chatHistory =
        chatHistory.filter(
            chat => chat.id !== chatId
        );


    localStorage.setItem(
        "multimodal_chat_history",
        JSON.stringify(chatHistory)
    );


    updateSidebar();


    // Clear current screen

    newChat();

}

// ============================================================
// LOAD OLD CHAT
// ============================================================

function loadChat(chat) {

    welcomeScreen.style.display =
        "none";


    messages.innerHTML = "";


    addUserMessage(
        chat.question
    );


    addAIMessage(
        chat.response
    );


    scrollToBottom();

}


// ============================================================
// CLEAR ALL CHAT HISTORY
// ============================================================

function clearChatHistory() {

    chatHistory = [];


    localStorage.removeItem(
        "multimodal_chat_history"
    );


    updateSidebar();


    newChat();

}


// ============================================================
// GLOBAL KEYBOARD SHORTCUT
// ============================================================

document.addEventListener(
    "keydown",
    (event) => {

        // Ctrl + K = New Chat

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            newChat();

        }

    }
);


// ============================================================
// FEATURE CARD CLICK
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const cards =
            document.querySelectorAll(
                ".feature-card"
            );


        cards.forEach(
            (card, index) => {

                card.style.cursor =
                    "pointer";


                card.addEventListener(
                    "click",
                    () => {

                        const types = [
                            "text",
                            "image",
                            "pdf",
                            "audio"
                        ];


                        inputType.value =
                            types[index];


                        changeInputType();


                        promptInput.focus();

                    }
                );

            }
        );

    }
);