let trips = [];
let currentTrip = null;

const FALLBACK_TRIPS = [
  {
    id: 1,
    title: "Cathédrale Imsfrane + Rafting",
    location: "Tanger · Tétouan · Sala El Jadida",
    date: "12–13 Juin 2026",
    duration: "2 jours",
    price: "1 150 dhs",
    img: "https://images.unsplash.com/photo-1553522911-7a8568c65ae7?w=1200&q=80",
    tags: ["Rafting", "Nature"],
    region: "Centre Maroc",
    type: "Aventure",
    desc: "Un week-end inoubliable combinant nature et rafting dans une ambiance 100% féminine.",
    includesIcons: ["Transport", "Encadrement", "Rafting", "Organisation"],
    includes: ["Transport aller-retour", "Encadrement", "Équipement rafting", "Organisation complète"],
    itinerary: [
      {
        day: "J1",
        title: "Départ et découverte",
        body: "Départ, visite de la région et installation."
      },
      {
        day: "J2",
        title: "Rafting et retour",
        body: "Session rafting encadrée puis retour."
      }
    ],
    reviews: []
  },
  {
    id: 2,
    title: "Marrakech — Imlil — Agafay",
    location: "Tétouan · Tanger · Rabat",
    date: "8–10 Mai 2026",
    duration: "3 jours",
    price: "1 200 dhs",
    img: "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1200&q=80",
    tags: ["Montagne", "Désert"],
    region: "Sud Maroc",
    type: "Aventure",
    desc: "Un circuit entre Marrakech, les montagnes de l’Atlas et le désert d’Agafay.",
    includesIcons: ["Transport", "Hébergement", "Guide", "Organisation"],
    includes: ["Transport aller-retour", "Hébergement", "Programme guidé", "Organisation complète"],
    itinerary: [
      {
        day: "J1",
        title: "Marrakech",
        body: "Visite de Marrakech et installation."
      },
      {
        day: "J2",
        title: "Imlil",
        body: "Découverte de l’Atlas et randonnée."
      },
      {
        day: "J3",
        title: "Agafay",
        body: "Découverte du désert d’Agafay puis retour."
      }
    ],
    reviews: []
  },
  {
    id: 3,
    title: "Akchour et Chefchaouen",
    location: "Tanger · Tétouan",
    date: "16 Mai 2026",
    duration: "1 jour",
    price: "190 dhs",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    tags: ["Randonnée", "Cascade"],
    region: "Nord Maroc",
    type: "Nature",
    desc: "Une journée entre les cascades d’Akchour et les ruelles bleues de Chefchaouen.",
    includesIcons: ["Transport", "Randonnée", "Cascades", "Chefchaouen"],
    includes: ["Transport aller-retour", "Encadrement", "Organisation"],
    itinerary: [
      {
        day: "Matin",
        title: "Akchour",
        body: "Randonnée et découverte des cascades."
      },
      {
        day: "Après-midi",
        title: "Chefchaouen",
        body: "Visite libre de Chefchaouen puis retour."
      }
    ],
    reviews: []
  }
];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatApiDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateRange(start, end) {
  const startText = formatApiDate(start);
  const endText = formatApiDate(end);

  if (startText && endText && startText !== endText) {
    return `${startText} → ${endText}`;
  }

  return startText || endText || "Date à confirmer";
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") {
    return "Prix à confirmer";
  }

  const number = parseFloat(value);

  if (isNaN(number)) return String(value);

  return number.toLocaleString("fr-MA") + " dhs";
}

