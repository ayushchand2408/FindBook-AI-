import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useSearchParams,
  useNavigate
} from "react-router-dom";

import BookDetail from "./BookDetail";
import BookFilter from "./BookFilter";
import Login from "./Login";
import Favorites from "./Favorites";

import "./App.css";

/* =========================================================
   HOME COMPONENT
   ========================================================= */
function Home({ isLoggedIn, setIsLoggedIn }) {

  /* -------------------- STATIC DATA -------------------- */
  const genres = [
    "fiction", "science", "history", "technology",
    "romance", "mystery", "self-help"
  ];

  const randomGenre = genres[Math.floor(Math.random() * genres.length)];

  /* -------------------- STATE -------------------- */
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedText, setDetectedText] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);
  const [totalItems, setTotalItems] = useState(0);

  const [mode, setMode] = useState("recommendation");

  const [favorites, setFavorites] = useState([]);
  const [personalized, setPersonalized] = useState([]);
  const [trending, setTrending] = useState([]);

  // Replaces localStorage token check — tracks login state properly
  

  const resultsPerPage = 10;
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  /* -------------------- HELPERS -------------------- */

  const isSaved = (bookId) => favorites.some((b) => b.bookId === bookId);

  /* -------------------- AUTH CHECK ON MOUNT -------------------- */
  // Pings a protected route to see if cookie is valid
  // No token reading, no localStorage — purely cookie-based

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
  },  [isLoggedIn]);

  /* -------------------- SEARCH -------------------- */

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setPage(0);
    setSubmittedQuery(searchQuery);
    setMode("search");
    setSearchParams({ q: searchQuery, page: 0 });
  };

  /* -------------------- FAVORITES -------------------- */

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

  /* -------------------- IMAGE UPLOAD -------------------- */

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/upload-book`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!res.ok) {
        alert("Image upload failed");
        return;
      }

      const data = await res.json();

      setDetectedText(data.detectedText || "");
      setBooks(data.books || []);
      setMode("upload");
      setSearchParams({});

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- RANDOM BOOK -------------------- */

  const getRandomBook = async () => {
    try {
      const randomIndex = Math.floor(Math.random() * 40);

      const res = await fetch(
        `${BASE_URL}/api/search?q=${randomGenre}&startIndex=${randomIndex}`,
        { credentials: "include" }
      );

      if (!res.ok) return;

      const data = await res.json();
      if (!data.items?.length) return;

      navigate(`/book/${data.items[0].id}`);
    } catch (err) {
      console.error("Random book failed:", err);
    }
  };

  /* -------------------- LOGOUT -------------------- */

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

  /* -------------------- EFFECTS -------------------- */

  // Fetch recommendations when in recommendation mode
  useEffect(() => {
    if (mode !== "recommendation" || !isLoggedIn) return;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${BASE_URL}/api/recommendations`, {
          credentials: "include"
        });

        if (!res.ok) return;

        const data = await res.json();
        setPersonalized(data.personalized || []);
        setTrending(data.trending || []);

      } catch (err) {
        console.error("Recommendations failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [mode, isLoggedIn]);

  // Fetch search results
  useEffect(() => {
    if (mode !== "search") return;

    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${BASE_URL}/api/search?q=${submittedQuery}&startIndex=${page * resultsPerPage}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          setError("Something went wrong.");
          return;
        }

        const data = await res.json();
        setTotalItems(data.totalItems || 0);
        setBooks(data.items || []);

      } catch (err) {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [mode, page, submittedQuery]);

  /* =========================================================
     UI RENDER
     ========================================================= */
  return (
    <div>
      {/* ---------------- NAVBAR ---------------- */}
      <nav className="navbar">
        <h2>FindBook AI 📚</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          {isLoggedIn && (
            <Link to="/favorites">
              <button>Favorites ❤️</button>
            </Link>
          )}

          {!isLoggedIn && (
            <Link to="/login">
              <button>Login</button>
            </Link>
          )}

          {isLoggedIn && (
            <button onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* ---------------- MAIN ACTION CARDS ---------------- */}
      <div className="container">

        {/* SEARCH */}
        <div className="card">
          <h3>🔍 Search by Name</h3>
          <input
            type="text"
            placeholder="Enter book name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button onClick={getRandomBook}>🎲 Surprise Me</button>
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>

        {/* UPLOAD */}
        <div className="card">
          <h3>📷 Upload Book Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button onClick={handleUpload}>Upload & Detect</button>
        </div>

        {/* FILTER */}
        <div className="card">
          <h3>🎯 Find by Preference</h3>
          <p>Don't know what to read? Use filters to discover books.</p>
          <Link to="/filter">
            <button>Open Filters</button>
          </Link>
        </div>

      </div>

      {/* ---------------- RESULTS ---------------- */}
      <div className="results-container">
        <h3>
          {mode === "search"
            ? "🔍 Search Results"
            : mode === "upload"
            ? "📷 Detected Books"
            : "📚 Recommendations"}
        </h3>

        {mode === "upload" && detectedText && (
          <p style={{ marginBottom: "16px", color: "#aaa", fontSize: "14px" }}>
            🔍 Detected: <strong style={{ color: "#fff" }}>{detectedText}</strong>
          </p>
        )}

        {loading && <p style={{ color: "#888" }}>Loading books...</p>}
        {error && <p style={{ color: "#e05555" }}>{error}</p>}

        {mode === "search" && !loading && books.length === 0 && !error && (
          <p style={{ fontSize: "16px", color: "#666", marginTop: "20px" }}>
            No books found for "<strong style={{ color: "#999" }}>{searchQuery}</strong>"
          </p>
        )}

        {/* ---------------- SEARCH RESULTS ---------------- */}
        {mode === "search" && (
          <div className="book-grid">
            {books.map((book) => {
              const info = book.volumeInfo || book;
              return (
                <div key={book.id} className="book-card">
                  {isSaved(book.id) && (
                    <span style={{ color: "#4caf50", fontSize: "11px", marginBottom: "6px" }}>
                      ✅ Saved
                    </span>
                  )}
                  {info.imageLinks?.thumbnail && (
                    <img src={info.imageLinks.thumbnail} alt="cover" />
                  )}
                  <Link to={`/book/${book.id}`}>
                    <h4>{info.title}</h4>
                  </Link>
                  <p>{info.authors?.join(", ")}</p>
                  <button onClick={() => toggleFavorite(book)}>
                    {isSaved(book.id) ? "💔 Remove" : "❤️ Save"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- UPLOAD RESULTS ---------------- */}
        {mode === "upload" && (
          <div className="book-grid">
            {books.map((book) => {
              const info = book.volumeInfo || book;
              return (
                <div key={book.id} className="book-card">
                  {info.imageLinks?.thumbnail && (
                    <img src={info.imageLinks.thumbnail} alt="cover" />
                  )}
                  <h4>{info.title}</h4>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- RECOMMENDATIONS ---------------- */}
        {mode === "recommendation" && personalized.length > 0 && (
          <>
            <h3>🔥 Recommended for You</h3>
            <div className="book-grid">
              {personalized.map((book) => {
                const info = book.volumeInfo || book;
                return (
                  <div key={book.id} className="book-card">
                    {info.imageLinks?.thumbnail && (
                      <img src={info.imageLinks.thumbnail} alt="cover" />
                    )}
                    <Link to={`/book/${book.id}`}>
                      <h4>{info.title}</h4>
                    </Link>
                    <p>{info.authors?.join(", ")}</p>
                    <button onClick={() => toggleFavorite(book)}>
                      {isSaved(book.id) ? "💔 Remove" : "❤️ Save"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TRENDING */}
        {mode === "recommendation" && trending.length > 0 && (
          <>
            <h3>📈 Trending Books</h3>
            <div className="book-grid">
              {trending.map((book) => {
                const info = book.volumeInfo || book;
                return (
                  <div key={book.id} className="book-card">
                    {info.imageLinks?.thumbnail && (
                      <img src={info.imageLinks.thumbnail} alt="cover" />
                    )}
                    <Link to={`/book/${book.id}`}>
                      <h4>{info.title}</h4>
                    </Link>
                    <p>{info.authors?.join(", ")}</p>
                    <button onClick={() => toggleFavorite(book)}>
                      {isSaved(book.id) ? "💔 Remove" : "❤️ Save"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ---------------- PAGINATION ---------------- */}
        {mode === "search" && books.length > 0 && (
          <div className="pagination">
            <button
              disabled={page === 0}
              onClick={() => {
                const newPage = page - 1;
                setPage(newPage);
                setSearchParams({ q: searchQuery, page: newPage });
              }}
            >
              ← Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              disabled={(page + 1) * resultsPerPage >= totalItems}
              onClick={() => {
                const newPage = page + 1;
                setPage(newPage);
                setSearchParams({ q: searchQuery, page: newPage });
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   APP ROUTES
   ========================================================= */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // move it here
  return (
    <Routes>
      <Route path="/" element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
      <Route path="/book/:id" element={<BookDetail />} />
      <Route path="/filter" element={<BookFilter />} />
      <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
      <Route path="/favorites" element={<Favorites />} />
    </Routes>
  );
}

export default App;