import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_BASE = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
}/api`;

const TOKEN_KEY = "token";
const USER_KEY = "user";

// =====================================================
// STORAGE HELPERS
// =====================================================

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("Stored user parse error:", error);

    localStorage.removeItem(USER_KEY);

    return null;
  }
}

function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Remove old token format if it exists.
  localStorage.removeItem("accessToken");
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("accessToken");
  localStorage.removeItem(USER_KEY);
}

function notifyAuthChanged() {
  window.dispatchEvent(
    new Event("homefoods-auth-changed")
  );
}

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------
  // LOAD CURRENT USER
  // ---------------------------------------------------

  const loadCurrentUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/auth/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.user
      ) {
        clearSession();
        setUser(null);
        return;
      }

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(data.user)
      );

      setUser(data.user);
    } catch (error) {
      console.error(
        "❌ Auth restore error:",
        error
      );

      // Keep stored user temporarily if the backend
      // is unavailable.
      setUser(getStoredUser());
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------
  // INITIAL AUTH CHECK
  // ---------------------------------------------------

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // ---------------------------------------------------
  // LOGIN
  // ---------------------------------------------------

  const login = useCallback(
    async (identifier, password) => {
      const response = await fetch(
        `${API_BASE}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      saveSession(
        data.token,
        data.user
      );

      setUser(data.user);

      notifyAuthChanged();

      return data;
    },
    []
  );

  // ---------------------------------------------------
  // REGISTER
  // ---------------------------------------------------

  const register = useCallback(
    async (payload) => {
      const response = await fetch(
        `${API_BASE}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      saveSession(
        data.token,
        data.user
      );

      setUser(data.user);

      notifyAuthChanged();

      return data;
    },
    []
  );

  // ---------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------

  const logout = useCallback(() => {
    clearSession();

    setUser(null);

    notifyAuthChanged();
  }, []);

  // ---------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------

  const isAuthenticated =
    Boolean(user && getToken());

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      loadCurrentUser,
    }),
    [
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      loadCurrentUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}