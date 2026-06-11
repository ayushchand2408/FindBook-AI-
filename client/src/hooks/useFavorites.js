import { useState } from "react";

export function useFavorites(BASE_URL, isLoggedIn) {
  const [favorites, setFavorites] = useState([]);

  const isSaved = (bookId) => favorites.some((b) => b.bookId === bookId);

  const toggleFavorite = async (book) => {
    if (!isLoggedIn) {
      alert("Please login first");
      return;
    }

    try {
      if (isSaved(book.id)) {
        // REMOVE
        const res = await fetch(`${BASE_URL}/api/favorite/${book.id}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (!res.ok) {
          console.error("Remove failed:", res.status);
          return;
        }

        setFavorites((prev) => prev.filter((b) => b.bookId !== book.id));

      } else {
        // ADD — fetch full book details first
        const res = await fetch(`${BASE_URL}/api/book/${book.id}`, {
          credentials: "include"
        });

        if (!res.ok) {
          console.error("Book fetch failed:", res.status);
          return;
        }

        const fullBook = await res.json();
        const info = fullBook.volumeInfo;

        const saveRes = await fetch(`${BASE_URL}/api/favorite`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            title: info.title,
            thumbnail: info.imageLinks?.thumbnail || "",
            authors: info.authors || [],
            categories: info.categories || []
          })
        });

        if (!saveRes.ok) {
          console.error("Save failed:", saveRes.status);
          return;
        }

        setFavorites((prev) => [
          ...prev,
          {
            bookId: book.id,
            title: info.title,
            thumbnail: info.imageLinks?.thumbnail,
            authors: info.authors
          }
        ]);
      }
    } catch (err) {
      console.error("Toggle favorite failed:", err);
    }
  };

  return { favorites, setFavorites, isSaved, toggleFavorite };
}