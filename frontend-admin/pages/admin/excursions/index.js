const API_URL = 'http://localhost:5000/api';
let allExcursions = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchExcursions();
    
    document.getElementById('excursionForm').addEventListener('submit', handleFormSubmit);
    
    // Calcul automatique de la durée
    const dateDebut = document.getElementsByName('date_debut')[0];
    const dateFin = document.getElementsByName('date_fin')[0];
    const dureeInput = document.getElementById('dureeInput');

    const updateDuree = () => {
        if (dateDebut.value && dateFin.value) {
            const start = new Date(dateDebut.value);
            const end = new Date(dateFin.value);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            if (diffDays > 0) {
                dureeInput.value = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
            } else {
                dureeInput.value = '1 jour';
            }
        }
    };

    dateDebut.addEventListener('change', updateDuree);
    dateFin.addEventListener('change', updateDuree);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allExcursions.filter(ex => 
            ex.titre.toLowerCase().includes(query) || 
            ex.description.toLowerCase().includes(query) ||
            ex.type.toLowerCase().includes(query)
        );
        renderExcursions(filtered);
    });
});

async function fetchExcursions() {
    const grid = document.getElementById('excursionsGrid');
    const loading = document.getElementById('loadingState');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../login.html';
            return;
        }

        grid.innerHTML = '';
        loading.classList.remove('hidden');
        
        const response = await fetch(`${API_URL}/admin/excursions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = '../../login.html';
                return;
            }
            throw new Error('Erreur lors du chargement');
        }

        const data = await response.json();
        console.log('Excursions récupérées:', data);
        
        if (data.success) {
            allExcursions = data.excursions;
            renderExcursions(allExcursions);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-red-500">
            <i class="fas fa-exclamation-circle mb-2"></i> Erreur de connexion au serveur
        </div>`;
    } finally {
        loading.classList.add('hidden');
    }
}

