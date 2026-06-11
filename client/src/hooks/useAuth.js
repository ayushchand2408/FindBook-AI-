import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useAuth(BASE_URL, setIsLoggedIn, setFavorites) {
  const navigate = useNavigate();

  // Check if cookie is still valid on mount — runs once only
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/favorites`, {
          credentials: "include"
        });
        if (res.ok) {
          setIsLoggedIn(true);
          const data = await res.json();
          setFavorites(data);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }

    setIsLoggedIn(false);
    setFavorites([]);
    navigate("/");
  };

  return { handleLogout };
}