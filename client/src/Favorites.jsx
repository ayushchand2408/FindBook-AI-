// Favorites page — shows all books the logged-in user has saved.
// Fetches from the protected /api/favorites endpoint using HttpOnly cookie.
// Supports optimistic removal: the card disappears instantly on delete.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Favorites() {

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  // ── Fetch favorites on mount ─────────────────────────────────────────────────

  useEffect(() => {

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${BASE_URL}/api/favorites`, {
          credentials: "include" // sends cookie automatically, no token needed
        });

        // If cookie is missing or expired, redirect to login
        if (res.status === 401) {
          navigate("/login");
          return;
        }

        if (!res.ok) {
          setError("Failed to load favorites");
          return;
        }

        const data = await res.json();
        setBooks(data);

      } catch (err) {
        console.error("Fetch favorites failed:", err);
        setError("Something went wrong, please try again");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();

  }, []);

  // ── Remove a book from favorites ─────────────────────────────────────────────

  const removeFavorite = async (bookId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/favorite/${bookId}`, {
        method: "DELETE",
        credentials: "include" // sends cookie automatically
      });

      if (!res.ok) {
        console.error("Remove failed with status:", res.status);
        return;
      }

      // Update UI instantly
      setBooks((prev) => prev.filter((b) => b.bookId !== bookId));

    } catch (err) {
      console.error("Remove failed:", err);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.heading}>My Favorite Books ❤️</h2>
        <p style={styles.subheading}>
          {books.length > 0
            ? `${books.length} book${books.length > 1 ? "s" : ""} saved`
            : "No favorites yet"}
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <p style={{ color: "#888", textAlign: "center", marginTop: "60px" }}>
          Loading your books...
        </p>
      )}

      {/* Error state */}
      {error && (
        <p style={{ color: "#e05555", textAlign: "center", marginTop: "60px" }}>
          {error}
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && books.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <p style={styles.emptyText}>You haven't saved any books yet.</p>
          <p style={styles.emptyHint}>Search for books and hit ❤️ to save them here.</p>
        </div>
      )}

      {/* Book grid */}
      {!loading && !error && (
        <div style={styles.grid}>
          {books.map((book) => (
            <div key={book.bookId} style={styles.card}>

              {/* Cover */}
              <img
                src={book.thumbnail}
                width="80"
                alt={book.title}
                style={styles.cover}
              />

              {/* Info */}
              <div style={styles.info}>
                <p style={styles.title}>{book.title}</p>
              </div>

              {/* Remove button */}
              <button
                style={styles.removeBtn}
                onClick={() => removeFavorite(book.bookId)}
              >
                ❌ Remove
              </button>

            </div>
          ))}
        </div>
      )}

    </div>
  );

}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {

  page: {
    minHeight: "100vh",
    background: "#0f0f0f",
    padding: "48px 24px 60px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "36px",
    borderBottom: "1px solid #222",
    paddingBottom: "16px",
  },

  heading: {
    margin: "0 0 6px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#f0f0f0",
  },

  subheading: {
    margin: 0,
    fontSize: "13px",
    color: "#555",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    gap: "12px",
  },

  emptyIcon: {
    fontSize: "48px",
  },

  emptyText: {
    margin: 0,
    fontSize: "16px",
    color: "#666",
    fontWeight: "500",
  },

  emptyHint: {
    margin: 0,
    fontSize: "13px",
    color: "#444",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "border-color 0.2s",
  },

  cover: {
    width: "60px",
    height: "88px",
    objectFit: "cover",
    borderRadius: "6px",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },

  info: {
    flex: 1,
    overflow: "hidden",
  },

  title: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "500",
    color: "#f0f0f0",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  removeBtn: {
    flexShrink: 0,
    padding: "6px 12px",
    fontSize: "12px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#888",
    cursor: "pointer",
  },

};

export default Favorites;