function renderExcursions(excursions) {
    const grid = document.getElementById('excursionsGrid');
    
    if (excursions.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-gray-400">Aucun voyage trouvé.</div>`;
        return;
    }

    grid.innerHTML = excursions.map(ex => {
        // Nettoyage de l'URL
        const rawUrl = ex.image_url ? ex.image_url.trim() : null;
        
        let imageUrl = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'; // Par défaut
        
        if (rawUrl) {
            if (rawUrl.startsWith('http')) {
                imageUrl = rawUrl;
            } else if (rawUrl.startsWith('/uploads')) {
                imageUrl = `http://localhost:5000${rawUrl}`;
            }
        }

        return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
            <div class="h-48 overflow-hidden relative">
                <img src="${imageUrl}" 
                     alt="${ex.titre}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg font-bold text-forest-green text-sm shadow-sm">
                    ${ex.prix} DH
                </div>
                <div class="absolute top-4 left-4 bg-rose-pink text-white px-3 py-1 rounded-lg text-xs font-semibold">
                    ${ex.type}
                </div>
            </div>
            <div class="p-6">
                <h3 class="font-bold text-gray-900 text-lg mb-2">${ex.titre}</h3>
                <p class="text-gray-500 text-sm line-clamp-2 mb-4">${ex.description}</p>
                <div class="flex items-center gap-4 text-xs text-gray-400 mb-6">
                    <span><i class="fas fa-clock mr-1"></i> ${ex.duree || ex["durée"] || 'N/A'}</span>
                    <span><i class="fas fa-map-marker-alt mr-1"></i> ${ex.destination || ex.lieu || 'N/A'}</span>
                </div>
                <div class="flex gap-2 border-t border-gray-50 pt-4">
                    <button onclick="editExcursion(${ex.id})" class="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-semibold">
                        <i class="fas fa-pen mr-1"></i> Modifier
                    </button>
                    <button onclick="deleteExcursion(${ex.id})" class="w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `;}).join('');
}

async function handleFormSubmit(e) {
    // Empêche IMMÉDIATEMENT le rechargement de la page
    e.preventDefault();
    e.stopPropagation();
    
    // On affiche un loader
    Swal.fire({
        title: 'Enregistrement...',
        text: 'Veuillez patienter',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    const isEdit = id && id !== "";
    
    const url = isEdit ? `${API_URL}/admin/excursions/${id}` : `${API_URL}/admin/excursions`;

    try {
        const response = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            await Swal.fire({
                title: 'Succès !',
                text: isEdit ? 'Voyage modifié avec succès' : 'Nouveau voyage créé',
                icon: 'success',
                confirmButtonText: 'Super'
            });
            closeModal('addExcursionModal');
            fetchExcursions();
        } else {
            Swal.fire({
                title: 'Erreur',
                text: result.message || "Une erreur est survenue lors de l'enregistrement",
                icon: 'error',
                confirmButtonText: 'Réessayer'
            });
        }
    } catch (error) {
        console.error('Submit error:', error);
        Swal.fire({
            title: 'Erreur de connexion',
            text: "Impossible de joindre le serveur. Vérifiez votre connexion.",
            icon: 'error',
            confirmButtonText: 'Fermer'
        });
    }

    return false; // Sécurité supplémentaire pour empêcher le submit
}

window.openModal = (id) => {
    document.getElementById('modalTitle').textContent = 'Nouveau Voyage';
    document.getElementById('excursionForm').reset();
    document.getElementById('excursionId').value = '';
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.editExcursion = (id) => {
    const ex = allExcursions.find(e => e.id == id);
    if (!ex) return;

    // IMPORTANT : On ne doit PAS appeler openModal car il appelle reset()
    // On copie la logique d'ouverture manuellement
    document.getElementById('modalTitle').textContent = 'Modifier le Voyage';
    document.getElementById('excursionForm').reset();
    document.getElementById('excursionId').value = ex.id;
    
    const form = document.getElementById('excursionForm');
    form.titre.value = ex.titre;
    form.type.value = ex.type;
    form.prix.value = ex.prix;
    form.duree.value = ex.duree || ex["durée"] || '';
    form.ville_depart.value = ex.lieu || ''; // Dans la DB 'lieu' contient la ville de départ
    form.destination.value = ex.destination || '';
    form.description.value = ex.description;
    form.programme.value = ex.programme || '';
    form.places_total.value = ex.places_total || '';
    
    // Formatage des dates pour l'input type="date" (YYYY-MM-DD)
    if (ex.date_debut) form.date_debut.value = new Date(ex.date_debut).toISOString().split('T')[0];
    if (ex.date_fin) form.date_fin.value = new Date(ex.date_fin).toISOString().split('T')[0];

    form.image_url.value = ex.image_url || '';
    
    // Reset du champ file pour éviter de renvoyer l'ancien fichier
    document.getElementById('imageFile').value = '';

    const modal = document.getElementById('addExcursionModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.deleteExcursion = async (id) => {
    const ex = allExcursions.find(e => e.id == id);
    if (!ex) return;

    const result = await Swal.fire({
        title: `Supprimer "${ex.titre}" ?`,
        text: "Cette action est irréversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Oui, continuer',
        cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
        try {
            // Premier essai de suppression simple
            const response = await fetch(`${API_URL}/admin/excursions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire('Supprimé !', 'Le voyage a été supprimé.', 'success');
                fetchExcursions();
            } else if (data.hasReservations) {
                // Si des réservations existent, on ouvre le modal de notification
                document.getElementById('cancelMessage').value = `Bonjour,\n\nNous avons le regret de vous informer que l'excursion "${ex.titre}" prévue prochainement a été annulée pour des raisons techniques.\n\nNous vous contacterons prochainement pour le remboursement.\n\nL'équipe EcoTrips Women.`;
                openModal('cancelNotificationModal');
                
                // On attache l'événement de confirmation au bouton du modal
                document.getElementById('confirmRecursiveDelete').onclick = async () => {
                    const message = document.getElementById('cancelMessage').value;
                    
                    Swal.fire({ title: 'Traitement en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                    
                    try {
                        const recResponse = await fetch(`${API_URL}/admin/excursions/${id}/recursive`, {
                            method: 'DELETE',
                            headers: { 
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ message })
                        });
                        const recData = await recResponse.json();
                        
                        if (recData.success) {
                            closeModal('cancelNotificationModal');
                            Swal.fire('Succès', 'Les clients ont été informés et le voyage a été supprimé.', 'success');
                            fetchExcursions();
                        } else {
                            Swal.fire('Erreur', recData.message, 'error');
                        }
                    } catch (err) {
                        Swal.fire('Erreur', "Échec de l'opération récursive", 'error');
                    }
                };
            } else {
                Swal.fire('Erreur', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Erreur', "Impossible de contacter le serveur", 'error');
        }
    }
};

window.logout = () => {
    localStorage.removeItem('token');
    window.location.href = '../../login.html';
};