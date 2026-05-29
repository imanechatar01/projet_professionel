let trips = [];
let currentTrip = null;

const DEFAULT_TRIP_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80";

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

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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

function getRegionFromDestination(value) {
  const text = normalizeText(value);

  const nord = [
    "tanger",
    "tetouan",
    "tétouan",
    "chefchaouen",
    "akchour",
    "asilah",
    "martil",
    "hoceima",
    "oued laou",
    "larache"
  ];

  const centre = [
    "casablanca",
    "mohammedia",
    "rabat",
    "fes",
    "fès",
    "meknes",
    "meknès",
    "ifrane",
    "azrou",
    "beni mellal",
    "benimellal",
    "khouribga"
  ];

  const sud = [
    "marrakech",
    "agafay",
    "imlil",
    "essaouira",
    "agadir",
    "taghazout",
    "merzouga",
    "ouarzazate",
    "zagora",
    "dakhla",
    "laayoune",
    "laâyoune"
  ];

  if (nord.some(city => text.includes(normalizeText(city)))) return "Nord Maroc";
  if (centre.some(city => text.includes(normalizeText(city)))) return "Centre Maroc";
  if (sud.some(city => text.includes(normalizeText(city)))) return "Sud Maroc";

  return "";
}

function buildImageUrl(raw) {
  let image =
    raw.img ||
    raw.image ||
    raw.image_url ||
    raw.imageUrl ||
    raw.photo ||
    raw.photo_url ||
    raw.photoUrl ||
    raw.image_path ||
    raw.imagePath ||
    raw.cover ||
    raw.coverImage ||
    "";

  if (!image) return DEFAULT_TRIP_IMAGE;

  image = String(image).trim();

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:image") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  const apiBase =
    window.APP_CONFIG?.API_BASE_URL ||
    window.APP_CONFIG?.API_URL ||
    window.APP_CONFIG?.BASE_URL ||
    "";

  if (image.startsWith("/")) {
    return apiBase ? apiBase.replace(/\/$/, "") + image : image;
  }

  if (image.startsWith("uploads/") || image.startsWith("assets/")) {
    return apiBase && image.startsWith("uploads/")
      ? apiBase.replace(/\/$/, "") + "/" + image
      : image;
  }

  return image;
}

function normalizeTrip(raw) {
  const programmeText = raw.programme || raw.program || "";

  const destination =
    raw.destination ||
    raw.ville_destination ||
    raw.villeDestination ||
    "";

  const villeDepart =
    raw.ville_depart ||
    raw.villeDepart ||
    raw.depart ||
    raw.ville_de_depart ||
    "";

  const rawType =
    raw.type ||
    raw.categorie ||
    raw.category ||
    raw.style ||
    raw.theme ||
    "Voyage";

  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : String(rawType)
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

  const region =
    raw.region ||
    raw.zone ||
    getRegionFromDestination(destination) ||
    getRegionFromDestination(raw.location) ||
    "";

  let location = raw.location || raw.lieu || "";

  if (!location) {
    if (villeDepart && destination) {
      location = `${villeDepart} → ${destination}`;
    } else {
      location = villeDepart || destination || "Maroc";
    }
  }

  return {
    id: raw.id || raw._id || raw.uuid || Date.now() + Math.random(),
    title: raw.title || raw.titre || raw.nom || raw.name || "Excursion",
    location: location,
    destination: destination,
    villeDepart: villeDepart,
    date:
      raw.date ||
      raw.date_depart ||
      raw.dateDepart ||
      formatDateRange(
        raw.date_debut || raw.dateDebut || raw.startDate,
        raw.date_fin || raw.dateFin || raw.endDate
      ),
    duration:
      raw.duration ||
      raw.duree ||
      raw.duree_calculee ||
      raw.dureeCalculee ||
      "Durée à confirmer",
    price: raw.price || formatPrice(raw.prix || raw.tarif),
    rawPrice: raw.prix || raw.tarif || raw.price || "",
    img: buildImageUrl(raw),
    tags: tags.length ? tags : ["Voyage"],
    region: region,
    type: String(rawType).trim(),
    desc:
      raw.desc ||
      raw.description ||
      "Une expérience féminine unique organisée par ecotrips_women.",
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
  if (Array.isArray(data.voyages)) return data.voyages;
  if (Array.isArray(data.trips)) return data.trips;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;

  return [];
}

function getLocalStoredTrips() {
  const keys = [
    "excursions",
    "voyages",
    "trips",
    "adminExcursions",
    "ecoTripsExcursions",
    "ecotrips_excursions",
    window.APP_CONFIG?.STORAGE_KEYS?.EXCURSIONS
  ].filter(Boolean);

  let localTrips = [];

  keys.forEach(function (key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      const arr = extractArrayFromApiResponse(parsed);

      if (arr.length > 0) {
        localTrips = localTrips.concat(arr);
      }
    } catch (error) {
      console.warn("Impossible de lire localStorage:", key, error.message);
    }
  });

  return localTrips;
}

