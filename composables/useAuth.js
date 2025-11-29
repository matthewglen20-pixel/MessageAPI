import { ref } from "vue";

const API_BASE = "http://localhost:3000";

const accessToken = ref(localStorage.getItem("accessToken") || null);
const currentUser = ref(null);

let refreshTimeoutId = null;

function setSession(token) {
  accessToken.value = token;

  if (token) {
    localStorage.setItem("accessToken", token);
    startAutoRefresh();
  } else {
    localStorage.removeItem("accessToken");
    stopAutoRefresh();
  }
}

function clearSession() {
  accessToken.value = null;
  currentUser.value = null;
  localStorage.removeItem("accessToken");
  stopAutoRefresh();
}

function stopAutoRefresh() {
  if (refreshTimeoutId !== null) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }
}

function startAutoRefresh() {
  stopAutoRefresh();

  const REFRESH_INTERVAL = 55 * 60 * 1000;

  refreshTimeoutId = setTimeout(async () => {
    await refreshAccessToken();
    startAutoRefresh();
  }, REFRESH_INTERVAL);
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/api/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();

    if (!res.ok || !data.accessToken) {
      clearSession();
      return;
    }

    accessToken.value = data.accessToken;
    localStorage.setItem("accessToken", data.accessToken);
    console.log("Access token refreshed (useAuth)");
  } catch (err) {
    console.error("Refresh failed", err);
    clearSession();
  }
}

async function fetchCurrentUser() {
  if (!accessToken.value) return;

  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to load user");
    }

    currentUser.value = data.user;
  } catch (err) {
    console.error("Failed to fetch current user:", err);
  }
}

export function useAuth() {
  return {
    accessToken,
    currentUser,
    setSession,
    clearSession,
    refreshAccessToken,
    fetchCurrentUser,
  };
}
