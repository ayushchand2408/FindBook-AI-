// Favorites page — shows all books the logged-in user has saved.
// Fetches from the protected /api/favorites endpoint using the stored JWT.
// Supports optimistic removal: the card disappears instantly on delete.

import { useEffect, useState } from "react";

function Favorites() {

  const [books, setBooks] = useState([]);

  // ── Fetch favorites on mount ─────────────────────────────────────────────────

  useEffect(() => {

    const fetchFavorites = async () => {

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: {
          Authorization: token
        }
      });

      const data = await res.json();

      console.log("Favorites:", data); // 🔴 IMPORTANT DEBUG

      setBooks(data);

    };

    fetchFavorites();

  }, []);

  // ── Remove a book from favorites ─────────────────────────────────────────────
  // Calls DELETE endpoint, then filters the book out of local state immediately.

  const removeFavorite = async (bookId) => {
    const token = localStorage.getItem("token");

    try {
      await fetch(`http://localhost:5000/api/favorite/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: token
        }
      });

      // ✅ update UI instantly
      setBooks((prev) => prev.filter((b) => b.bookId !== bookId));

    } catch (err) {
      console.error("Remove failed", err);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>

      <h2>My Favorite Books ❤️</h2>

      {books.length === 0 && <p>No favorites yet</p>}

      {books.map((book) => (
        <div key={book.bookId} style={{ marginBottom: "15px" }}>
          <img src={book.thumbnail} width="80" />
          <p>{book.title}</p>

          <button onClick={() => removeFavorite(book.bookId)}>
            ❌ Remove
          </button>
        </div>
      ))}

    </div>
  );

}

export default Favorites;
