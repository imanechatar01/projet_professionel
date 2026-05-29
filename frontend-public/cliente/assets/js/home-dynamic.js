(function () {
  const API_BASE_URL = (
    window.APP_CONFIG?.API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");

  const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

  function getImageUrl(imageUrl) {
    if (!imageUrl) return "";

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/uploads/")) {
      return `${SERVER_BASE_URL}${imageUrl}`;
    }

    if (imageUrl.startsWith("uploads/")) {
      return `${SERVER_BASE_URL}/${imageUrl}`;
    }

    return `${SERVER_BASE_URL}/uploads/${imageUrl}`;
  }

  function extractArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.images)) return data.images;
    if (Array.isArray(data.galerie)) return data.galerie;
    if (Array.isArray(data.excursions)) return data.excursions;
    if (Array.isArray(data.avis)) return data.avis;
    if (Array.isArray(data.results)) return data.results;

    return [];
  }

  async function fetchJson(path) {
    const response = await fetch(`${API_BASE_URL}${path}`);

    if (!response.ok) {
      throw new Error(`Erreur API : ${path}`);
    }

    return response.json();
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
  }

  function isActiveTrip(trip) {
    const statut = String(trip.statut || trip.status || "").toLowerCase();

    return !(
      statut.includes("brouillon") ||
      statut.includes("annul") ||
      statut.includes("inactive")
    );
  }

  function getTripId(trip) {
    return trip.id || trip.excursion_id || trip._id || null;
  }

  function getTripTitle(trip) {
    return trip.titre || trip.title || trip.nom || "Voyage EcoTrips Women";
  }

  function getTripDateStart(trip) {
    return trip.date_debut || trip.date_depart || trip.date || null;
  }

  function getTripDateEnd(trip) {
    return trip.date_fin || null;
  }

  function getTotalPlaces(trip) {
    return toNumber(
      trip.places_total ||
      trip.placesTotal ||
      trip.total_places ||
      trip.places_max ||
      trip.placesMax
    );
  }

  function getRemainingPlaces(trip) {
    return toNumber(
      trip.places_restantes ||
      trip.placesRestantes ||
      trip.remaining_places ||
      trip.places_disponibles ||
      trip.placesDisponibles
    );
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateRange(start, end) {
    const startText = formatDate(start);
    const endText = formatDate(end);

    if (startText && endText && startText !== endText) {
      return `${startText} → ${endText}`;
    }

    return startText || "Date à confirmer";
  }

  function sortByClosestDate(a, b) {
    const dateA = new Date(getTripDateStart(a) || "2999-12-31").getTime();
    const dateB = new Date(getTripDateStart(b) || "2999-12-31").getTime();

    return dateA - dateB;
  }

  function getAvisName(avis) {
    const fullName = `${avis.client_prenom || ""} ${avis.client_nom || ""}`.trim();

    return (
      fullName ||
      avis.client_name ||
      avis.nom_client ||
      avis.name ||
      avis.nom ||
      "Cliente EcoTrips"
    );
  }

  function getAvisCity(avis) {
    return (
      avis.ville ||
      avis.city ||
      avis.client_ville ||
      avis.location ||
      "EcoTrips Women"
    );
  }

  function isPublishedAvis(avis) {
    const statut = String(avis.statut || avis.status || "").toLowerCase();

    if (!statut) return true;

    return (
      statut.includes("publie") ||
      statut.includes("publié") ||
      statut.includes("valide") ||
      statut.includes("valid") ||
      statut.includes("published")
    );
  }

  function updateHomeStats(trips) {
    const activeTrips = trips.filter(isActiveTrip);

    const totalPlaces = activeTrips.reduce((sum, trip) => {
      return sum + getTotalPlaces(trip);
    }, 0);

    const remainingPlaces = activeTrips.reduce((sum, trip) => {
      return sum + getRemainingPlaces(trip);
    }, 0);

    const bookedPlaces = Math.max(0, totalPlaces - remainingPlaces);

    const progressPercent =
      totalPlaces > 0
        ? Math.min(100, Math.round((bookedPlaces / totalPlaces) * 100))
        : 0;

    setText("homeActiveTrips", activeTrips.length || "--");
    setText("homeRemainingPlaces", totalPlaces > 0 ? remainingPlaces : "--");
    setText("homeBookedPlaces", totalPlaces > 0 ? bookedPlaces : "--");
    setText("homeTotalPlaces", totalPlaces > 0 ? totalPlaces : "--");

    const progressBar = document.getElementById("homeProgressBar");

    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }

    if (totalPlaces > 0) {
      setText(
        "homeOccupancyText",
        `${bookedPlaces}/${totalPlaces} places réservées · ${remainingPlaces} restantes`
      );
    } else {
      setText("homeOccupancyText", "Places à confirmer");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextTrips = activeTrips
      .filter((trip) => {
        const remaining = getRemainingPlaces(trip);
        const start = getTripDateStart(trip);

        if (!start) return remaining > 0;

        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);

        return remaining > 0 && startDate >= today;
      })
      .sort(sortByClosestDate);

    const nextTrip = nextTrips[0] || activeTrips.sort(sortByClosestDate)[0];

    if (nextTrip) {
      const remaining = getRemainingPlaces(nextTrip);
      const total = getTotalPlaces(nextTrip);

      setText("homeNextTripTitle", getTripTitle(nextTrip));

      setText(
        "homeNextTripDate",
        `Prochain départ · ${formatDateRange(
          getTripDateStart(nextTrip),
          getTripDateEnd(nextTrip)
        )}`
      );

      if (total > 0) {
        setText(
          "homeNextTripPlaces",
          remaining > 0 ? `${remaining} places restantes` : "Complet"
        );
      } else {
        setText("homeNextTripPlaces", "Places limitées");
      }
    }
  }

  async function loadHomeStats() {
    try {
      const data = await fetchJson("/excursions");
      const trips = extractArray(data);

      updateHomeStats(trips);

      return trips;
    } catch (error) {
      console.warn("Impossible de charger les statistiques réelles :", error);
      return [];
    }
  }

  async function loadHeroBackground() {
    const heroBg = document.querySelector(".hero-bg");

    if (!heroBg) return;

    try {
      let data = await fetchJson("/galerie?categorie=background_accueil&limit=1");
      let images = extractArray(data);

      if (!images.length) {
        data = await fetchJson("/galerie?categorie=principale&limit=1");
        images = extractArray(data);
      }

      if (!images.length) return;

      const imageUrl = getImageUrl(
        images[0].image_url || images[0].image || images[0].url
      );

      if (!imageUrl) return;

      heroBg.style.backgroundImage = `url("${imageUrl}")`;
      heroBg.style.backgroundSize = "cover";
      heroBg.style.backgroundPosition = "center";
      heroBg.style.backgroundRepeat = "no-repeat";
    } catch (error) {
      console.warn("Impossible de charger le background depuis la galerie :", error);
    }
  }

  async function loadHomeGallery() {
    const galleryGrid =
      document.getElementById("homeGalleryGrid") ||
      document.querySelector("#galerie .gallery-grid");

    if (!galleryGrid) return;

    try {
      const data = await fetchJson("/galerie?categorie=principale&limit=6");
      const images = extractArray(data);

      if (!images.length) {
        galleryGrid.innerHTML = `
          <div class="gallery-item" style="grid-column:1/-1;padding:2rem;text-align:center;">
            <p style="color:#7a4a5a;font-weight:600;">
              Aucune image publiée pour le moment.
            </p>
          </div>
        `;
        return;
      }

      galleryGrid.innerHTML = images.map((image) => {
        const imageUrl = getImageUrl(image.image_url || image.image || image.url);
        const title = image.titre || image.title || "Image EcoTrips Women";

        return `
          <div class="gallery-item" onclick="openLightbox(this)">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}">
            <div class="gallery-overlay">
              <span class="gallery-zoom">+</span>
            </div>
          </div>
        `;
      }).join("");
    } catch (error) {
      console.warn("Impossible de charger la galerie publique :", error);

      galleryGrid.innerHTML = `
        <div class="gallery-item" style="grid-column:1/-1;padding:2rem;text-align:center;">
          <p style="color:#c0392b;font-weight:600;">
            Erreur lors du chargement de la galerie.
          </p>
        </div>
      `;
    }
  }

  async function getPublicAvisForTrip(trip) {
    const excursionId = getTripId(trip);

    if (!excursionId) return [];

    try {
      const data = await fetchJson(`/avis/excursion/${excursionId}`);
      const avisList = extractArray(data);

      return avisList
        .filter(isPublishedAvis)
        .map((avis) => ({
          ...avis,
          excursion_titre:
            avis.excursion_titre ||
            avis.excursion_title ||
            avis.titre ||
            getTripTitle(trip)
        }));
    } catch (error) {
      console.warn(`Impossible de charger les avis du voyage ${excursionId} :`, error);
      return [];
    }
  }

  function renderPublishedAvis(avisList) {
    const testimonialsGrid =
      document.getElementById("homeTestimonialsGrid") ||
      document.querySelector(".testimonials-grid");

    if (!testimonialsGrid) return;

    if (!avisList.length) {
      testimonialsGrid.innerHTML = `
        <div class="testimonial-card" style="grid-column:1/-1;text-align:center;">
          <div class="testimonial-stars">★★★★★</div>
          <p class="testimonial-text">
            Aucun avis publié pour le moment. Les avis validés par l’admin apparaîtront ici.
          </p>
          <div class="testimonial-author" style="justify-content:center;">
            <div class="testimonial-avatar">EW</div>
            <div>
              <div class="testimonial-name">EcoTrips Women</div>
              <div class="testimonial-loc">Avis validés</div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const visibleAvis = avisList.slice(0, 3);

    testimonialsGrid.innerHTML = visibleAvis.map((avis) => {
      const note = Number(avis.note || avis.rating || 5);
      const safeNote = Math.max(1, Math.min(5, note));
      const commentaire = avis.commentaire || avis.comment || avis.text || "";
      const name = getAvisName(avis);
      const city = getAvisCity(avis);
      const initials = name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "EW";

      return `
        <div class="testimonial-card">
          <div class="testimonial-stars">
            ${"★".repeat(safeNote)}${"☆".repeat(5 - safeNote)}
          </div>

          <p class="testimonial-text">
            “${escapeHtml(commentaire)}”
          </p>

          <div class="testimonial-author">
            <div class="testimonial-avatar">${escapeHtml(initials)}</div>

            <div>
              <div class="testimonial-name">${escapeHtml(name)}</div>
              <div class="testimonial-loc">${escapeHtml(city)}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  async function loadPublishedAvis(trips) {
    try {
      let sourceTrips = trips;

      if (!Array.isArray(sourceTrips) || !sourceTrips.length) {
        const data = await fetchJson("/excursions");
        sourceTrips = extractArray(data);
      }

      const activeTrips = sourceTrips.filter(isActiveTrip);

      if (!activeTrips.length) {
        renderPublishedAvis([]);
        return;
      }

      const avisGroups = await Promise.all(
        activeTrips.map((trip) => getPublicAvisForTrip(trip))
      );

      const allAvis = avisGroups
        .flat()
        .filter(isPublishedAvis)
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.date || 0).getTime();
          const dateB = new Date(b.created_at || b.date || 0).getTime();

          return dateB - dateA;
        });

      renderPublishedAvis(allAvis);
    } catch (error) {
      console.warn("Impossible de charger les avis publiés :", error);
      renderPublishedAvis([]);
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const trips = await loadHomeStats();

    loadHeroBackground();
    loadHomeGallery();
    loadPublishedAvis(trips);
  });
})();
