(function () {
  function config() {
    return window.APP_CONFIG;
  }

  function getToken() {
    return localStorage.getItem(config().STORAGE_KEYS.CLIENT_TOKEN);
  }

  function getClient() {
    try {
      return JSON.parse(
        localStorage.getItem(config().STORAGE_KEYS.CLIENT_DATA) || "{}"
      );
    } catch (error) {
      return {};
    }
  }

  function setSession(token, client) {
    localStorage.setItem(config().STORAGE_KEYS.CLIENT_TOKEN, token);
    localStorage.setItem(
      config().STORAGE_KEYS.CLIENT_DATA,
      JSON.stringify(client || {})
    );
  }

  function clearSession() {
    localStorage.removeItem(config().STORAGE_KEYS.CLIENT_TOKEN);
    localStorage.removeItem(config().STORAGE_KEYS.CLIENT_DATA);
  }

  function isAuthenticated() {
    return Boolean(getToken());
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = config().ROUTES.LOGIN;
      return false;
    }

    return true;
  }

  function redirectAfterAuth() {
    window.location.href = config().ROUTES.CATALOGUE;
  }

  function showError(message) {
    const errorDiv = document.getElementById("errorMsg");
    const successDiv = document.getElementById("successMsg");

    if (successDiv) {
      successDiv.style.display = "none";
    }

    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
  }

  function showSuccess(message) {
    const errorDiv = document.getElementById("errorMsg");
    const successDiv = document.getElementById("successMsg");

    if (errorDiv) {
      errorDiv.style.display = "none";
    }

    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = "block";
    }
  }

  function setupLoginForm() {
    const form = document.getElementById("loginForm");

    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      try {
        const data = await window.ApiClient.loginClient(email, password);

        if (data.success) {
          setSession(data.token, data.client);

          showSuccess("Connexion réussie ! Redirection vers les voyages...");

          setTimeout(function () {
            redirectAfterAuth();
          }, 1200);
        } else {
          showError(data.message || "Email ou mot de passe incorrect");
        }
      } catch (error) {
        showError(error.message || "Erreur de connexion au serveur");
      }
    });
  }

  function setupRegisterForm() {
    const form = document.getElementById("registerForm");

    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nom = document.getElementById("nom").value.trim();
      const prenom = document.getElementById("prenom").value.trim();
      const email = document.getElementById("email").value.trim();
      const telephone = document.getElementById("telephone").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (!nom) {
        showError("Le nom est requis");
        return;
      }

      if (!email) {
        showError("L'email est requis");
        return;
      }

      if (!email.includes("@")) {
        showError("Email invalide");
        return;
      }

      if (!password) {
        showError("Le mot de passe est requis");
        return;
      }

      if (password.length < 6) {
        showError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }

      if (password !== confirmPassword) {
        showError("Les mots de passe ne correspondent pas");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Inscription en cours...";
      }

      try {
        const data = await window.ApiClient.registerClient({
          nom: nom,
          prenom: prenom || null,
          email: email,
          telephone: telephone || null,
          password: password
        });

        if (data.success) {
          setSession(data.token, data.client);

          showSuccess("Inscription réussie ! Redirection vers les voyages...");

          setTimeout(function () {
            redirectAfterAuth();
          }, 1200);
        } else {
          showError(data.message || "Erreur lors de l'inscription");
        }
      } catch (error) {
        showError(
          error.message ||
            "Erreur de connexion au serveur. Vérifie que le backend est démarré."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Créer mon compte";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupLoginForm();
    setupRegisterForm();
  });

  window.Auth = {
    getToken: getToken,
    getClient: getClient,
    setSession: setSession,
    clearSession: clearSession,
    isAuthenticated: isAuthenticated,
    requireAuth: requireAuth
  };
})();

// frontend-public/assets/js/auth.js
function updateNavForClient() {
  const token = localStorage.getItem('clientToken');
  const client = JSON.parse(localStorage.getItem('client') || '{}');
  
  // Lien "Réserver" dans la barre de navigation
  const ctaLink = document.querySelector('.nav-cta');
  if (ctaLink) {
    if (token && client.nom) {
      ctaLink.textContent = `👤 ${client.nom}`;
      ctaLink.href = 'profil.html';
      ctaLink.classList.add('nav-profile');
    } else {
      ctaLink.textContent = 'Réserver';
      ctaLink.href = 'login.html';
      ctaLink.classList.remove('nav-profile');
    }
  }

  // Menu mobile
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    let loginLink = Array.from(mobileMenu.querySelectorAll('a')).find(a => a.textContent === 'Espace client' || a.href.includes('login.html'));
    if (token && client.nom) {
      if (loginLink) {
        loginLink.textContent = `Mon profil (${client.nom})`;
        loginLink.href = 'profil.html';
      }
      // Cacher le bouton "Voir les voyages" si tu veux (optionnel)
      const mobCta = mobileMenu.querySelector('.mob-cta');
      if (mobCta) mobCta.style.display = 'none';
    } else {
      if (loginLink && loginLink.textContent.includes('Mon profil')) {
        loginLink.textContent = 'Espace client';
        loginLink.href = 'login.html';
      }
    }
  }
}

// Exécuter au chargement de la page
document.addEventListener('DOMContentLoaded', updateNavForClient);