function mergeTrips(apiTrips, localTrips) {
  const allTrips = [...apiTrips, ...localTrips];
  const seen = new Set();
  const merged = [];

  allTrips.forEach(function (trip) {
    const key = String(
      trip.id ||
      trip._id ||
      trip.uuid ||
      `${trip.title || trip.titre || trip.nom}-${trip.date || trip.date_debut || ""}`
    );

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(trip);
    }
  });

  return merged;
}

async function loadTrips() {
  const container = document.getElementById("trips-container");

  if (container) {
    container.innerHTML = '<div class="loading-state">Chargement des voyages...</div>';
  }

  let apiTrips = [];
  let localTrips = getLocalStoredTrips();

  try {
    if (window.ApiClient && typeof window.ApiClient.getExcursions === "function") {
      const data = await window.ApiClient.getExcursions();
      apiTrips = extractArrayFromApiResponse(data);
    }
  } catch (error) {
    console.warn("Backend excursions indisponible :", error.message);
  }

  const allTrips = mergeTrips(apiTrips, localTrips);

  if (allTrips.length > 0) {
    trips = allTrips.map(normalizeTrip);
  } else {
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
      <div class="trip-card" data-trip-id="${escapeHtml(trip.id)}">
        <div class="trip-img">
          <img 
            src="${escapeHtml(trip.img)}" 
            alt="${escapeHtml(trip.title)}" 
            loading="lazy"
            onerror="this.onerror=null;this.src='${DEFAULT_TRIP_IMAGE}';"
          >

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

  document.querySelectorAll(".trip-card").forEach(function (card) {
    card.addEventListener("click", function () {
      showDetail(card.dataset.tripId);
    });
  });
}

function filterTrips() {
  const searchValue = normalizeText(
    document.getElementById("catalogue-search")?.value || ""
  );

  const selectedRegion =
    document.getElementById("filter-region")?.value || "";

  const selectedType =
    document.getElementById("filter-type")?.value || "";

  const filtered = trips.filter(function (trip) {
    const searchableText = normalizeText(`
      ${trip.title}
      ${trip.location}
      ${trip.destination}
      ${trip.villeDepart}
      ${trip.region}
      ${trip.type}
      ${trip.tags.join(" ")}
      ${trip.desc}
    `);

    const tripTypeText = normalizeText(`
      ${trip.type}
      ${trip.tags.join(" ")}
    `);

    const matchSearch =
      !searchValue || searchableText.includes(searchValue);

    const matchRegion =
      !selectedRegion || trip.region === selectedRegion;

    const matchType =
      !selectedType || tripTypeText.includes(normalizeText(selectedType));

    return matchSearch && matchRegion && matchType;
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
  const selectedTripKey =
    window.APP_CONFIG?.STORAGE_KEYS?.SELECTED_TRIP || "selectedTrip";

  sessionStorage.setItem(selectedTripKey, JSON.stringify(trip));

  if (!isClientLoggedIn()) {
    showLoginRequiredModal(trip);
    return;
  }

  if (window.openReservationPanel) {
    window.openReservationPanel(trip);
  } else {
    window.location.href = "reservation.html";
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
    const note = Math.max(1, Math.min(5, Number(avis.note || avis.rating || 5)));
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
    if (
      window.ApiClient &&
      typeof window.ApiClient.getPublicAvisByExcursion === "function"
    ) {
      const data = await window.ApiClient.getPublicAvisByExcursion(trip.id);
      const avis = extractPublicAvisArray(data);
      renderPublicAvis(avis);
    } else {
      renderPublicAvis(trip.reviews || []);
    }
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

  const selectedTripKey =
    window.APP_CONFIG?.STORAGE_KEYS?.SELECTED_TRIP || "selectedTrip";

  sessionStorage.setItem(selectedTripKey, JSON.stringify(trip));

  document.getElementById("detail-img").src = trip.img || DEFAULT_TRIP_IMAGE;
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

  const reserveLink = document.querySelector('.detail-sidebar a[href^="reservation.html"], .detail-sidebar a[href="#"]');

  if (reserveLink) {
    reserveLink.href = "#";
    reserveLink.onclick = function (event) {
      event.preventDefault();
      handleReserveTrip(trip);
    };
  }

  switchTab("overview");

  document.getElementById("view-list").style.display = "block";
  document.getElementById("view-detail").style.display = "block";

  document.getElementById("view-list").style.display = "none";

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

document.addEventListener("DOMContentLoaded", function () {
  const detailImg = document.getElementById("detail-img");

  if (detailImg) {
    detailImg.onerror = function () {
      this.onerror = null;
      this.src = DEFAULT_TRIP_IMAGE;
    };
  }

  loadTrips();
});