let trips = [];
let currentTrip = null;

/*
  Données de secours si le backend n'est pas encore disponible.
  Plus tard, le catalogue utilisera surtout GET /api/excursions.
*/
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
    desc: "Un week-end inoubliable qui combine la magie de la Cathédrale de la forêt d'Imsfrane et le frisson du rafting sur les eaux vives. Départ en groupe depuis Tanger, Tétouan ou Sala El Jadida dans une ambiance 100% féminine et conviviale.",
    includesIcons: [
      "Transport touristique",
      "Nuit et petit-déjeuner",
      "Session rafting",
      "Guide accompagnatrice"
    ],
    includes: [
      "Transport touristique aller-retour",
      "Assurance et encadrement",
      "Nuit en hébergement + petit-déjeuner",
      "Équipement rafting complet",
      "Accompagnement et organisation"
    ],
    itinerary: [
      {
        day: "J1",
        title: "Départ et Cathédrale Imsfrane",
        body: "Départ tôt depuis Tanger, Tétouan ou Sala El Jadida. Visite de la majestueuse forêt de cèdres et Cathédrale d'Imsfrane. Dîner de groupe et nuit en hébergement."
      },
      {
        day: "J2",
        title: "Rafting sur l'Oum Er-Rbia",
        body: "Petit-déjeuner, puis grande session de rafting avec équipement complet fourni. Pique-nique au bord de la rivière. Retour en fin d'après-midi."
      }
    ],
    reviews: [
      {
        name: "Fatima Zahra",
        text: "Le rafting c'était de la folie. Ambiance top, guide au top, j'ai adoré chaque instant.",
        date: "Mars 2026"
      },
      {
        name: "Meriem Lahlou",
        text: "Parfaitement organisé. Transport confortable, hébergement sympa, et la forêt d'Imsfrane c'est magnifique.",
        date: "Janvier 2026"
      }
    ]
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
    desc: "3 jours magiques entre la ville impériale de Marrakech, les sommets de l'Atlas à Imlil et le désert lunaire d'Agafay. Un circuit complet pour vivre le Maroc dans toute sa diversité.",
    includesIcons: [
      "Transport inclus",
      "2 nuits hébergement",
      "Repas en groupe",
      "Guide locale"
    ],
    includes: [
      "Transport aller-retour",
      "2 nuits en hébergement",
      "Petit-déjeuners inclus",
      "Circuit guidé Marrakech",
      "Randonnée Imlil"
    ],
    itinerary: [
      {
        day: "J1",
        title: "Départ et Marrakech",
        body: "Arrivée à Marrakech, visite de la Médina, place Jemaa El Fna et souks. Nuit à Marrakech."
      },
      {
        day: "J2",
        title: "Imlil et Atlas",
        body: "Route vers Imlil, randonnée dans les montagnes de l'Atlas, repas berbère traditionnel. Nuit au pied de l'Atlas."
      },
      {
        day: "J3",
        title: "Agafay et retour",
        body: "Matin dans le désert d'Agafay, balade à chameau optionnelle. Retour en fin d'après-midi."
      }
    ],
    reviews: [
      {
        name: "Houda Mansouri",
        text: "Des paysages à couper le souffle et une énergie de groupe extraordinaire. Merci.",
        date: "Avril 2026"
      },
      {
        name: "Zineb Alami",
        text: "Imlil c'est magique, je n'avais jamais vu l'Atlas de si près. Expérience inoubliable.",
        date: "Février 2026"
      }
    ]
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
    desc: "Une journée ressourçante dans les gorges d'Akchour avec ses cascades et ponts naturels, suivie d'une balade dans les ruelles bleues de Chefchaouen. La destination incontournable du Nord.",
    includesIcons: [
      "Transport",
      "Randonnée guidée",
      "Cascades",
      "Chefchaouen"
    ],
    includes: [
      "Transport aller-retour",
      "Encadrement et organisation",
      "Accès aux sites naturels"
    ],
    itinerary: [
      {
        day: "Matin",
        title: "Gorges d'Akchour",
        body: "Départ tôt, arrivée aux gorges. Randonnée jusqu'aux cascades et pont de Dieu. Pique-nique sur place."
      },
      {
        day: "Après-midi",
        title: "Chefchaouen",
        body: "Après-midi libre dans les ruelles bleues de Chefchaouen. Shopping artisanat et photos. Retour en soirée."
      }
    ],
    reviews: [
      {
        name: "Nadia Bensouda",
        text: "Organisation parfaite, guide adorable, et le zipline à Akchour, je n'oublierai jamais.",
        date: "Avril 2026"
      }
    ]
  },
  {
    id: 4,
    title: "Plongée Belyounech",
    location: "Bélyounech, Tétouan",
    date: "17 Mai 2026",
    duration: "1 jour",
    price: "399 dhs",
    img: "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=1200&q=80",
    tags: ["Plongée", "Mer"],
    region: "Nord Maroc",
    type: "Plongée",
    desc: "Explore les fonds marins cristallins de Bélyounech avec une session de plongée encadrée par des professionnels. Accessible même sans expérience. Un monde sous-marin à couper le souffle.",
    includesIcons: [
      "Transport",
      "Équipement plongée",
      "Instructrice",
      "2 plongées"
    ],
    includes: [
      "Transport aller-retour",
      "Équipement plongée complet",
      "2 sessions de plongée",
      "Instructrice certifiée",
      "Assurance"
    ],
    itinerary: [
      {
        day: "Matin",
        title: "Briefing et première plongée",
        body: "Arrivée à Bélyounech, briefing sécurité, première plongée en eaux peu profondes pour débutantes."
      },
      {
        day: "Après-midi",
        title: "Deuxième plongée et détente",
        body: "Deuxième plongée en eau plus profonde. Déjeuner sur la plage. Retour en fin d'après-midi."
      }
    ],
    reviews: [
      {
        name: "Sara El Fassi",
        text: "Jamais fait de plongée avant. L'instructrice était super patiente et les poissons magnifiques.",
        date: "Mars 2026"
      }
    ]
  },
  {
    id: 5,
    title: "Zipline Akchour — Chefchaouen",
    location: "Akchour, Nord Maroc",
    date: "À confirmer",
    duration: "1 jour",
    price: "À partir de 190 dhs",
    img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",
    tags: ["Zipline", "Aventure"],
    region: "Nord Maroc",
    type: "Aventure",
    desc: "L'adrénaline en pleine nature. Enchaîne les tyroliennes au-dessus des gorges d'Akchour et termine par la ville bleue. Pour les amatrices de sensations fortes.",
    includesIcons: [
      "Transport",
      "Zipline",
      "Équipement",
      "Chefchaouen"
    ],
    includes: [
      "Transport aller-retour",
      "Équipement sécurité complet",
      "Encadrement zipline",
      "Visite libre Chefchaouen"
    ],
    itinerary: [
      {
        day: "Matin",
        title: "Gorges et zipline",
        body: "Arrivée aux gorges d'Akchour. Session zipline encadrée avec équipement de sécurité complet."
      },
      {
        day: "Après-midi",
        title: "Chefchaouen",
        body: "Déjeuner et après-midi libre dans les ruelles bleues de Chefchaouen."
      }
    ],
    reviews: [
      {
        name: "Houda El Amrani",
        text: "Quelle montée d'adrénaline. La vue depuis le zipline est incroyable. Je recommande à 100%.",
        date: "Janvier 2026"
      }
    ]
  },
  {
    id: 6,
    title: "Rafting au Maroc",
    location: "Oum Er-Rbia",
    date: "1–3 Mai 2026",
    duration: "3 jours",
    price: "1 200 dhs",
    img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
    tags: ["Rafting", "Éco"],
    region: "Centre Maroc",
    type: "Aventure",
    desc: "3 jours d'aventure pure sur les rapides de l'Oum Er-Rbia. Le circuit le plus complet pour les amatrices de rafting : camping, feu de camp, et les plus beaux rapides du Maroc.",
    includesIcons: [
      "Transport",
      "Camping",
      "Rafting 3 jours",
      "Feu de camp"
    ],
    includes: [
      "Transport aller-retour",
      "2 nuits camping",
      "Repas tous inclus",
      "Équipement rafting",
      "Guide spécialisée"
    ],
    itinerary: [
      {
        day: "J1",
        title: "Arrivée et première descente",
        body: "Installation au camp. Première descente de rapides niveau débutant pour s'échauffer."
      },
      {
        day: "J2",
        title: "Grands rapides",
        body: "La journée la plus intense. Rapides de niveau intermédiaire à avancé. Feu de camp le soir."
      },
      {
        day: "J3",
        title: "Dernière descente et retour",
        body: "Matinée de rafting puis retour. Diplômes remis à toutes les participantes."
      }
    ],
    reviews: [
      {
        name: "Meriem Tazi",
        text: "3 jours de pure adrénaline. Le camping au bord de l'oued, le feu de camp, parfait.",
        date: "Février 2026"
      }
    ]
  }
];

