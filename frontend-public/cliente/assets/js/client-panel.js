(function () {
  let clientReservations = [];
  let bookingTrip = null;
  let eligibleReviewReservations = [];
  let myAvis = [];

  function getConfig() {
    return window.APP_CONFIG;
  }

  function getClient() {
    if (!window.Auth) return {};
    return window.Auth.getClient();
  }

  function isAuthenticated() {
    return window.Auth && window.Auth.isAuthenticated();
  }

  function notify(message) {
    if (window.showToast) {
      window.showToast(message);
    } else {
      alert(message);
    }
  }

  function getFullName(client) {
    const fullName = `${client.prenom || ""} ${client.nom || ""}`.trim();
    return fullName || client.nom || client.email || "Cliente";
  }

  function getInitials(name) {
    if (!name) return "?";

    const parts = name.split(" ").filter(Boolean);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parsePrice(priceText) {
    if (!priceText) return 0;

    const cleaned = String(priceText)
      .replace(/\s/g, "")
      .replace(",", ".")
      .match(/\d+(\.\d+)?/);

    return cleaned ? parseFloat(cleaned[0]) : 0;
  }

  function getTripId(trip) {
    return trip?.id || trip?._id || trip?.excursion_id || null;
  }

  function getTripPrice(trip) {
    return parsePrice(trip?.rawPrice || trip?.prix || trip?.price || trip?.tarif || "");
  }

  function createClientPanel() {
    if (document.getElementById("client-panel")) return;

    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <div class="client-overlay" id="client-overlay" onclick="closeClientPanel()"></div>

      <aside class="client-panel" id="client-panel">
        <div class="client-panel-header">
          <div class="client-panel-title">Mon espace</div>
          <button type="button" class="client-panel-close" onclick="closeClientPanel()">×</button>
        </div>

        <div class="client-profile-card">
          <div class="client-big-avatar" id="clientPanelInitials">?</div>
          <h3 id="clientPanelName">Cliente</h3>
          <p id="clientPanelEmail">—</p>
        </div>

        <div class="client-tabs">
          <button type="button" class="client-tab-btn active" data-client-tab="reservations">
            Mes réservations
          </button>

          <button
            type="button"
            class="client-tab-btn"
            id="bookingTabBtn"
            data-client-tab="booking"
            style="display:none;"
          >
            Nouvelle réservation
          </button>

          <button type="button" class="client-tab-btn" data-client-tab="profile">
            Mon profil
          </button>

          <button
            type="button"
            class="client-tab-btn"
            id="reviewsTabBtn"
            data-client-tab="reviews"
            style="display:none;"
          >
            Mes avis
          </button>


        </div>

        <section class="client-panel-section active" id="client-tab-reservations">
          <div id="clientReservationsList">
            <div class="client-empty">Chargement de tes réservations...</div>
          </div>
        </section>

        <section class="client-panel-section" id="client-tab-booking">
          <div class="client-mini-card">
            <div class="client-card-title">Réserver ce voyage</div>

            <div id="bookingTripBox" style="margin-top:1rem;"></div>

            <form id="clientBookingForm" style="margin-top:1.25rem;">
              <div class="form-group">
                <label>Nombre de personnes</label>
                <input type="number" id="bookingNbPersonnes" min="1" value="1" required>
              </div>

              <div class="form-group">
                <label>Montant total (MAD)</label>
                <input type="number" id="bookingMontantTotal" step="0.01" placeholder="Ex : 1150" required>
              </div>

              <div class="form-group">
                <label>Demande spéciale</label>
                <textarea
                  id="bookingDemandeSpeciale"
                  rows="4"
                  placeholder="Allergies, besoin spécial, point de départ préféré..."
                ></textarea>
              </div>

              <button type="submit" class="btn btn-pink btn-full" id="bookingSubmitBtn">
                Confirmer la réservation
              </button>
            </form>
          </div>
        </section>

        <section class="client-panel-section" id="client-tab-profile">
          <div class="client-mini-card">
            <form id="clientProfileForm" class="client-profile-form">
              <div class="form-group">
                <label>Nom</label>
                <input type="text" id="clientProfileNom">
              </div>

              <div class="form-group">
                <label>Prénom</label>
                <input type="text" id="clientProfilePrenom">
              </div>

              <div class="form-group">
                <label>Email</label>
                <input type="email" id="clientProfileEmail">
              </div>

              <div class="form-group">
                <label>Téléphone</label>
                <input type="tel" id="clientProfileTelephone">
              </div>

              <button type="submit" class="btn btn-pink btn-full">
                Enregistrer
              </button>
            </form>
          </div>
        </section>

        <section class="client-panel-section" id="client-tab-reviews">
          <div id="clientReviewsList"></div>

          <div class="client-mini-card">
            <div class="client-card-title">Ajouter un avis</div>

            <form id="clientReviewForm">
              <div class="form-group">
                <label>Voyage concerné</label>
                <select id="clientReviewReservation" required>
                  <option value="">Chargement des voyages disponibles...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Note</label>
                <select id="clientReviewRating">
                  <option value="5">★★★★★ Excellent</option>
                  <option value="4">★★★★ Très bien</option>
                  <option value="3">★★★ Bien</option>
                  <option value="2">★★ Moyen</option>
                  <option value="1">★ À améliorer</option>
                </select>
              </div>

              <div class="form-group">
                <label>Commentaire</label>
                <textarea
                  id="clientReviewComment"
                  rows="4"
                  placeholder="Partage ton expérience..."
                ></textarea>
              </div>

              <button type="submit" class="btn btn-pink btn-full" id="clientReviewSubmitBtn">
                Envoyer l’avis
              </button>
            </form>
          </div>
        </section>

        <section class="client-panel-section" id="client-tab-documents">
          <div class="client-mini-card client-document-row">
            <div>
              <div class="client-card-title">Confirmation de réservation</div>
              <p>Disponible après confirmation.</p>
            </div>
            <button type="button" class="btn btn-outline-dark">Bientôt</button>
          </div>

          <div class="client-mini-card client-document-row">
            <div>
              <div class="client-card-title">Guide pratique</div>
              <p>Programme, horaires et conseils.</p>
            </div>
            <button type="button" class="btn btn-outline-dark">Bientôt</button>
          </div>
        </section>

        <button type="button" class="client-logout-btn" id="clientLogoutBtn">
          Déconnexion
        </button>
      </aside>
    `;

    document.body.appendChild(wrapper);

    setupClientTabs();
    setupProfileForm();
    setupReviewForm();
    setupBookingForm();
    setupLogout();
  }

  function updateNavbarAuth() {
    const containers = document.querySelectorAll(".nav-links, .topbar-links");

    if (!containers.length) return;

    containers.forEach(function (container) {
      const oldTrigger = container.querySelector(".client-profile-trigger");

      if (oldTrigger) oldTrigger.remove();

      const loginLinks = container.querySelectorAll(
        'a[href$="login.html"], .nav-cta'
      );

      if (!isAuthenticated()) {
        loginLinks.forEach(function (link) {
          link.style.display = "";
        });
        return;
      }

      const client = getClient();
      const fullName = getFullName(client);
      const initials = getInitials(fullName);

      loginLinks.forEach(function (link) {
        link.style.display = "none";
      });

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "client-profile-trigger";
      trigger.onclick = openClientPanel;

      trigger.innerHTML = `
        <span class="client-profile-avatar">${initials}</span>
        <span class="client-profile-name">
          ${client.prenom || client.nom || "Mon espace"}
        </span>
      `;

      container.appendChild(trigger);
    });
  }

  function updateMobileAuth() {
    const mobileMenu = document.getElementById("mobile-menu");

    if (!mobileMenu || !isAuthenticated()) return;

    const oldClientLink = mobileMenu.querySelector(".mobile-client-panel-link");

    if (oldClientLink) oldClientLink.remove();

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mob-cta mobile-client-panel-link";
    btn.textContent = "Mon espace client";
    btn.onclick = function () {
      if (window.closeMobileMenu) window.closeMobileMenu();
      openClientPanel();
    };

    mobileMenu.appendChild(btn);
  }

  async function openClientPanel() {
    if (!isAuthenticated()) {
      window.location.href = getConfig().ROUTES.LOGIN;
      return;
    }

    createClientPanel();
    renderClientData();

    await loadClientReservations();
    await loadReviewData();

    document.getElementById("client-overlay").classList.add("open");
    document.getElementById("client-panel").classList.add("open");

    activateClientTab("reservations");
  }

  async function openReservationPanel(trip) {
    if (!isAuthenticated()) {
      sessionStorage.setItem("pendingReservationTrip", JSON.stringify(trip));
      window.location.href = getConfig().ROUTES.LOGIN;
      return;
    }

    createClientPanel();
    renderClientData();

    await loadClientReservations();
    await loadReviewData();

    bookingTrip = trip;

    const bookingTabBtn = document.getElementById("bookingTabBtn");

    if (bookingTabBtn) {
      bookingTabBtn.style.display = "block";
    }

    fillBookingForm(trip);

    document.getElementById("client-overlay").classList.add("open");
    document.getElementById("client-panel").classList.add("open");

    activateClientTab("booking");
  }

  function closeClientPanel() {
    const overlay = document.getElementById("client-overlay");
    const panel = document.getElementById("client-panel");

    if (overlay) overlay.classList.remove("open");
    if (panel) panel.classList.remove("open");
  }

  function setupClientTabs() {
    document.querySelectorAll(".client-tab-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const target = this.dataset.clientTab;

        if (target === "reviews" && !canClientReview()) {
          notify("Tu pourras laisser un avis après avoir participé à un voyage.");
          return;
        }

        activateClientTab(target);
      });
    });
  }

  function activateClientTab(target) {
    document.querySelectorAll(".client-tab-btn").forEach((item) => {
      item.classList.remove("active");
    });

    document.querySelectorAll(".client-panel-section").forEach((section) => {
      section.classList.remove("active");
    });

    const activeBtn = document.querySelector(
      `.client-tab-btn[data-client-tab="${target}"]`
    );

    const activeSection = document.getElementById(`client-tab-${target}`);

    if (activeBtn) activeBtn.classList.add("active");
    if (activeSection) activeSection.classList.add("active");
  }

  function renderClientData() {
    const client = getClient();
    const fullName = getFullName(client);
    const initials = getInitials(fullName);

    setText("clientPanelInitials", initials);
    setText("clientPanelName", fullName);
    setText("clientPanelEmail", client.email || "—");

    setValue("clientProfileNom", client.nom || "");
    setValue("clientProfilePrenom", client.prenom || "");
    setValue("clientProfileEmail", client.email || "");
    setValue("clientProfileTelephone", client.telephone || "");
  }

  async function loadClientReservations() {
    const list = document.getElementById("clientReservationsList");

    if (!list) return;

    list.innerHTML = `
      <div class="client-empty">
        Chargement de tes réservations...
      </div>
    `;

    try {
      const data = await window.ApiClient.request(
        getConfig().ENDPOINTS.RESERVATIONS,
        {
          method: "GET",
          auth: true
        }
      );

      clientReservations = extractReservations(data);
    } catch (error) {
      console.warn("Réservations indisponibles :", error.message);
      clientReservations = [];
    }

    renderReservations();
  }

  function extractReservations(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.reservations)) return data.reservations;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;

    return [];
  }

  function extractAvisArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.avis)) return data.avis;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;

    return [];
  }

  function extractEligibleReservations(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.reservations)) return data.reservations;
    if (Array.isArray(data.eligibleReservations)) return data.eligibleReservations;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;

    return [];
  }

  function isReservationEligibleForReview(reservation) {
    const status = String(
      reservation.status || reservation.statut || reservation.etat || ""
    ).toLowerCase();

    return (
      status.includes("confirm") ||
      status.includes("valid") ||
      status.includes("pay") ||
      status.includes("termin")
    );
  }

  function getReservationIdForReview(reservation) {
    return reservation.id || reservation.reservation_id || reservation.id_reservation || null;
  }

  function getExcursionIdForReview(reservation) {
    return reservation.excursion_id || reservation.id_excursion || reservation.excursion?.id || null;
  }

  function getReservationTitleForReview(reservation) {
    return (
      reservation.excursion_titre ||
      reservation.excursion_title ||
      reservation.titre ||
      reservation.nom_excursion ||
      reservation.excursion?.titre ||
      reservation.excursion?.title ||
      "Voyage Ecotrips Women"
    );
  }

  function getAvisStatusLabel(statut) {
    const value = String(statut || "").toLowerCase();

    if (value.includes("publie")) return "Publié";
    if (value.includes("rejete")) return "Rejeté";
    return "En attente";
  }

  async function loadReviewData() {
    try {
      const [eligibleData, myAvisData] = await Promise.all([
        window.ApiClient.getEligibleReviewReservations(),
        window.ApiClient.getMyAvis()
      ]);

      eligibleReviewReservations = extractEligibleReservations(eligibleData);
      myAvis = extractAvisArray(myAvisData);
    } catch (error) {
      console.warn("Avis indisponibles :", error.message);

      eligibleReviewReservations = [];
      myAvis = [];
    }

    if (!eligibleReviewReservations.length && clientReservations.length) {
      eligibleReviewReservations = clientReservations.filter(isReservationEligibleForReview);
    }

    renderReviewReservationOptions();
    renderReviews();
    updateReviewsTabVisibility();
  }

  function renderReviewReservationOptions() {
    const select = document.getElementById("clientReviewReservation");

    if (!select) return;

    const reviewedReservationIds = new Set(
      myAvis
        .map((avis) => String(avis.reservation_id || ""))
        .filter(Boolean)
    );

    const availableReservations = eligibleReviewReservations.filter((reservation) => {
      const reservationId = getReservationIdForReview(reservation);

      if (!reservationId) return false;

      return !reviewedReservationIds.has(String(reservationId));
    });

    if (!availableReservations.length) {
      select.innerHTML = `
        <option value="">
          Aucun voyage disponible pour un nouvel avis
        </option>
      `;

      select.disabled = true;
      return;
    }

    select.disabled = false;

    select.innerHTML = `
      <option value="">Choisir un voyage</option>
      ${availableReservations.map((reservation) => {
        const reservationId = getReservationIdForReview(reservation);
        const title = getReservationTitleForReview(reservation);

        return `
          <option value="${reservationId}">
            ${escapeHtml(title)}
          </option>
        `;
      }).join("")}
    `;
  }

  function updateReviewsTabVisibility() {
    const reviewsTabBtn = document.getElementById("reviewsTabBtn");

    if (!reviewsTabBtn) return;

    const allowed = canClientReview();

    reviewsTabBtn.style.display = allowed ? "block" : "none";

    const reviewsSection = document.getElementById("client-tab-reviews");

    if (!allowed && reviewsSection && reviewsSection.classList.contains("active")) {
      activateClientTab("reservations");
    }
  }

  function renderReservations() {
    const list = document.getElementById("clientReservationsList");

    if (!list) return;

    if (!clientReservations.length) {
      list.innerHTML = `
        <div class="client-empty">
          Tu n’as pas encore de réservation.
          <br><br>
          <a href="catalogue.html" class="btn btn-pink">
            Découvrir les voyages
          </a>
        </div>
      `;

      updateReviewsTabVisibility();
      return;
    }

    list.innerHTML = clientReservations.map((res) => {
      const title =
        res.excursion_title ||
        res.titre ||
        res.nom_excursion ||
        res.excursion?.titre ||
        res.excursion?.title ||
        "Voyage Ecotrips Women";

      const date =
        res.date_reservation ||
        res.created_at ||
        res.date ||
        "Date non précisée";

      const people = res.nb_personnes || res.personnes || 1;
      const amount = res.montant_total || res.total || res.montant || 0;
      const status = normalizeStatus(res.status || res.statut || res.etat);

      const image =
        res.image_url ||
        res.excursion?.image_url ||
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80";

      return `
        <div class="client-mini-card client-reservation-card">
          <img class="client-trip-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(title)}">

          <div>
            <div class="client-card-title">${escapeHtml(title)}</div>

            <div class="client-card-meta">
              📅 ${formatDate(date)}<br>
              👥 ${people} personne(s)<br>
              💳 ${formatMoney(amount)}
            </div>

            <span class="client-status ${status.className}">
              ${status.label}
            </span>
          </div>
        </div>
      `;
    }).join("");

    updateReviewsTabVisibility();
  }

  function normalizeStatus(status) {
    const value = String(status || "").toLowerCase();

    if (
      value.includes("confirm") ||
      value.includes("valid") ||
      value.includes("pay") ||
      value.includes("termin")
    ) {
      return {
        label: "Confirmée",
        className: "confirmed"
      };
    }

    if (
      value.includes("annul") ||
      value.includes("cancel") ||
      value.includes("refus")
    ) {
      return {
        label: "Annulée",
        className: "cancelled"
      };
    }

    return {
      label: "En attente",
      className: "pending"
    };
  }

  function canClientReview() {
    if (eligibleReviewReservations.length > 0) return true;
    if (myAvis.length > 0) return true;

    return clientReservations.some(isReservationEligibleForReview);
  }

  function fillBookingForm(trip) {
    const box = document.getElementById("bookingTripBox");

    if (!box || !trip) return;

    const title = trip.title || trip.titre || "Voyage Ecotrips Women";
    const location = trip.location || trip.lieu || "Maroc";
    const date = trip.date || trip.date_depart || "Date à confirmer";
    const image =
      trip.img ||
      trip.image ||
      trip.image_url ||
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80";

    box.innerHTML = `
      <div class="client-reservation-card">
        <img class="client-trip-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(title)}">

        <div>
          <div class="client-card-title">${escapeHtml(title)}</div>
          <div class="client-card-meta">
            📍 ${escapeHtml(location)}<br>
            📅 ${escapeHtml(date)}
          </div>
        </div>
      </div>
    `;

    const unitPrice = getTripPrice(trip);
    const nbInput = document.getElementById("bookingNbPersonnes");
    const amountInput = document.getElementById("bookingMontantTotal");
    const specialInput = document.getElementById("bookingDemandeSpeciale");

    if (specialInput) specialInput.value = "";

    function updateTotal() {
      const nb = Math.max(1, parseInt(nbInput.value || "1"));

      if (unitPrice > 0) {
        amountInput.value = unitPrice * nb;
      }
    }

    if (nbInput && amountInput) {
      nbInput.value = 1;

      if (unitPrice > 0) {
        amountInput.value = unitPrice;
      } else {
        amountInput.value = "";
      }

      nbInput.oninput = updateTotal;
    }
  }

  function setupBookingForm() {
    const form = document.getElementById("clientBookingForm");

    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!bookingTrip) {
        notify("Aucun voyage sélectionné.");
        return;
      }

      const submitBtn = document.getElementById("bookingSubmitBtn");

      const excursionId = getTripId(bookingTrip);
      const nbPersonnes = parseInt(getValue("bookingNbPersonnes") || "1");
      const montantTotal = parseFloat(getValue("bookingMontantTotal") || "0");
      const demandeSpeciale = getValue("bookingDemandeSpeciale");

      if (!excursionId) {
        notify("ID du voyage introuvable.");
        return;
      }

      if (nbPersonnes < 1) {
        notify("Le nombre de personnes doit être au moins 1.");
        return;
      }

      if (isNaN(montantTotal) || montantTotal <= 0) {
        notify("Le montant total est invalide.");
        return;
      }

      const payload = {
        excursion_id: excursionId,
        excursion_title:
          bookingTrip.title ||
          bookingTrip.titre ||
          bookingTrip.nom ||
          "Voyage Ecotrips Women",
        nb_personnes: nbPersonnes,
        montant_total: montantTotal,
        demande_speciale: demandeSpeciale
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Création en cours...";
      }

      try {
        const result = await window.ApiClient.createReservation(payload);

        if (!result.success) {
          throw new Error(result.message || "Erreur lors de la réservation");
        }

        const reservationId = extractReservationId(result);

        if (!reservationId) {
          throw new Error("Réservation créée, mais ID de paiement introuvable.");
        }

        sessionStorage.removeItem("pendingReservationTrip");
        sessionStorage.removeItem(getConfig().STORAGE_KEYS.SELECTED_TRIP);

        notify("Réservation créée. Redirection vers le paiement...");

        setTimeout(function () {
          window.location.href = `paiement.html?id=${reservationId}`;
        }, 900);
      } catch (error) {
        console.error("Erreur réservation depuis client panel :", error);
        notify(error.message || "Erreur lors de la réservation.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Confirmer la réservation";
        }
      }
    });
  }

  function extractReservationId(result) {
    return (
      result?.reservation?.id ||
      result?.data?.reservation?.id ||
      result?.data?.id ||
      result?.reservation_id ||
      result?.id ||
      null
    );
  }

  function setupProfileForm() {
    const form = document.getElementById("clientProfileForm");

    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const client = getClient();

      const updatedClient = {
        ...client,
        nom: getValue("clientProfileNom"),
        prenom: getValue("clientProfilePrenom"),
        email: getValue("clientProfileEmail"),
        telephone: getValue("clientProfileTelephone")
      };

      localStorage.setItem(
        getConfig().STORAGE_KEYS.CLIENT_DATA,
        JSON.stringify(updatedClient)
      );

      updateNavbarAuth();
      renderClientData();

      notify("Profil mis à jour localement.");
    });
  }

  function setupReviewForm() {
    const form = document.getElementById("clientReviewForm");

    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const reservationId = getValue("clientReviewReservation");
      const rating = parseInt(getValue("clientReviewRating"));
      const comment = getValue("clientReviewComment");
      const submitBtn = document.getElementById("clientReviewSubmitBtn");

      if (!canClientReview()) {
        notify("Tu pourras laisser un avis après avoir participé à un voyage.");
        return;
      }

      if (!reservationId) {
        notify("Choisis le voyage concerné par ton avis.");
        return;
      }

      if (!comment || comment.length < 5) {
        notify("Écris un avis un peu plus détaillé.");
        return;
      }

      const reservation = eligibleReviewReservations.find((item) => {
        return String(getReservationIdForReview(item)) === String(reservationId);
      });

      if (!reservation) {
        notify("Réservation introuvable pour cet avis.");
        return;
      }

      const payload = {
        reservation_id: getReservationIdForReview(reservation),
        excursion_id: getExcursionIdForReview(reservation),
        note: rating,
        commentaire: comment
      };

      if (!payload.excursion_id) {
        notify("ID du voyage introuvable pour cet avis.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";
      }

      try {
        console.log("Payload avis envoyé :", payload);

        const result = await window.ApiClient.createAvis(payload);

        console.log("Résultat création avis :", result);

        if (result && result.success === false) {
          throw new Error(result.message || "Erreur lors de l’envoi de l’avis.");
        }

        form.reset();

        notify("Merci pour ton avis 🌸 Il sera visible après validation par l’admin.");

        await loadReviewData();
      } catch (error) {
        console.error("Erreur création avis :", error);
        notify(error.message || "Impossible d’envoyer ton avis.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Envoyer l’avis";
        }
      }
    });
  }

  function renderReviews() {
    const list = document.getElementById("clientReviewsList");

    if (!list) return;

    if (!myAvis.length) {
      list.innerHTML = `
        <div class="client-empty">
          Tu n’as pas encore ajouté d’avis.
        </div>
      `;
      return;
    }

    list.innerHTML = myAvis.map((avis) => {
      const note = Number(avis.note || avis.rating || 0);
      const title =
        avis.excursion_titre ||
        avis.excursion_title ||
        avis.titre ||
        "Voyage Ecotrips Women";

      const commentaire = avis.commentaire || avis.comment || "";
      const statut = getAvisStatusLabel(avis.statut);
      const date = avis.created_at || avis.date;

      return `
        <div class="client-mini-card">
          <div class="client-card-title">
            ${escapeHtml(title)}
          </div>

          <div class="client-review-stars">
            ${"★".repeat(note)}${"☆".repeat(Math.max(0, 5 - note))}
          </div>

          <div class="client-card-meta">
            "${escapeHtml(commentaire)}"
          </div>

          <div class="client-card-meta" style="margin-top:0.5rem;">
            Statut : <strong>${escapeHtml(statut)}</strong>
            ${date ? ` · ${formatDate(date)}` : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  function setupLogout() {
    const logoutBtn = document.getElementById("clientLogoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", function () {
      window.Auth.clearSession();
      sessionStorage.removeItem("pendingReservationTrip");
      window.location.href = getConfig().ROUTES.LOGIN;
    });
  }

  function formatMoney(value) {
    const number = parseFloat(value);

    if (isNaN(number)) return "0 MAD";

    return number.toLocaleString("fr-MA") + " MAD";
  }

  function formatDate(value) {
    if (!value) return "Date non précisée";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleDateString("fr-FR");
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function tryOpenPendingReservation() {
    if (!isAuthenticated()) return;

    const rawTrip = sessionStorage.getItem("pendingReservationTrip");

    if (!rawTrip) return;

    try {
      const trip = JSON.parse(rawTrip);

      if (trip && getTripId(trip)) {
        openReservationPanel(trip);
      }
    } catch (error) {
      sessionStorage.removeItem("pendingReservationTrip");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    createClientPanel();
    updateNavbarAuth();
    updateMobileAuth();

    setTimeout(tryOpenPendingReservation, 300);
  });

  window.openClientPanel = openClientPanel;
  window.closeClientPanel = closeClientPanel;
  window.openReservationPanel = openReservationPanel;
})();