function normalizeTrip(raw) {
  const programmeText = raw.programme || raw.program || "";

  return {
    id: raw.id || raw._id,
    title: raw.title || raw.titre || raw.nom || "Excursion",
    location: raw.location || raw.lieu || raw.depart || raw.destination || "Maroc",
    date: raw.date || raw.date_depart || formatDateRange(raw.date_debut, raw.date_fin),
    duration: raw.duration || raw.duree || "Durée à confirmer",
    price: raw.price || formatPrice(raw.prix || raw.tarif),
    rawPrice: raw.prix || raw.tarif || raw.price || "",
    img:
      raw.img ||
      raw.image ||
      raw.image_url ||
      raw.photo ||
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
    tags: Array.isArray(raw.tags) ? raw.tags : raw.type ? [raw.type] : ["Voyage"],
    region: raw.region || raw.destination || "Nord Maroc",
    type: raw.type || "Aventure",
    desc: raw.desc || raw.description || "Une expérience féminine unique organisée par ecotrips_women.",
    includesIcons: raw.includesIcons || raw.includes_icons || [
      "Transport",
      "Encadrement",
      "Ambiance féminine",
      "Organisation"
    ],
    includes: raw.includes || raw.inclus || [
      "Transport",
      "Encadrement",
      "Organisation"
    ],
    itinerary: Array.isArray(raw.itinerary)
      ? raw.itinerary
      : programmeText
        ? [
            {
              day: "Programme",
              title: "Programme du voyage",
              body: programmeText
            }
          ]
        : [],
    reviews: raw.reviews || raw.avis || []
  };
}

function extractArrayFromApiResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.excursions)) return data.excursions;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;

  return [];
}

async function loadTrips() {
  const container = document.getElementById("trips-container");

  if (container) {
    container.innerHTML = '<div class="loading-state">Chargement des voyages...</div>';
  }

  try {
    const data = await window.ApiClient.getExcursions();
    const apiTrips = extractArrayFromApiResponse(data);

    if (apiTrips.length > 0) {
      trips = apiTrips.map(normalizeTrip);
    } else {
      trips = FALLBACK_TRIPS;
    }
  } catch (error) {
    console.warn("Backend excursions indisponible, fallback utilisé :", error.message);
    trips = FALLBACK_TRIPS;
  }

  renderTrips(trips);
}