function normalizeTrip(raw) {
  return {
    id: raw.id || raw._id,
    title: raw.title || raw.titre || raw.nom || "Excursion",
    location: raw.location || raw.lieu || raw.depart || "Maroc",
    date: raw.date || raw.date_depart || "Date à confirmer",
    duration: raw.duration || raw.duree || "Durée à confirmer",
    price: raw.price || raw.prix || raw.tarif || "Prix à confirmer",
    img: raw.img || raw.image || raw.image_url || raw.photo || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
    tags: Array.isArray(raw.tags) ? raw.tags : raw.type ? [raw.type] : ["Voyage"],
    region: raw.region || "Nord Maroc",
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
    itinerary: raw.itinerary || raw.programme || [],
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
          <img src="${trip.img}" alt="${trip.title}" loading="lazy">
          <div class="trip-price">${trip.price}</div>
          <div class="trip-tags">
            ${trip.tags.map(function (tag) {
              return `<span class="tag">${tag}</span>`;
            }).join("")}
          </div>
        </div>

        <div class="trip-body">
          <div class="trip-title">${trip.title}</div>

          <div class="trip-meta">
            <div class="trip-meta-item">
              <span class="trip-meta-icon">Lieu :</span>${trip.location}
            </div>
            <div class="trip-meta-item">
              <span class="trip-meta-icon">Date :</span>${trip.date} · ${trip.duration}
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
    return `<span class="tag">${tag}</span>`;
  }).join("");

  document.getElementById("detail-price").textContent = trip.price;
  document.getElementById("detail-dates").textContent = trip.date;
  document.getElementById("detail-location-meta").textContent = `${trip.location} · ${trip.duration}`;
  document.getElementById("detail-desc").textContent = trip.desc;

  document.getElementById("detail-includes-grid").innerHTML = trip.includesIcons.map(function (item) {
    return `
      <div style="background:var(--fuchsia-pale);border-radius:var(--r-sm);padding:1rem;display:flex;align-items:center;gap:0.75rem;border:1px solid rgba(194,24,91,0.08);font-size:0.88rem;font-weight:600;">
        ${item}
      </div>
    `;
  }).join("");

  document.getElementById("detail-includes").innerHTML = trip.includes.map(function (item) {
    return `<li>${item}</li>`;
  }).join("");

  document.getElementById("detail-itinerary").innerHTML = trip.itinerary.length
    ? trip.itinerary.map(function (day) {
      return `
        <div style="display:flex;gap:1.5rem;align-items:flex-start;">
          <div style="background:var(--fuchsia);color:white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.78rem;flex-shrink:0;margin-top:0.2rem;">
            ${day.day}
          </div>
          <div>
            <strong>${day.title}</strong>
            <p style="color:var(--gray);font-size:0.87rem;margin-top:0.25rem;">${day.body}</p>
          </div>
        </div>
      `;
    }).join("")
    : `<p style="color:var(--gray);">Programme bientôt disponible.</p>`;

  document.getElementById("detail-reviews").innerHTML = trip.reviews.length
    ? trip.reviews.map(function (review, index) {
      return `
        <div style="${index < trip.reviews.length - 1 ? "border-bottom:1px solid var(--gray-lt);padding-bottom:1.5rem;" : ""}">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
            <strong>${review.name}</strong>
            <span style="color:var(--saffron);">★★★★★</span>
          </div>
          <p style="color:var(--gray);font-size:0.88rem;font-style:italic;">"${review.text}"</p>
          <div style="font-size:0.75rem;color:var(--gray);margin-top:0.5rem;">${review.date}</div>
        </div>
      `;
    }).join("")
    : `<p style="color:var(--gray);">Aucun avis pour le moment.</p>`;

  const reserveLink = document.querySelector('.detail-sidebar a[href^="reservation.html"]');

  if (reserveLink) {
    reserveLink.href = `reservation.html?excursion_id=${encodeURIComponent(trip.id)}`;
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