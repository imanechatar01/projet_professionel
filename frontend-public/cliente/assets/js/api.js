(function () {
  function getConfig() {
    return window.APP_CONFIG || {
      API_BASE_URL: "http://localhost:5000/api",
      STORAGE_KEYS: {
        CLIENT_TOKEN: "clientToken",
        CLIENT_DATA: "client"
      },
      ENDPOINTS: {
        CLIENT_LOGIN: "/client/login",
        CLIENT_REGISTER: "/client/register",
        CLIENT_PROFILE: "/client/me",
        EXCURSIONS: "/excursions",
        RESERVATIONS: "/reservations"
      }
    };
  }

  function getToken() {
    const config = getConfig();
    return localStorage.getItem(config.STORAGE_KEYS.CLIENT_TOKEN);
  }

  async function request(path, options = {}) {
    const config = getConfig();

    const {
      method = "GET",
      body = null,
      auth = false,
      headers = {}
    } = options;

    const finalHeaders = {
      "Content-Type": "application/json",
      ...headers
    };

    if (auth) {
      const token = getToken();

      if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${config.API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : null
    });

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      const message = data.message || "Erreur serveur";
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  async function loginClient(email, password) {
    const config = getConfig();

    return request(config.ENDPOINTS.CLIENT_LOGIN, {
      method: "POST",
      body: { email, password }
    });
  }

  async function registerClient(payload) {
    const config = getConfig();

    return request(config.ENDPOINTS.CLIENT_REGISTER, {
      method: "POST",
      body: payload
    });
  }

  async function getExcursions() {
    const config = getConfig();

    return request(config.ENDPOINTS.EXCURSIONS);
  }

  async function getExcursionById(id) {
    const config = getConfig();

    return request(`${config.ENDPOINTS.EXCURSIONS}/${id}`);
  }

  async function createReservation(payload) {
    const config = getConfig();

    return request(config.ENDPOINTS.RESERVATIONS, {
      method: "POST",
      auth: true,
      body: payload
    });
  }

  async function getClientProfile() {
    const config = getConfig();

    return request(config.ENDPOINTS.CLIENT_PROFILE, {
      method: "GET",
      auth: true
    });
  }

  window.ApiClient = {
    request,
    loginClient,
    registerClient,
    getExcursions,
    getExcursionById,
    createReservation,
    getClientProfile
  };
})();