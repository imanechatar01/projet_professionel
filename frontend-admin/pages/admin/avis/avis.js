const API_BASE_URL = "http://localhost:5000/api";

const token =
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token");

const avisList = document.getElementById("avisList");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

let allAvis = [];

if (!token) {
  window.location.href = "../login.html";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : null,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Erreur serveur");
  }

  return data;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value || "";
  return div.innerHTML;
}

function badgeClass(statut) {
  if (statut === "publie") return "bg-green-100 text-green-700";
  if (statut === "rejete") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function statusLabel(statut) {
  if (statut === "publie") return "Publié";
  if (statut === "rejete") return "Rejeté";
  return "En attente";
}

function updateStats(avis) {
  document.getElementById("pendingCount").textContent =
    avis.filter((item) => item.statut === "en_attente").length;

  document.getElementById("publishedCount").textContent =
    avis.filter((item) => item.statut === "publie").length;

  document.getElementById("rejectedCount").textContent =
    avis.filter((item) => item.statut === "rejete").length;
}

function renderAvis() {
  const selectedStatus = statusFilter.value;

  const avis = selectedStatus
    ? allAvis.filter((item) => item.statut === selectedStatus)
    : allAvis;

  updateStats(allAvis);

  if (!avis.length) {
    avisList.innerHTML = `
      <div class="text-gray-500 text-center py-12">
        <div class="w-16 h-16 rounded-2xl bg-gray-50 mx-auto mb-4 flex items-center justify-center text-gray-400 text-2xl">
          <i class="fas fa-star"></i>
        </div>
        Aucun avis trouvé.
      </div>
    `;
    return;
  }

  avisList.innerHTML = avis.map((item) => {
    const clientName = `${item.client_prenom || ""} ${item.client_nom || ""}`.trim();
    const date = item.created_at
      ? new Date(item.created_at).toLocaleDateString("fr-FR")
      : "Date inconnue";

    const note = Number(item.note || 0);

    return `
      <article class="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all bg-white">
        <div class="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <div class="font-bold text-gray-900 text-lg">
              ${escapeHtml(clientName || item.client_email || "Cliente")}
            </div>

            <div class="text-sm text-gray-500 mt-1">
              <i class="fas fa-map-location-dot text-rose-pink mr-1"></i>
              ${escapeHtml(item.excursion_titre || "Excursion")}
              <span class="mx-2">·</span>
              ${date}
            </div>
          </div>

          <span class="h-fit px-3 py-1 rounded-full text-xs font-bold ${badgeClass(item.statut)}">
            ${statusLabel(item.statut)}
          </span>
        </div>

        <div class="text-yellow-400 mt-4 text-lg">
          ${"★".repeat(note)}${"☆".repeat(5 - note)}
        </div>

        <p class="text-gray-700 mt-3 leading-relaxed">
          ${escapeHtml(item.commentaire)}
        </p>

        <div class="flex flex-wrap gap-2 mt-5">
          <button onclick="updateStatus(${item.id}, 'publie')" class="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all">
            <i class="fas fa-check mr-1"></i>
            Publier
          </button>

          <button onclick="updateStatus(${item.id}, 'rejete')" class="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all">
            <i class="fas fa-xmark mr-1"></i>
            Rejeter
          </button>

          <button onclick="deleteAvis(${item.id})" class="px-4 py-2 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-900 transition-all">
            <i class="fas fa-trash mr-1"></i>
            Supprimer
          </button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadAvis() {
  try {
    avisList.innerHTML = `
      <div class="text-gray-500 text-center py-8">
        <i class="fas fa-spinner fa-spin text-rose-pink mr-2"></i>
        Chargement des avis...
      </div>
    `;

    const data = await request("/avis/admin");

    allAvis = data.avis || [];

    renderAvis();
  } catch (error) {
    avisList.innerHTML = `
      <div class="text-red-600 bg-red-50 border border-red-100 rounded-2xl p-5">
        <strong>Erreur :</strong> ${escapeHtml(error.message)}
      </div>
    `;
  }
}

async function updateStatus(id, statut) {
  try {
    await request(`/avis/admin/${id}/status`, {
      method: "PATCH",
      body: { statut },
    });

    await loadAvis();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteAvis(id) {
  if (!confirm("Supprimer cet avis définitivement ?")) return;

  try {
    await request(`/avis/admin/${id}`, {
      method: "DELETE",
    });

    await loadAvis();
  } catch (error) {
    alert(error.message);
  }
}

statusFilter.addEventListener("change", renderAvis);
refreshBtn.addEventListener("click", loadAvis);

document.getElementById("logoutBtn").addEventListener("click", function (e) {
  e.preventDefault();

  localStorage.removeItem("adminToken");
  localStorage.removeItem("token");
  localStorage.removeItem("admin");

  window.location.href = "../login.html";
});

loadAvis();