function renderTrips(list) {
  const container = document.getElementById("trips-container");

  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Aucun voyage trouvé. Essaie d'autres filtres.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(function (trip) {
    return `
      <div class="trip-card" onclick="showDetail('${trip.id}')">
        <div class="trip-img">
          <img src="${escapeHtml(trip.img)}" alt="${escapeHtml(trip.title)}" loading="lazy">
          <div class="trip-price">${escapeHtml(trip.price)}</div>

          <div class="trip-tags">
            ${trip.tags.map(function (tag) {
              return `<span class="tag">${escapeHtml(tag)}</span>`;
            }).join("")}
          </div>
        </div>

        <div class="trip-body">
          <div class="trip-title">${escapeHtml(trip.title)}</div>

          <div class="trip-meta">
            <div class="trip-meta-item">
              <span class="trip-meta-icon">Lieu :</span>${escapeHtml(trip.location)}
            </div>

            <div class="trip-meta-item">
              <span class="trip-meta-icon">Date :</span>${escapeHtml(trip.date)} · ${escapeHtml(trip.duration)}
            </div>
          </div>

          <button class="btn btn-pink btn-full" style="font-size:0.85rem;padding:0.65rem;">
            Voir le détail
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function filterTrips() {
  const searchValue = (document.getElementById("catalogue-search")?.value || "").toLowerCase();
  const selectedRegion = document.getElementById("filter-region")?.value || "";
  const selectedType = document.getElementById("filter-type")?.value || "";

  const filtered = trips.filter(function (trip) {
    const searchableText = `${trip.title} ${trip.location} ${trip.tags.join(" ")}`.toLowerCase();

    return (
      (!searchValue || searchableText.includes(searchValue)) &&
      (!selectedRegion || trip.region === selectedRegion) &&
      (!selectedType || trip.type === selectedType)
    );
  });

  renderTrips(filtered);
}

function isClientLoggedIn() {
  return window.Auth && window.Auth.isAuthenticated();
}

function showLoginRequiredModal(trip) {
  const oldModal = document.getElementById("login-required-modal");

  if (oldModal) oldModal.remove();

  sessionStorage.setItem("pendingReservationTrip", JSON.stringify(trip));

  const modal = document.createElement("div");
  modal.id = "login-required-modal";

  modal.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(20, 10, 15, 0.42);
      backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    ">
      <div style="
        width: 100%;
        max-width: 430px;
        background: white;
        border-radius: 24px;
        padding: 2rem;
        box-shadow: 0 25px 80px rgba(0,0,0,0.22);
        text-align: center;
        border: 1px solid rgba(194,24,91,0.12);
      ">
        <div style="
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: var(--fuchsia-lt, #fce7f0);
          color: var(--fuchsia, #c2185b);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.6rem;
        ">
          🌸
        </div>

        <h3 style="
          font-family: var(--font-h);
          font-size: 1.55rem;
          margin-bottom: 0.6rem;
          color: var(--charcoal);
        ">
          Connecte-toi pour réserver
        </h3>

        <p style="
          color: var(--gray);
          line-height: 1.7;
          font-size: 0.95rem;
          margin-bottom: 1.4rem;
        ">
          Pour réserver <strong>${escapeHtml(trip.title)}</strong>, connecte-toi ou crée ton compte.
          Après connexion, la réservation s’ouvrira automatiquement dans ton espace client.
        </p>

        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <button type="button" class="btn btn-pink btn-full" id="goLoginBtn">
            Se connecter
          </button>

          <button type="button" class="btn btn-outline-pink btn-full" id="goSignupBtn">
            Créer un compte
          </button>

          <button type="button" class="btn btn-outline-dark btn-full" id="closeLoginModalBtn">
            Continuer à voir les voyages
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("goLoginBtn").onclick = function () {
    window.location.href = "login.html";
  };

  document.getElementById("goSignupBtn").onclick = function () {
    window.location.href = "signup.html";
  };

  document.getElementById("closeLoginModalBtn").onclick = function () {
    modal.remove();
  };
}

function handleReserveTrip(trip) {
  sessionStorage.setItem(
    window.APP_CONFIG.STORAGE_KEYS.SELECTED_TRIP,
    JSON.stringify(trip)
  );

  if (!isClientLoggedIn()) {
    showLoginRequiredModal(trip);
    return;
  }

  if (window.openReservationPanel) {
    window.openReservationPanel(trip);
  } else {
    console.warn("openReservationPanel n'est pas encore chargé.");
  }
}

function extractPublicAvisArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.avis)) return data.avis;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;

  return [];
}

function getPublicAvisName(avis) {
  const fullName = `${avis.client_prenom || ""} ${avis.client_nom || ""}`.trim();

  return (
    fullName ||
    avis.client_name ||
    avis.nom_client ||
    avis.name ||
    "Cliente EcoTrips"
  );
}

function renderPublicAvis(avisList) {
  const container = document.getElementById("detail-reviews");

  if (!container) return;

  if (!avisList.length) {
    container.innerHTML = `
      <p style="color:var(--gray);">
        Aucun avis publié pour le moment.
      </p>
    `;
    return;
  }

  container.innerHTML = avisList.map(function (avis, index) {
    const note = Number(avis.note || avis.rating || 5);
    const name = getPublicAvisName(avis);
    const commentaire = avis.commentaire || avis.comment || avis.text || "";
    const date = avis.created_at || avis.date || "";

    return `
      <div style="${index < avisList.length - 1 ? "border-bottom:1px solid var(--gray-lt);padding-bottom:1.5rem;" : ""}">
        <div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:0.5rem;">
          <strong>${escapeHtml(name)}</strong>
          <span style="color:var(--saffron);white-space:nowrap;">
            ${"★".repeat(note)}${"☆".repeat(Math.max(0, 5 - note))}
          </span>
        </div>

        <p style="color:var(--gray);font-size:0.88rem;font-style:italic;">
          "${escapeHtml(commentaire)}"
        </p>

        ${
          date
            ? `<div style="font-size:0.75rem;color:var(--gray);margin-top:0.5rem;">${formatApiDate(date)}</div>`
            : ""
        }
      </div>
    `;
  }).join("");
}

async function loadPublicAvisForTrip(trip) {
  const container = document.getElementById("detail-reviews");

  if (!container || !trip || !trip.id) return;

  container.innerHTML = `
    <p style="color:var(--gray);">
      Chargement des avis...
    </p>
  `;

  try {
    const data = await window.ApiClient.getPublicAvisByExcursion(trip.id);
    const avis = extractPublicAvisArray(data);

    renderPublicAvis(avis);
  } catch (error) {
    console.warn("Avis publics indisponibles :", error.message);

    renderPublicAvis(trip.reviews || []);
  }
}

function showDetail(id) {
  const trip = trips.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!trip) return;

  currentTrip = trip;

  sessionStorage.setItem(
    window.APP_CONFIG.STORAGE_KEYS.SELECTED_TRIP,
    JSON.stringify(trip)
  );

  document.getElementById("detail-img").src = trip.img;
  document.getElementById("detail-img").alt = trip.title;
  document.getElementById("detail-title").textContent = trip.title;
  document.getElementById("detail-subtitle").textContent = `${trip.location} — ${trip.date}`;

  document.getElementById("detail-tags").innerHTML = trip.tags.map(function (tag) {
    return `<span class="tag">${escapeHtml(tag)}</span>`;
  }).join("");

  document.getElementById("detail-price").textContent = trip.price;
  document.getElementById("detail-dates").textContent = trip.date;
  document.getElementById("detail-location-meta").textContent = `${trip.location} · ${trip.duration}`;
  document.getElementById("detail-desc").textContent = trip.desc;

  document.getElementById("detail-includes-grid").innerHTML = trip.includesIcons.map(function (item) {
    return `
      <div style="background:var(--fuchsia-pale);border-radius:var(--r-sm);padding:1rem;display:flex;align-items:center;gap:0.75rem;border:1px solid rgba(194,24,91,0.08);font-size:0.88rem;font-weight:600;">
        ${escapeHtml(item)}
      </div>
    `;
  }).join("");

  document.getElementById("detail-includes").innerHTML = trip.includes.map(function (item) {
    return `<li>${escapeHtml(item)}</li>`;
  }).join("");

  document.getElementById("detail-itinerary").innerHTML = trip.itinerary.length
    ? trip.itinerary.map(function (day) {
      return `
        <div style="display:flex;gap:1.5rem;align-items:flex-start;">
          <div style="background:var(--fuchsia);color:white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.78rem;flex-shrink:0;margin-top:0.2rem;">
            ${escapeHtml(day.day)}
          </div>

          <div>
            <strong>${escapeHtml(day.title)}</strong>
            <p style="color:var(--gray);font-size:0.87rem;margin-top:0.25rem;">${escapeHtml(day.body)}</p>
          </div>
        </div>
      `;
    }).join("")
    : `<p style="color:var(--gray);">Programme bientôt disponible.</p>`;

  renderPublicAvis(trip.reviews || []);
  loadPublicAvisForTrip(trip);

  const reserveLink = document.querySelector('.detail-sidebar a[href^="reservation.html"]');

  if (reserveLink) {
    reserveLink.href = "#";
    reserveLink.onclick = function (event) {
      event.preventDefault();
      handleReserveTrip(trip);
    };
  }

  switchTab("overview");

  document.getElementById("view-list").style.display = "none";
  document.getElementById("view-detail").style.display = "block";

  window.scrollTo(0, 0);
}

function showList() {
  document.getElementById("view-list").style.display = "block";
  document.getElementById("view-detail").style.display = "none";

  window.scrollTo(0, 0);
}

function switchTab(name) {
  const tabs = ["overview", "itinerary", "reviews"];

  document.querySelectorAll(".tab-btn").forEach(function (button, index) {
    button.classList.toggle("active", tabs[index] === name);
  });

  tabs.forEach(function (tab) {
    const element = document.getElementById("tab-" + tab);

    if (element) {
      element.classList.toggle("active", tab === name);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadTrips);