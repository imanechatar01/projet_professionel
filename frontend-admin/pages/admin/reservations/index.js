const API_BASE = 'http://localhost:5000/api';
const RESERVATIONS_URL = `${API_BASE}/reservations`;
const ADMIN_URL = `${API_BASE}/admin`;
const token = localStorage.getItem('token');

const state = {
    reservations: [],
    clients: [],
    excursions: [],
    filter: 'all',
    search: '',
    modalMode: 'create',
    selectedClient: null,
    selectedExcursion: null,
    createClientMode: false,
    clientQuery: '',
    excursionQuery: '',
    peopleCount: 1,
    specialRequest: '',
    detailReservation: null,
    loadingModal: false
};
// ces 5 fonctions sont ici pour formater soit date soit l'etat du réservation ....
function normalizeText(value) {
    return (value || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function normalizeStatus(value) {
    const normalized = normalizeText(value);
    if (normalized === 'en attente' || normalized === 'enattente') return 'En attente';
    if (normalized === 'confirmee' || normalized === 'confirme') return 'Confirmée';
    if (normalized === 'annulee' || normalized === 'annule') return 'Annulée';
    if (normalized === 'terminee' || normalized === 'termine') return 'Terminée';
    return value || '';
}

function statusMeta(value) {
    const status = normalizeStatus(value);
    if (status === 'En attente') {
        return { label: 'En attente', badge: 'bg-amber-100 text-amber-700 border-amber-200', line: 'bg-amber-400', icon: 'fa-hourglass-half' };
    }
    if (status === 'Confirmée') {
        return { label: 'Confirmée', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', line: 'bg-emerald-500', icon: 'fa-check' };
    }
    if (status === 'Annulée') {
        return { label: 'Annulée', badge: 'bg-rose-100 text-rose-700 border-rose-200', line: 'bg-rose-500', icon: 'fa-times' };
    }
    return { label: status || 'Inconnu', badge: 'bg-slate-100 text-slate-600 border-slate-200', line: 'bg-slate-300', icon: 'fa-circle-dot' };
}

function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(amount) + ' DH';
}

function formatDate(value) {
    if (!value) return 'Date à préciser';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date à préciser';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getReservationNumber(reservation) {
    const year = new Date(reservation.created_at || Date.now()).getFullYear();
    const suffix = String(reservation.id || 0).padStart(3, '0');
    return reservation.numero_reservation || reservation.reference || `RES-${year}-${suffix}`;
}

function getClientName(client) {
    return [client?.prenom, client?.nom].filter(Boolean).join(' ').trim() || 'Cliente';
}

function getReservationTitle(reservation) {
    return reservation.excursion_titre || reservation.titre || 'Excursion';
}

function getReservationDate(reservation) {
    return reservation.excursion_date || reservation.date_excursion || reservation.date_depart || reservation.created_at;
}

function getSelectedExcursionPrice() {
    const price = Number(state.selectedExcursion?.prix || 0);
    return Number.isFinite(price) ? price : 0;
}

function getPeopleCount() {
    const input = document.getElementById('peopleInput');
    return Math.max(1, Number(input?.value || 1));
}

function getCalculatedTotal() {
    return getSelectedExcursionPrice() * getPeopleCount();
}

function setModalMode(mode) {
    state.modalMode = mode;
    renderModal();
    openModal();
}

function openModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

function escapeHtml(value) {
    return (value || '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateSummaryCards() {
    const all = state.reservations.length;
    const pending = state.reservations.filter((item) => normalizeStatus(item.statut) === 'En attente').length;
    const confirmed = state.reservations.filter((item) => normalizeStatus(item.statut) === 'Confirmée').length;
    const revenue = state.reservations
        .filter((item) => normalizeStatus(item.statut) === 'Confirmée')
        .reduce((sum, item) => sum + Number(item.montant_total || 0), 0);

    const allNode = document.getElementById('statAll');
    const pendingNode = document.getElementById('statPending');
    const confirmedNode = document.getElementById('statConfirmed');
    const revenueNode = document.getElementById('statRevenue');
    const badgeNode = document.getElementById('badgeAttente');

    if (allNode) allNode.textContent = all;
    if (pendingNode) pendingNode.textContent = pending;
    if (confirmedNode) confirmedNode.textContent = confirmed;
    if (revenueNode) revenueNode.textContent = formatCurrency(revenue);
    if (badgeNode) {
        badgeNode.textContent = pending > 99 ? '99+' : pending;
        badgeNode.classList.toggle('hidden', pending === 0);
    }
}

function renderEmptyState(isEmpty) {
    const empty = document.getElementById('emptyState');
    if (!empty) return;
    empty.classList.toggle('hidden', !isEmpty);
}

function renderReservations() {
    const grid = document.getElementById('reservationsGrid');
    const label = document.getElementById('resultsLabel');
    const search = normalizeText(state.search);
    const filter = normalizeStatus(state.filter);

    const filtered = state.reservations.filter((reservation) => {
        const statusMatch = filter === 'all' || normalizeStatus(reservation.statut) === filter;
        const numberMatch = normalizeText(getReservationNumber(reservation)).includes(search);
        const clientMatch = normalizeText(`${reservation.client_prenom || ''} ${reservation.client_nom || ''}`).includes(search);
        const excursionMatch = normalizeText(getReservationTitle(reservation)).includes(search);
        return statusMatch && (search === '' || numberMatch || clientMatch || excursionMatch);
    });

    updateSummaryCards();
    renderEmptyState(filtered.length === 0);
    if (label) {
        label.textContent = `${filtered.length} réservation${filtered.length > 1 ? 's' : ''}`;
    }

    if (!grid) return;

    grid.innerHTML = filtered.map((reservation) => {
        const meta = statusMeta(reservation.statut);
        const number = getReservationNumber(reservation);
        const clientInitial = (reservation.client_prenom || reservation.client_nom || 'E').charAt(0).toUpperCase();
        const clientName = [reservation.client_prenom, reservation.client_nom].filter(Boolean).join(' ').trim() || 'Cliente inconnue';
        const excursionDate = formatDate(getReservationDate(reservation));
        const people = Number(reservation.nombre_places || reservation.nb_personnes || 1);
        const total = reservation.montant_total ?? reservation.prix ?? 0;
        const canAct = normalizeStatus(reservation.statut) === 'En attente';

        return `
            <article class="relative overflow-hidden rounded-[28px] bg-white/90 border border-white shadow-soft hover:shadow-lift transition-all duration-300 group">
                <div class="h-1.5 ${meta.line}"></div>
                <div class="p-5 sm:p-6 flex flex-col h-full">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-blush flex items-center justify-center text-forest-green font-extrabold shadow-sm">
                                ${escapeHtml(clientInitial)}
                            </div>
                            <div>
                                <p class="text-[11px] uppercase tracking-[0.22em] font-bold text-slate-400">${escapeHtml(number)}</p>
                                <h3 class="font-playfair text-2xl font-bold text-slate-900 mt-1 leading-tight">${escapeHtml(clientName)}</h3>
                            </div>
                        </div>
                        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${meta.badge}">
                            <i class="fas ${meta.icon}"></i>
                            ${escapeHtml(meta.label)}
                        </span>
                    </div>

                    <div class="mt-5 rounded-3xl bg-warm-beige/60 border border-white p-4 space-y-3 flex-1">
                        <div>
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Excursion</p>
                            <p class="mt-1 text-base font-bold text-slate-900 leading-snug">${escapeHtml(getReservationTitle(reservation))}</p>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div class="rounded-2xl bg-white/80 p-3 border border-white/90">
                                <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Date de l'excursion</p>
                                <p class="mt-1 font-semibold text-slate-800">${escapeHtml(excursionDate)}</p>
                            </div>
                            <div class="rounded-2xl bg-white/80 p-3 border border-white/90">
                                <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Participants</p>
                                <p class="mt-1 font-semibold text-slate-800">${people} personne${people > 1 ? 's' : ''}</p>
                            </div>
                            <div class="rounded-2xl bg-white/80 p-3 border border-white/90 sm:col-span-2">
                                <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Montant total</p>
                                <p class="mt-1 text-xl font-extrabold text-rose-pink">${formatCurrency(total)}</p>
                            </div>
                        </div>
                        ${reservation.demande_speciale ? `
                            <div class="rounded-2xl bg-white/90 border border-rose-100 p-3">
                                <p class="text-[11px] uppercase tracking-[0.18em] text-rose-pink font-bold mb-1">Demande spéciale</p>
                                <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(reservation.demande_speciale)}</p>
                            </div>
                        ` : ''}
                    </div>

                    <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${canAct ? `
                            <button onclick="updateReservationStatus(${reservation.id}, 'Confirmée')" class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-forest-green text-white font-bold hover:scale-[1.01] transition-all">
                                <i class="fas fa-check"></i>
                                Confirmer
                            </button>
                            <button onclick="updateReservationStatus(${reservation.id}, 'Annulée')" class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-rose-200 text-rose-pink font-bold hover:bg-rose-50 transition-all">
                                <i class="fas fa-ban"></i>
                                Annuler
                            </button>
                        ` : ''}
                        <button onclick="openReservationDetails(${reservation.id})" class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all">
                            <i class="fas fa-circle-info"></i>
                            Voir détails
                        </button>
                        <button onclick="deleteReservation(${reservation.id})" class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-transparent border border-slate-200 text-slate-400 hover:text-rose-pink hover:border-rose-200 transition-all">
                            <i class="fas fa-trash-can"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getReservationNumber(reservation) {
    if (!reservation) return 'RES-XXXX';
    const year = new Date(reservation.created_at || Date.now()).getFullYear();
    const suffix = String(reservation.id || 0).padStart(3, '0');
    return reservation.numero_reservation || reservation.reference || `RES-${year}-${suffix}`;
}

function getReservationTitle(reservation) {
    if (!reservation) return 'Excursion';
    return reservation.excursion_titre || reservation.titre || 'Excursion';
}

function getReservationDate(reservation) {
    if (!reservation) return new Date();
    return reservation.excursion_date || reservation.date_excursion || reservation.date_depart || reservation.created_at;
}

function renderModal() {
    const modalEyebrow = document.getElementById('modalEyebrow');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (!modalEyebrow || !modalTitle || !modalBody) {
        console.error("DOM elements for modal not found");
        return;
    }

    if (state.modalMode === 'details' && state.detailReservation) {
        const reservation = state.detailReservation;
        const meta = statusMeta(reservation.statut);
        const number = getReservationNumber(reservation);
        const title = getReservationTitle(reservation);
        const dateStr = formatDate(getReservationDate(reservation));

        modalEyebrow.textContent = 'Détails réservation';
        modalTitle.textContent = number;
        
        modalBody.innerHTML = `
            <div class="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div class="p-6 sm:p-8 bg-white">
                    <div class="rounded-[28px] bg-gradient-to-br from-slate-50 to-blush p-6 border border-slate-100">
                        <div class="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <p class="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">${escapeHtml(number)}</p>
                                <h4 class="font-playfair text-3xl font-bold text-slate-900 mt-2">
                                    ${escapeHtml([reservation.client_prenom, reservation.client_nom].filter(Boolean).join(' ').trim() || 'Cliente')}
                                </h4>
                            </div>
                            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${meta.badge}">
                                <i class="fas ${meta.icon}"></i>${escapeHtml(meta.label)}
                            </span>
                        </div>
                        <div class="grid sm:grid-cols-2 gap-4 mt-6">
                            <div class="rounded-2xl bg-white p-4 border border-slate-100">
                                <p class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Excursion</p>
                                <p class="mt-1 font-semibold text-slate-900">${escapeHtml(title)}</p>
                            </div>
                            <div class="rounded-2xl bg-white p-4 border border-slate-100">
                                <p class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Date</p>
                                <p class="mt-1 font-semibold text-slate-900">${escapeHtml(dateStr)}</p>
                            </div>
                            <div class="rounded-2xl bg-white p-4 border border-slate-100">
                                <p class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Places</p>
                                <p class="mt-1 font-semibold text-slate-900">${Number(reservation.nb_personnes || reservation.nombre_places || 1)} personnes</p>
                            </div>
                            <div class="rounded-2xl bg-white p-4 border border-slate-100">
                                <p class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Total</p>
                                <p class="mt-1 text-2xl font-extrabold text-rose-pink">${formatCurrency(reservation.montant_total || reservation.prix || 0)}</p>
                            </div>
                        </div>
                        ${reservation.demande_speciale ? `
                            <div class="mt-4 rounded-2xl bg-white p-4 border border-rose-100">
                                <p class="text-xs uppercase tracking-[0.18em] text-rose-pink font-bold">Demande spéciale</p>
                                <p class="mt-2 text-slate-600 leading-relaxed">${escapeHtml(reservation.demande_speciale)}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="p-6 sm:p-8 bg-warm-beige/55 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col gap-4">
                    <div class="rounded-[28px] bg-white p-5 border border-slate-100 shadow-sm">
                        <p class="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">Actions rapides</p>
                        <div class="mt-4 space-y-3">
                            ${normalizeStatus(reservation.statut) === 'En attente' ? `
                                <button onclick="updateReservationStatus(${reservation.id}, 'Confirmée')" class="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-forest-green text-white font-bold hover:scale-[1.01] transition-all">
                                    <i class="fas fa-check"></i> Confirmer
                                </button>
                                <button onclick="updateReservationStatus(${reservation.id}, 'Annulée')" class="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white border border-rose-200 text-rose-pink font-bold hover:bg-rose-50 transition-all">
                                    <i class="fas fa-ban"></i> Annuler
                                </button>
                            ` : ''}
                            <button onclick="deleteReservation(${reservation.id})" class="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-transparent border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">
                                <i class="fas fa-trash-can"></i> Supprimer
                            </button>
                        </div>
                    </div>
                    <div class="rounded-[28px] bg-white p-5 border border-slate-100 shadow-sm">
                        <p class="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">Contact</p>
                        <div class="mt-3 text-sm text-slate-600 space-y-2">
                            <p><span class="font-semibold text-slate-900">Email:</span> ${escapeHtml(reservation.client_email || 'Non renseigné')}</p>
                            <p><span class="font-semibold text-slate-900">Créée le:</span> ${escapeHtml(formatDate(reservation.created_at))}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    modalEyebrow.textContent = state.createClientMode ? 'Créer un client' : 'Nouvelle réservation';
    modalTitle.textContent = state.createClientMode ? 'Créer un client puis réserver' : 'Créer une réservation';

    const clientResults = state.clients.slice(0, 6);
    const excursionResults = state.excursions.slice(0, 8);
    const selectedTotal = formatCurrency(getCalculatedTotal());
    const excursionDate = state.selectedExcursion ? formatDate(state.selectedExcursion.date_excursion || state.selectedExcursion.date_depart || state.selectedExcursion.start_date) : 'Sélectionnez une excursion';

    modalBody.innerHTML = `
        <div class="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div class="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 bg-gradient-to-br from-white to-blush/40">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p class="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">Client</p>
                        <h4 class="font-playfair text-2xl font-bold text-slate-900 mt-1">Choisir ou créer une cliente</h4>
                    </div>
                    <button onclick="toggleNewClientMode()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-pink font-bold bg-white hover:bg-rose-50 transition-all">
                        <i class="fas fa-user-plus"></i>
                        ${state.createClientMode ? 'Utiliser un client existant' : 'Créer un nouveau client'}
                    </button>
                </div>

                <div class="mt-5 rounded-[26px] bg-white p-4 border border-slate-100 shadow-sm">
                    <label class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Rechercher un client</label>
                    <div class="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-forest-green">
                        <i class="fas fa-search text-rose-pink/60"></i>
                        <input id="clientSearchInput" value="${escapeHtml(state.clientQuery)}" type="text" placeholder="Nom, prénom, email ou téléphone" class="w-full outline-none bg-transparent text-sm">
                    </div>
                    <div class="mt-4 max-h-72 overflow-auto space-y-2 scrollbar-hide">
                        ${clientResults.length ? clientResults.map((client) => {
                            const selected = state.selectedClient && String(state.selectedClient.id) === String(client.id);
                            return `
                                <button onclick="pickClient(${client.id})" class="w-full text-left rounded-2xl border px-4 py-3 transition-all ${selected ? 'border-forest-green bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'}">
                                    <div class="flex items-center justify-between gap-3">
                                        <div>
                                            <p class="font-bold text-slate-900">${escapeHtml(getClientName(client))}</p>
                                            <p class="text-sm text-slate-500 mt-1">${escapeHtml(client.email || 'Email non renseigné')}</p>
                                        </div>
                                        <i class="fas ${selected ? 'fa-circle-check text-forest-green' : 'fa-user text-slate-300'}"></i>
                                    </div>
                                </button>
                            `;
                        }).join('') : '<div class="text-sm text-slate-400 py-6 text-center">Aucun client trouvé.</div>'}
                    </div>
                </div>

                <div class="mt-4 rounded-[26px] bg-white p-4 border border-slate-100 shadow-sm">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Client sélectionné</p>
                    <div id="selectedClientPreview" class="mt-3 ${state.selectedClient ? '' : 'text-slate-400'}">
                        ${state.selectedClient ? `
                            <div class="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                                <p class="font-bold text-slate-900">${escapeHtml(getClientName(state.selectedClient))}</p>
                                <p class="text-sm text-slate-600 mt-1">${escapeHtml(state.selectedClient.email || '')}</p>
                                <p class="text-sm text-slate-600">${escapeHtml(state.selectedClient.telephone || 'Téléphone non renseigné')}</p>
                            </div>
                        ` : 'Aucune cliente sélectionnée.'}
                    </div>
                </div>

                ${state.createClientMode ? `
                    <div class="mt-4 rounded-[26px] bg-warm-beige/70 p-5 border border-white shadow-sm">
                        <p class="text-xs uppercase tracking-[0.18em] text-rose-pink font-bold">Nouveau client</p>
                        <div class="grid sm:grid-cols-2 gap-3 mt-4">
                            <input id="newClientPrenom" type="text" placeholder="Prénom" class="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-forest-green bg-white">
                            <input id="newClientNom" type="text" placeholder="Nom" class="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-forest-green bg-white">
                            <input id="newClientEmail" type="email" placeholder="Email" class="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-forest-green bg-white sm:col-span-2">
                            <input id="newClientTelephone" type="text" placeholder="Téléphone" class="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-forest-green bg-white sm:col-span-2">
                        </div>
                        <p class="text-xs text-slate-500 mt-3 leading-relaxed">Un mot de passe temporaire sera généré automatiquement si aucun mot de passe n’est saisi.</p>
                    </div>
                ` : ''}
            </div>

            <div class="p-6 sm:p-8 bg-warm-beige/50">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p class="text-xs uppercase tracking-[0.22em] text-slate-400 font-bold">Excursion</p>
                        <h4 class="font-playfair text-2xl font-bold text-slate-900 mt-1">Sélectionner une excursion</h4>
                    </div>
                    <div class="rounded-2xl bg-white px-4 py-2 border border-white shadow-sm text-sm font-semibold text-slate-600">
                        <i class="fas fa-sparkles text-rose-pink mr-2"></i>Prix automatique
                    </div>
                </div>

                <div class="mt-5 rounded-[26px] bg-white p-4 border border-slate-100 shadow-sm">
                    <label class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Rechercher une excursion</label>
                    <div class="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-forest-green">
                        <i class="fas fa-seedling text-forest-green/60"></i>
                        <input id="excursionSearchInput" value="${escapeHtml(state.excursionQuery)}" type="text" placeholder="Titre, région ou type" class="w-full outline-none bg-transparent text-sm">
                    </div>
                    <div class="mt-4 max-h-72 overflow-auto space-y-2 scrollbar-hide">
                        ${excursionResults.length ? excursionResults.map((excursion) => {
                            const selected = state.selectedExcursion && String(state.selectedExcursion.id) === String(excursion.id);
                            return `
                                <button onclick="pickExcursion(${excursion.id})" class="w-full text-left rounded-2xl border px-4 py-3 transition-all ${selected ? 'border-forest-green bg-emerald-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'}">
                                    <div class="flex items-start justify-between gap-3">
                                        <div>
                                            <p class="font-bold text-slate-900">${escapeHtml(excursion.titre || 'Excursion')}</p>
                                            <p class="text-sm text-slate-500 mt-1">${escapeHtml(excursion.type || excursion.region || 'Expérience nature')}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="font-extrabold text-rose-pink">${formatCurrency(excursion.prix || 0)}</p>
                                            <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mt-1">par personne</p>
                                        </div>
                                    </div>
                                </button>
                            `;
                        }).join('') : '<div class="text-sm text-slate-400 py-6 text-center">Aucune excursion trouvée.</div>'}
                    </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-4 mt-4">
                    <div class="rounded-[26px] bg-white p-4 border border-slate-100 shadow-sm">
                        <label class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Date de l'excursion</label>
                        <p class="mt-2 text-slate-900 font-semibold">${escapeHtml(excursionDate)}</p>
                    </div>
                    <div class="rounded-[26px] bg-white p-4 border border-slate-100 shadow-sm">
                        <label class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Nombre de personnes</label>
                        <input id="peopleInput" type="number" min="1" value="${state.peopleCount}" class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-forest-green" />
                    </div>
                </div>

                <div class="mt-4 rounded-[26px] bg-white p-4 border border-slate-100 shadow-sm">
                    <label class="text-xs uppercase tracking-[0.18em] text-slate-400 font-bold">Demandes spéciales</label>
                    <textarea id="specialRequestInput" rows="4" class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-forest-green resize-none" placeholder="Ex: régime alimentaire, hébergement, allergies, timing...">${escapeHtml(state.specialRequest)}</textarea>
                </div>

                <div class="mt-4 rounded-[28px] bg-gradient-to-br from-slate-900 to-forest-green text-white p-5 shadow-lift">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-xs uppercase tracking-[0.22em] text-white/60 font-bold">Total automatique</p>
                            <p class="mt-2 text-3xl font-extrabold" id="computedTotal">${selectedTotal}</p>
                        </div>
                        <div class="text-right text-sm text-white/70">
                            <p>${state.selectedExcursion ? escapeHtml(state.selectedExcursion.titre || 'Excursion') : 'Sélectionnez une excursion'}</p>
                            <p class="mt-1">${state.selectedExcursion ? `${formatCurrency(getSelectedExcursionPrice())} x ${getPeopleCount()}` : 'Prix non calculé'}</p>
                        </div>
                    </div>
                </div>

                <button onclick="submitNewReservation()" class="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-[22px] bg-rose-pink text-white font-extrabold shadow-lift hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-bag-shopping"></i>
                    Créer la réservation
                </button>
            </div>
        </div>
    `;

    attachModalListeners();
}

function attachModalListeners() {
    const clientSearchInput = document.getElementById('clientSearchInput');
    const excursionSearchInput = document.getElementById('excursionSearchInput');
    const peopleInput = document.getElementById('peopleInput');
    const specialRequestInput = document.getElementById('specialRequestInput');
    const computedTotal = document.getElementById('computedTotal');

    if (clientSearchInput) {
        clientSearchInput.focus();
        clientSearchInput.oninput = () => {
            state.clientQuery = clientSearchInput.value;
            fetchClients(state.clientQuery);
        };
    }

    if (excursionSearchInput) {
        excursionSearchInput.oninput = () => {
            state.excursionQuery = excursionSearchInput.value;
            fetchExcursions(state.excursionQuery);
        };
    }

    if (peopleInput) {
        peopleInput.oninput = () => {
            state.peopleCount = Math.max(1, Number(peopleInput.value || 1));
            if (computedTotal) computedTotal.textContent = formatCurrency(getCalculatedTotal());
        };
    }

    if (specialRequestInput) {
        specialRequestInput.oninput = () => {
            state.specialRequest = specialRequestInput.value;
        };
    }
}

function openReservationDetails(reservationId) {
    const reservation = state.reservations.find((item) => String(item.id) === String(reservationId));
    if (!reservation) return;
    state.detailReservation = reservation;
    state.modalMode = 'details';
    renderModal();
    openModal();
}

function pickClient(clientId) {
    state.selectedClient = state.clients.find((client) => String(client.id) === String(clientId)) || null;
    state.createClientMode = false;
    renderModal();
}

function pickExcursion(excursionId) {
    state.selectedExcursion = state.excursions.find((excursion) => String(excursion.id) === String(excursionId)) || null;
    renderModal();
}

function toggleNewClientMode() {
    state.createClientMode = !state.createClientMode;
    if (state.createClientMode) {
        state.selectedClient = null;
    }
    renderModal();
}

async function fetchReservations() {
    try {
        const response = await fetch(RESERVATIONS_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            showToast('Erreur serveur lors du chargement des réservations', 'error');
            return;
        }

        const data = await response.json();
        state.reservations = data.reservations || data || [];
        renderReservations();
    } catch (error) {
        showToast('Problème de connexion au serveur', 'error');
    }
}

async function fetchClients(query = '') {
    try {
        const response = await fetch(`${ADMIN_URL}/clients?query=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        state.clients = data.clients || [];
        if (state.modalMode === 'create') renderModal();
    } catch (error) {
        console.error(error);
    }
}

async function fetchExcursions(query = '') {
    try {
        const response = await fetch(`${ADMIN_URL}/excursions?query=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        state.excursions = data.excursions || [];
        if (state.modalMode === 'create') renderModal();
    } catch (error) {
        console.error(error);
    }
}

function updateReservationStatus(id, newStatus) {
    const canonicalStatus = normalizeStatus(newStatus);
    const snapshot = state.reservations.map((item) => ({ ...item }));

    // Mise à jour optimiste de l'UI
    state.reservations = state.reservations.map((item) => 
        item.id === id ? { ...item, statut: canonicalStatus } : item
    );
    renderReservations();

    fetch(`${RESERVATIONS_URL}/${id}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statut: canonicalStatus })
    })
    .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Échec de la mise à jour');
        }
        showToast(`Réservation ${canonicalStatus.toLowerCase()}`, 'success');
        return fetchReservations();
    })
    .catch((error) => {
        console.error('Erreur update:', error);
        state.reservations = snapshot;
        renderReservations();
        showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    });
}

