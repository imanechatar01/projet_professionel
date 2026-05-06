document.addEventListener('DOMContentLoaded', () => {
    // 1. Vérification du Token Admin
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../login.html'; // Redirige si non connecté
        return;
    }

    const API_BASE = 'http://localhost:5000';
    
    // Elements DOM
    const galleryContainer = document.getElementById('galleryContainer');
    const uploadForm = document.getElementById('uploadForm');
    const messageBox = document.getElementById('messageBox');
    const submitBtn = document.getElementById('submitBtn');

    // Affichage des messages flash
    function showMessage(msg, type = 'success') {
        messageBox.innerHTML = `<div class="alert ${type}">${msg}</div>`;
        setTimeout(() => messageBox.innerHTML = '', 4000);
    }

    // Variables d'état
    let currentPage = 1;
    const limit = 6;
    let currentSearch = '';
    let currentCategorie = 'toutes';

    const searchInput = document.getElementById('searchInput');
    const filterCategorie = document.getElementById('filterCategorie');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    // 2. Fetch GET : Obtenir les images de la galerie
    async function loadGallery() {
        try {
            const res = await fetch(`${API_BASE}/api/galerie?page=${currentPage}&limit=${limit}&titre=${encodeURIComponent(currentSearch)}&categorie=${currentCategorie}`);
            if (!res.ok) throw new Error("Erreur de récupération.");
            
            const responseData = await res.json();
            const images = responseData.data || responseData; 
            
            if (images.length === 0) {
                galleryContainer.innerHTML = '<p style="grid-column: 1/-1;">Aucune image trouvée.</p>';
            } else {
                // Générer le HTML pour chaque image
                galleryContainer.innerHTML = images.map(img => `
                    <div class="gallery-item">
                        <img src="${API_BASE}/uploads/${img.image_url}" alt="${img.titre}">
                        <div class="gallery-info">
                            <div class="gallery-title">${img.titre}</div>
                            <div class="gallery-desc">${img.description || 'Sans description.'}</div>
                            <button class="delete-btn" onclick="deleteImage(${img.id})">Supprimer</button>
                        </div>
                    </div>
                `).join('');
            }

            // Gestion de l'affichage de la pagination
            if(responseData.pagination) {
                const p = responseData.pagination;
                pageInfo.textContent = `Page ${p.currentPage} / ${p.totalPages || 1}`;
                prevBtn.disabled = p.currentPage <= 1;
                nextBtn.disabled = p.currentPage >= p.totalPages || p.totalPages === 0;
            }

        } catch (err) {
            console.error(err);
            galleryContainer.innerHTML = '<p style="color:red; grid-column: 1/-1;">Erreur lors du chargement des images.</p>';
        }
    }

    // Event Listeners Pagination et Recherche
    if(searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = e.target.value;
                currentPage = 1; // reset page à la recherche
                loadGallery();
            }, 400);
        });
    }

    if(filterCategorie) {
        filterCategorie.addEventListener('change', (e) => {
            currentCategorie = e.target.value;
            currentPage = 1;
            loadGallery();
        });
    }

    if(prevBtn) prevBtn.addEventListener('click', () => { if(currentPage > 1) { currentPage--; loadGallery(); } });
    if(nextBtn) nextBtn.addEventListener('click', () => { currentPage++; loadGallery(); });

    // 3. Fetch POST : Ajouter une image
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        const formData = new FormData();
        formData.append('titre', document.getElementById('titre').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('categorie', document.getElementById('categorie').value);
        formData.append('image', document.getElementById('image').files[0]);

        try {
            const res = await fetch(`${API_BASE}/api/galerie/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // Token requis par le backend via jwt auth
                },
                body: formData // Pas de Content-Type manuel pour FormData
            });

            const data = await res.json();
            
            if (res.ok) {
                showMessage('Image ajoutée avec succès !');
                uploadForm.reset();
                loadGallery(); // Recharger la galerie
            } else {
                showMessage(data.error || 'Erreur lors de l\'ajout', 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage('Erreur de connexion au serveur.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Mettre en ligne';
        }
    });

    // 4. Fetch DELETE : Supprimer une image
    window.deleteImage = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

        try {
            const res = await fetch(`${API_BASE}/api/galerie/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` // Token requis
                }
            });

            if (res.ok) {
                showMessage('Image supprimée de la galerie.');
                loadGallery();
            } else {
                const data = await res.json();
                showMessage(data.error || 'Erreur lors de la suppression', 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage('Erreur serveur lors de la suppression.', 'error');
        }
    };

    // Chargement initial
    loadGallery();
});
