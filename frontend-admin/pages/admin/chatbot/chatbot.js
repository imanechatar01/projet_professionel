const API_URL = "http://localhost:5000/api/chatbot";

const form = document.getElementById("faq-form");
const faqList = document.getElementById("faq-list");

const faqIdInput = document.getElementById("faq-id");
const questionInput = document.getElementById("question");
const reponseInput = document.getElementById("reponse");
const keywordsInput = document.getElementById("keywords");
const categorieInput = document.getElementById("categorie");
const actifInput = document.getElementById("actif");

const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");

// Charger toutes les FAQ depuis la base de données
async function loadFaqs() {
  try {
    const response = await fetch(`${API_URL}/faqs`);
    const faqs = await response.json();

    if (!Array.isArray(faqs) || faqs.length === 0) {
      faqList.innerHTML = "<p>Aucune FAQ trouvée.</p>";
      return;
    }

    faqList.innerHTML = faqs
      .map(
        (faq) => `
        <div class="faq-item">
          <div class="faq-question">${faq.question}</div>

          <div class="faq-answer">${faq.reponse}</div>

          <div class="faq-meta">
            Catégorie : ${faq.categorie || "general"} |
            Mots-clés : ${faq.keywords || "aucun"} |
            Statut :
            <span class="${faq.actif ? "status-active" : "status-inactive"}">
              ${faq.actif ? "Active" : "Inactive"}
            </span>
          </div>

          <button class="btn-edit" onclick='editFaq(${JSON.stringify(faq)})'>
            Modifier
          </button>

          <button class="btn-delete" onclick="deleteFaq(${faq.id})">
            Supprimer
          </button>
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("Erreur chargement FAQ :", error);
    faqList.innerHTML = "<p>Erreur lors du chargement des FAQ.</p>";
  }
}

// Ajouter ou modifier une FAQ
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = faqIdInput.value;

  const faqData = {
    question: questionInput.value,
    reponse: reponseInput.value,
    keywords: keywordsInput.value,
    categorie: categorieInput.value,
    actif: actifInput.value === "true",
  };

  try {
    let url = `${API_URL}/faqs`;
    let method = "POST";

    if (id) {
      url = `${API_URL}/faqs/${id}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(faqData),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Erreur lors de l'enregistrement.");
      return;
    }

    resetForm();
    loadFaqs();
  } catch (error) {
    console.error("Erreur sauvegarde FAQ :", error);
    alert("Erreur de connexion au serveur.");
  }
});

// Remplir le formulaire pour modifier une FAQ
function editFaq(faq) {
  faqIdInput.value = faq.id;
  questionInput.value = faq.question;
  reponseInput.value = faq.reponse;
  keywordsInput.value = faq.keywords || "";
  categorieInput.value = faq.categorie || "general";
  actifInput.value = faq.actif ? "true" : "false";

  formTitle.textContent = "Modifier une FAQ";
  submitBtn.textContent = "Modifier";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Supprimer une FAQ
async function deleteFaq(id) {
  const confirmation = confirm("Voulez-vous vraiment supprimer cette FAQ ?");

  if (!confirmation) return;

  try {
    const response = await fetch(`${API_URL}/faqs/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Erreur lors de la suppression.");
      return;
    }

    loadFaqs();
  } catch (error) {
    console.error("Erreur suppression FAQ :", error);
    alert("Erreur de connexion au serveur.");
  }
}

// Réinitialiser le formulaire
function resetForm() {
  faqIdInput.value = "";
  questionInput.value = "";
  reponseInput.value = "";
  keywordsInput.value = "";
  categorieInput.value = "general";
  actifInput.value = "true";

  formTitle.textContent = "Ajouter une FAQ";
  submitBtn.textContent = "Ajouter";
}

// Déconnexion admin
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("admin");

    window.location.href = "/admin/login.html";
  });
}

// Charger les FAQ au démarrage
document.addEventListener("DOMContentLoaded", loadFaqs);