const API_URL = 'http://localhost:5000/api';
let currentClients = [];

// Utilities
const showLoading = () => {
    document.getElementById('clientsTableBody').innerHTML = '';
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
};

const hideLoading = (isEmpty = false) => {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('emptyState').style.display = isEmpty ? 'flex' : 'none';
};

const fetchClients = async (query = '') => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../login.html';
            return;
        }

        showLoading();

        const response = await fetch(`${API_URL}/admin/clients?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erreur lors du chargement des clientes');

        const result = await response.json();
        
        if (result.success) {
            currentClients = result.clients;
            renderClients(result.clients);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Fetch error:', error);
        hideLoading(true);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Erreur de connexion',
            showConfirmButton: false,
            timer: 3000
        });
    }
};

const renderClients = (clients) => {
    const tbody = document.getElementById('clientsTableBody');
    
    if (clients.length === 0) {
        hideLoading(true);
        return;
    }

    hideLoading(false);

    tbody.innerHTML = clients.map((client, index) => `
        <tr class="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-none group">
            <td class="p-5 text-center text-sm text-gray-500 font-medium">#${index + 1}</td>
            <td class="p-5">
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full bg-rose-50 text-rose-pink flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm ring-1 ring-gray-100">
                        ${(client.nom ? client.nom.charAt(0) : '')}${(client.prenom ? client.prenom.charAt(0) : '')}
                    </div>
                    <div>
                        <div class="font-semibold text-gray-800">${client.nom} ${client.prenom || ''}</div>
                        <div class="text-xs text-gray-500 mt-0.5">ID: ${client.id}</div>
                    </div>
                </div>
            </td>
            <td class="p-5">
                <a href="mailto:${client.email}" class="text-gray-600 hover:text-rose-pink transition-colors text-sm flex items-center gap-2">
                    <i class="fas fa-envelope text-gray-400"></i> ${client.email}
                </a>
            </td>
            <td class="p-5">
                <span class="text-gray-600 text-sm font-medium">
                    ${client.telephone ? `<i class="fas fa-phone-alt text-gray-400 mr-2"></i> ${client.telephone}` : '-'}
                </span>
            </td>
            <td class="p-5 text-sm text-gray-600">
                ${new Date(client.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'short', day: 'numeric'
                })}
            </td>
            <td class="p-5 text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editClient('${client.id}')" 
                            class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                            title="Modifier">
                        <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button onclick="deleteClient('${client.id}')" 
                            class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"
                            title="Supprimer">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};

document.getElementById('searchInput').addEventListener('input', (e) => {
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        fetchClients(e.target.value);
    }, 500);
});

// Modals
window.openModal = (modalId) => {
    document.getElementById('modalTitle').textContent = 'Ajouter une Cliente';
    document.getElementById('passwordHint').style.display = 'none';
    const modal = document.getElementById(modalId);
    const content = document.getElementById(modalId + 'Content');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    // Animate in
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(modalId + 'Content');
    // Animate out
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if(modalId === 'addClientModal') {
            document.getElementById('addClientForm').reset();
        }
    }, 300);
};

document.getElementById('addClientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    const isEdit = clientData.id !== "";

    try {
        const token = localStorage.getItem('token');
        
        let url = `${API_URL}/admin/clients`;
        let method = 'POST';
        
        if (isEdit) {
            url = `${API_URL}/admin/clients/${clientData.id}`;
            method = 'PUT';
            if(!clientData.password) delete clientData.password;
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(clientData)
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: isEdit ? 'Cliente modifiée' : 'Cliente ajoutée',
                text: result.temporaryPassword 
                    ? `Mot de passe généré : ${result.temporaryPassword}` 
                    : (isEdit ? 'La cliente a été modifiée avec succès.' : 'La cliente a été créée avec succès.'),
                confirmButtonColor: '#166534'
            }).then(() => {
                closeModal('addClientModal');
                fetchClients(); // Refresh list
            });
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: error.message || 'Une erreur est survenue',
            confirmButtonColor: '#E91E63'
        });
    }
});

window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '../../login.html';
};

window.editClient = (id) => {
    const client = currentClients.find(c => c.id === parseInt(id));
    if(!client) return;

    document.getElementById('clientId').value = client.id;
    document.getElementById('nom').value = client.nom || '';
    document.getElementById('prenom').value = client.prenom || '';
    document.getElementById('email').value = client.email || '';
    document.getElementById('telephone').value = client.telephone || '';
    document.getElementById('password').value = '';
    
    document.getElementById('modalTitle').textContent = 'Modifier une Cliente';
    document.getElementById('passwordHint').style.display = 'block';

    const modal = document.getElementById('addClientModal');
    const content = document.getElementById('addClientModalContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
};

window.deleteClient = async (id) => {
    const { isConfirmed } = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: "Cette action est irréversible !",
        icon: 'warning',
        showCancelButton: true,
        confirmColor: '#E91E63',
        cancelButtonColor: '#9CA3AF',
        confirmButtonText: 'Oui, supprimer !',
        cancelButtonText: 'Annuler'
    });

    if (isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/clients/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    title: 'Supprimé !',
                    text: 'La cliente a été supprimée.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchClients();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            Swal.fire('Erreur', error.message || 'Impossible de supprimer cette cliente.', 'error');
        }
    }
};

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    fetchClients();
});
