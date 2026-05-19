/* =========================
   CHATBOT PUBLIC DYNAMIQUE
   Réponses depuis backend + PostgreSQL
========================= */

let chatOpen = false;

const CHATBOT_API_URL =
  window.location.origin.includes("localhost:5000")
    ? "/api/chatbot"
    : "http://localhost:5000/api/chatbot";

function toggleChat() {
  chatOpen = !chatOpen;

  const chatWindow = document.getElementById("chat-window");
  const chatButton = document.getElementById("chat-toggle-btn");

  if (!chatWindow || !chatButton) return;

  chatWindow.classList.toggle("open", chatOpen);
  chatButton.textContent = chatOpen ? "✕" : "💬";
}

function addMsg(text, type) {
  const container = document.getElementById("chat-messages");

  if (!container) return;

  const msg = document.createElement("div");
  msg.className = "chat-msg " + type;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text;

  msg.appendChild(bubble);
  container.appendChild(msg);

  container.scrollTop = container.scrollHeight;
}

function addTyping() {
  const container = document.getElementById("chat-messages");

  if (!container) return null;

  const typing = document.createElement("div");
  typing.className = "chat-msg bot";
  typing.id = "typing";

  typing.innerHTML = `
    <div class="chat-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;

  return typing;
}

async function sendChat() {
  const input = document.getElementById("chat-input");

  if (!input) return;

  const text = input.value.trim();

  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  const typing = addTyping();

  try {
    const response = await fetch(`${CHATBOT_API_URL}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();

    if (typing) typing.remove();

    addMsg(
      data.reply || "Désolé, je n’ai pas bien compris votre question.",
      "bot"
    );
  } catch (error) {
    console.error("Erreur chatbot :", error);

    if (typing) typing.remove();

    addMsg(
      "Erreur de connexion avec le serveur. Veuillez réessayer plus tard.",
      "bot"
    );
  }
}

function sendQuickMsg(text) {
  const input = document.getElementById("chat-input");

  if (!input) return;

  input.value = text;
  sendChat();
}

/* Rendre les fonctions accessibles aux onclick HTML */
window.toggleChat = toggleChat;
window.sendChat = sendChat;
window.sendQuickMsg = sendQuickMsg;