async function deleteReservation(id) {
    const overlay = document.getElementById('confirmOverlay');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const confirmBtn = document.getElementById('confirmConfirmBtn');

    if (!overlay || !cancelBtn || !confirmBtn) return;

    // Afficher la modal de confirmation personnalisée
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    return new Promise((resolve) => {
        const handleCancel = () => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            cleanup();
            resolve(false);
        };

        const handleConfirm = async () => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            cleanup();

            try {
                const response = await fetch(`${ADMIN_URL}/reservations/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('delete failed');
                showToast('Réservation supprimée avec succès', 'success');
                if (state.detailReservation && String(state.detailReservation.id) === String(id)) {
                    closeModal();
                }
                await fetchReservations();
            } catch (error) {
                showToast('Impossible de supprimer la réservation', 'error');
            }
            resolve(true);
        };

        const cleanup = () => {
            cancelBtn.removeEventListener('click', handleCancel);
            confirmBtn.removeEventListener('click', handleConfirm);
        };

        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
    });
}

async function createClientIfNeeded() {
    if (!state.createClientMode) return state.selectedClient;

    const nom = document.getElementById('newClientNom')?.value.trim();
    const prenom = document.getElementById('newClientPrenom')?.value.trim();
    const email = document.getElementById('newClientEmail')?.value.trim();
    const telephone = document.getElementById('newClientTelephone')?.value.trim();

    if (!nom || !email) {
        throw new Error('Nom et email requis pour créer une cliente');
    }

    const response = await fetch(`${ADMIN_URL}/clients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nom, prenom, email, telephone })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Erreur création cliente');
    }

    if (data.temporaryPassword) {
        showToast(`Client créé. Mot de passe temporaire: ${data.temporaryPassword}`, 'success');
    } else {
        showToast('Cliente créée avec succès', 'success');
    }

    state.selectedClient = data.client;
    state.createClientMode = false;
    return data.client;
}

async function submitNewReservation() {
    try {
        state.loadingModal = true;
        const client = await createClientIfNeeded();
        const clientRecord = client || state.selectedClient;
        const excursion = state.selectedExcursion;
        const people = getPeopleCount();
        const specialRequest = state.specialRequest || document.getElementById('specialRequestInput')?.value.trim() || '';

        if (!clientRecord) {
            showToast('Sélectionnez ou créez une cliente', 'error');
            return;
        }
        if (!excursion) {
            showToast('Sélectionnez une excursion', 'error');
            return;
        }

        const total = getCalculatedTotal();
        if (total <= 0) {
            showToast('Le montant calculé est invalide', 'error');
            return;
        }

        const response = await fetch(`${ADMIN_URL}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                client_id: clientRecord.id,
                excursion_id: excursion.id,
                nb_personnes: people,
                montant_total: total,
                demande_speciale: specialRequest
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erreur création réservation');
        }

        showToast('Réservation créée avec succès', 'success');
        closeModal();
        state.modalMode = 'create';
        state.selectedClient = null;
        state.selectedExcursion = null;
        state.createClientMode = false;
        await fetchReservations();
    } catch (error) {
        showToast(error.message || 'Impossible de créer la réservation', 'error');
    } finally {
        state.loadingModal = false;
    }
}

function openCreateReservationModal() {
    state.modalMode = 'create';
    state.detailReservation = null;
    state.selectedClient = null;
    state.selectedExcursion = null;
    state.createClientMode = false;
    state.clientQuery = '';
    state.excursionQuery = '';
    state.peopleCount = 1;
    state.specialRequest = '';
    fetchClients('');
    fetchExcursions('');
    renderModal();
    openModal();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const palette = type === 'success'
        ? 'bg-forest-green text-white'
        : type === 'info'
            ? 'bg-slate-900 text-white'
            : 'bg-rose-pink text-white';
    const icon = type === 'success' ? 'fa-circle-check' : type === 'info' ? 'fa-circle-info' : 'fa-triangle-exclamation';

    toast.className = `toast-enter flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-lift ${palette} min-w-[280px] max-w-[92vw]`;
    toast.innerHTML = `
        <span class="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center"><i class="fas ${icon}"></i></span>
        <span class="font-semibold text-sm leading-tight">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(14px)';
        setTimeout(() => toast.remove(), 250);
    }, 2600);
}

