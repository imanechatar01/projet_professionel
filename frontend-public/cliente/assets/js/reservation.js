let selectedTrip = null;

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function parsePrice(priceText) {
  if (!priceText) return 0;

  const cleaned = String(priceText)
    .replace(/\s/g, "")
    .replace(",", ".")
    .match(/\d+(\.\d+)?/);

  return cleaned ? parseFloat(cleaned[0]) : 0;
}

function showMessage(msg, type) {
  const messageDiv = document.getElementById("message");

  if (!messageDiv) return;

  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = msg;
  messageDiv.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function displayUser() {
  const token = window.Auth.getToken();
  const client = window.Auth.getClient();

  if (!token) {
    const msg = document.getElementById("message");

    if (msg) {
      msg.className = "message warning";
      msg.innerHTML = 'Tu dois être connectée pour réserver. <a href="login.html" style="color:#8a5c00;font-weight:700;">Se connecter</a>';
    }

    const form = document.getElementById("reservationForm");

    if (form) {
      form.style.display = "none";
    }

    return false;
  }

  const userInfo = document.getElementById("userInfo");

  if (userInfo) {
    userInfo.classList.add("visible");
  }

  const nom = client.nom || client.prenom || client.email || "Cliente";
  const fullName = client.prenom
    ? `${client.prenom} ${client.nom || ""}`.trim()
    : nom;

  const clientNom = document.getElementById("clientNom");

  if (clientNom) {
    clientNom.textContent = fullName;
  }

  const parts = fullName.split(" ").filter(Boolean);

  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : fullName.substring(0, 2).toUpperCase();

  const userInitials = document.getElementById("userInitials");

  if (userInitials) {
    userInitials.textContent = initials || "?";
  }

  return true;
}

async function resolveSelectedTrip() {
  const saved = sessionStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.SELECTED_TRIP);
  const excursionId = getQueryParam("excursion_id");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      if (!excursionId || String(parsed.id) === String(excursionId)) {
        return parsed;
      }
    } catch (error) {
      console.warn("Erreur selectedTrip:", error.message);
    }
  }

  if (excursionId && window.ApiClient) {
    try {
      const data = await window.ApiClient.getExcursionById(excursionId);
      return data.excursion || data.data || data;
    } catch (error) {
      console.warn("Impossible de charger l'excursion:", error.message);
    }
  }

  return null;
}

function renderSelectedTrip(trip) {
  if (!trip) return;

  selectedTrip = trip;

  const form = document.getElementById("reservationForm");

  if (!form) return;

  let block = document.getElementById("selectedTrip");

  if (!block) {
    block = document.createElement("div");
    block.id = "selectedTrip";
    block.className = "selected-trip visible";
    form.parentNode.insertBefore(block, form);
  }

  const title = trip.title || trip.titre || trip.nom || "Excursion";
  const location = trip.location || trip.lieu || "Maroc";
  const date = trip.date || trip.date_depart || "Date à confirmer";
  const price = trip.price || trip.prix || trip.tarif || "";
  const image = trip.img || trip.image || trip.image_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80";

  block.innerHTML = `
    <img src="${image}" alt="${title}">
    <div>
      <div class="selected-trip-title">${title}</div>
      <div class="selected-trip-meta">Lieu : ${location} · Date : ${date}</div>
      <div class="selected-trip-price">${price}</div>
    </div>
  `;

  const unitPrice = parsePrice(price);

  if (unitPrice > 0) {
    const montantInput = document.getElementById("montant_total");
    const nbInput = document.getElementById("nb_personnes");

    function updateTotal() {
      const nb = Math.max(1, parseInt(nbInput.value || "1"));
      const total = unitPrice * nb;

      montantInput.value = total;
      updatePriceDisplay(total);
    }

    nbInput.addEventListener("input", updateTotal);
    updateTotal();
  }
}

function updatePriceDisplay(value) {
  const recap = document.getElementById("price-recap");
  const priceDisplay = document.getElementById("price-display");

  if (!recap || !priceDisplay) return;

  const number = parseFloat(value);

  if (!isNaN(number) && number > 0) {
    priceDisplay.textContent = number.toLocaleString("fr-MA") + " MAD";
    recap.style.display = "flex";
  } else {
    recap.style.display = "none";
  }
}

function setupLivePrice() {
  const montant = document.getElementById("montant_total");

  if (!montant) return;

  montant.addEventListener("input", function () {
    updatePriceDisplay(this.value);
  });
}

function setupReservationForm() {
  const form = document.getElementById("reservationForm");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!window.Auth.isAuthenticated()) {
      showMessage('Session expirée. <a href="login.html" style="font-weight:700;">Se connecter</a>', "warning");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi en cours...";

    const excursionId = getQueryParam("excursion_id") || selectedTrip?.id || selectedTrip?._id || null;

    const reservationData = {
      excursion_id: excursionId,
      excursion_title: selectedTrip?.title || selectedTrip?.titre || selectedTrip?.nom || null,
      nb_personnes: parseInt(document.getElementById("nb_personnes").value),
      montant_total: parseFloat(document.getElementById("montant_total").value),
      demande_speciale: document.getElementById("demande_speciale").value.trim()
    };

    if (reservationData.nb_personnes < 1) {
      showMessage("Le nombre de personnes doit être au moins 1", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmer la réservation";
      return;
    }

    if (isNaN(reservationData.montant_total) || reservationData.montant_total <= 0) {
      showMessage("Veuillez entrer un montant valide", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmer la réservation";
      return;
    }

    try {
      const result = await window.ApiClient.createReservation(reservationData);

      if (result.success) {
        showMessage("Réservation confirmée. On te contacte très vite.", "success");

        sessionStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.SELECTED_TRIP);

        setTimeout(function () {
          window.location.href = window.APP_CONFIG.ROUTES.CATALOGUE;
        }, 1800);
      } else {
        showMessage(result.message || "Erreur lors de la réservation", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);

      if (error.status === 401 || error.status === 403) {
        window.Auth.clearSession();
        showMessage('Session expirée. <a href="login.html" style="font-weight:700;">Reconnecte-toi</a>', "warning");
      } else {
        showMessage(error.message || "Erreur de connexion au serveur", "error");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmer la réservation";
    }
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  const connected = displayUser();

  if (!connected) return;

  setupLivePrice();

  const trip = await resolveSelectedTrip();

  renderSelectedTrip(trip);

  setupReservationForm();
});