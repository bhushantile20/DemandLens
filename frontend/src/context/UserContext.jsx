import { createContext, useContext, useState, useCallback } from "react";

const DEFAULT_USER = {
  name: "Bhushan",
  email: "bhushan@inventoryai.com",
  role: "Administrator",
};

const STORAGE_KEY = "inventoryai_user";

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      saveUser(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("inventoryai_token");
    window.location.href = "/";
  }, []);

  return (
    <UserContext.Provider value={{ user, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