function applyFilter(status, button) {
    state.filter = status;
    document.querySelectorAll('.filter-tab').forEach((item) => {
        item.classList.remove('bg-forest-green', 'text-white', 'shadow-md');
        item.classList.add('bg-gray-50', 'text-gray-600', 'hover:bg-gray-100');
    });
    button.classList.remove('bg-gray-50', 'text-gray-600', 'hover:bg-gray-100');
    button.classList.add('bg-forest-green', 'text-white');
    renderReservations();
}

function setFilter(status, button) {
    applyFilter(status, button);
}

function initializePage() {
    

    const searchInput = document.getElementById('searchInput');
    const openCreateBtn = document.getElementById('openCreateReservationBtn');
    const emptyCreateBtn = document.getElementById('emptyCreateBtn');
    const overlay = document.getElementById('modalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');

    searchInput?.addEventListener('input', () => {
        state.search = searchInput.value;
        renderReservations();
    });

    openCreateBtn?.addEventListener('click', openCreateReservationModal);
    emptyCreateBtn?.addEventListener('click', openCreateReservationModal);
    closeModalBtn?.addEventListener('click', closeModal);

    overlay?.addEventListener('click', (event) => {
        if (event.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    fetchReservations();
    fetchClients('');
    fetchExcursions('');
}

document.addEventListener('DOMContentLoaded', initializePage);

window.setFilter = setFilter;
window.updateReservationStatus = updateReservationStatus;
window.deleteReservation = deleteReservation;
window.pickClient = pickClient;
window.pickExcursion = pickExcursion;
window.toggleNewClientMode = toggleNewClientMode;
window.submitNewReservation = submitNewReservation;
window.openReservationDetails = openReservationDetails;
window.openCreateReservationModal = openCreateReservationModal;
window.closeModal = closeModal;
