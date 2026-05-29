document.addEventListener("DOMContentLoaded", () => {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken");

    if (!token) {
        window.location.href = "../../login.html";
        return;
    }

    const API_BASE = "http://localhost:5000";

    const galleryContainer = document.getElementById("galleryContainer");
    const uploadForm = document.getElementById("uploadForm");
    const messageBox = document.getElementById("messageBox");
    const submitBtn = document.getElementById("submitBtn");

    const searchInput = document.getElementById("searchInput");
    const filterCategorie = document.getElementById("filterCategorie");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pageInfo = document.getElementById("pageInfo");

    let currentPage = 1;
    const limit = 6;
    let currentSearch = "";
    let currentCategorie = "toutes";

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value || "";
        return div.innerHTML;
    }

    function showMessage(msg, type = "success") {
        if (!messageBox) return;

        messageBox.innerHTML = `
            <div class="alert ${type}">
                ${escapeHtml(msg)}
            </div>
        `;

        setTimeout(() => {
            messageBox.innerHTML = "";
        }, 4000);
    }

    function getImageUrl(imageUrl) {
        if (!imageUrl) {
            return "https://via.placeholder.com/600x400?text=EcoTrips+Women";
        }

        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            return imageUrl;
        }

        if (imageUrl.startsWith("/uploads/")) {
            return `${API_BASE}${imageUrl}`;
        }

        if (imageUrl.startsWith("uploads/")) {
            return `${API_BASE}/${imageUrl}`;
        }

        return `${API_BASE}/uploads/${imageUrl}`;
    }

    function setPaginationDisabled(isDisabled) {
        if (prevBtn) prevBtn.disabled = isDisabled;
        if (nextBtn) nextBtn.disabled = isDisabled;
    }

    async function loadGallery() {
        try {
            if (galleryContainer) {
                galleryContainer.innerHTML = `
                    <div class="col-span-full text-center py-12 text-gray-400">
                        <i class="fas fa-spinner fa-spin text-rose-pink text-2xl mb-3"></i>
                        <p>Chargement des images...</p>
                    </div>
                `;
            }

            setPaginationDisabled(true);

            const url =
                `${API_BASE}/api/galerie` +
                `?page=${currentPage}` +
                `&limit=${limit}` +
                `&titre=${encodeURIComponent(currentSearch)}` +
                `&categorie=${encodeURIComponent(currentCategorie)}`;

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error("Erreur de récupération.");
            }

            const responseData = await res.json();

            const images =
                responseData.data ||
                responseData.images ||
                responseData.galerie ||
                responseData.results ||
                responseData ||
                [];

            if (!Array.isArray(images) || images.length === 0) {
                galleryContainer.innerHTML = `
                    <div class="col-span-full text-center py-14 text-gray-400">
                        <div class="w-16 h-16 rounded-2xl bg-gray-50 mx-auto mb-4 flex items-center justify-center text-2xl">
                            <i class="fas fa-image"></i>
                        </div>
                        <p class="font-semibold">Aucune image trouvée.</p>
                    </div>
                `;
            } else {
                galleryContainer.innerHTML = images.map((img) => {
                    const imageUrl = getImageUrl(img.image_url || img.image || img.url);

                    return `
                        <article class="gallery-item">
                            <img src="${imageUrl}" alt="${escapeHtml(img.titre || "Photo")}">

                            <div class="gallery-info">
                                <div class="gallery-title">
                                    ${escapeHtml(img.titre || "Photo")}
                                </div>

                                <div class="gallery-desc">
                                    ${escapeHtml(img.description || "Sans description.")}
                                </div>

                                <div class="text-xs font-bold text-rose-pink mb-3">
                                    ${escapeHtml(img.categorie || "principale")}
                                </div>

                                <button class="delete-btn" onclick="deleteImage(${img.id})">
                                    <i class="fas fa-trash mr-1"></i>
                                    Supprimer
                                </button>
                            </div>
                        </article>
                    `;
                }).join("");
            }

            if (responseData.pagination) {
                const p = responseData.pagination;

                if (pageInfo) {
                    pageInfo.textContent = `Page ${p.currentPage || currentPage} / ${p.totalPages || 1}`;
                }

                if (prevBtn) {
                    prevBtn.disabled = (p.currentPage || currentPage) <= 1;
                }

                if (nextBtn) {
                    nextBtn.disabled =
                        (p.currentPage || currentPage) >= (p.totalPages || 1) ||
                        (p.totalPages || 0) === 0;
                }
            } else {
                if (pageInfo) pageInfo.textContent = `Page ${currentPage}`;
                if (prevBtn) prevBtn.disabled = currentPage <= 1;
                if (nextBtn) nextBtn.disabled = !Array.isArray(images) || images.length < limit;
            }
        } catch (err) {
            console.error(err);

            if (galleryContainer) {
                galleryContainer.innerHTML = `
                    <div class="col-span-full text-center py-14 text-red-500">
                        <i class="fas fa-triangle-exclamation text-2xl mb-3"></i>
                        <p>Erreur lors du chargement des images.</p>
                    </div>
                `;
            }

            setPaginationDisabled(true);
        }
    }

    if (searchInput) {
        let debounceTimer;

        searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                currentSearch = e.target.value.trim();
                currentPage = 1;
                loadGallery();
            }, 400);
        });
    }

    if (filterCategorie) {
        filterCategorie.addEventListener("change", (e) => {
            currentCategorie = e.target.value;
            currentPage = 1;
            loadGallery();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                loadGallery();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentPage++;
            loadGallery();
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const titre = document.getElementById("titre")?.value.trim();
            const description = document.getElementById("description")?.value.trim();
            const categorie = document.getElementById("categorie")?.value;
            const imageInput = document.getElementById("image");
            const imageFile = imageInput?.files?.[0];

            if (!titre) {
                showMessage("Le titre est obligatoire.", "error");
                return;
            }

            if (!imageFile) {
                showMessage("Veuillez choisir une image.", "error");
                return;
            }

            if (!categorie) {
                showMessage("Veuillez choisir une catégorie.", "error");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Envoi en cours...
                `;
            }

            const formData = new FormData();
            formData.append("titre", titre);
            formData.append("description", description || "");
            formData.append("categorie", categorie);
            formData.append("image", imageFile);

            try {
                const res = await fetch(`${API_BASE}/api/galerie/add`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    showMessage("Image ajoutée avec succès !");
                    uploadForm.reset();
                    currentPage = 1;
                    await loadGallery();
                } else {
                    showMessage(data.error || data.message || "Erreur lors de l'ajout.", "error");
                }
            } catch (err) {
                console.error(err);
                showMessage("Erreur de connexion au serveur.", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `
                        <i class="fas fa-cloud-arrow-up"></i>
                        Mettre en ligne
                    `;
                }
            }
        });
    }

    window.deleteImage = async (id) => {
        if (!confirm("Êtes-vous sûre de vouloir supprimer cette image ?")) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/galerie/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                showMessage("Image supprimée de la galerie.");
                await loadGallery();
            } else {
                showMessage(data.error || data.message || "Erreur lors de la suppression.", "error");
            }
        } catch (err) {
            console.error(err);
            showMessage("Erreur serveur lors de la suppression.", "error");
        }
    };

    loadGallery();
});