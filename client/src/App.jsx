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
   Handles:
   - Search
   - Upload (OCR-based detection)
   - Recommendations (personalized + trending)
   - Favorites (add/remove)
   ========================================================= */
function Home() {
  /* -------------------- STATIC DATA -------------------- */
  const genres = [
    "fiction",
    "science",
    "history",
    "technology",
    "romance",
    "mystery",
    "self-help"
  ];

  const randomGenre =
    genres[Math.floor(Math.random() * genres.length)];

  /* -------------------- STATE -------------------- */
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // File upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedText, setDetectedText] = useState("");

  // Search + pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const [submittedQuery, setSubmittedQuery] = useState(
    searchParams.get("q") || ""
  );
  const [page, setPage] = useState(
    Number(searchParams.get("page")) || 0
  );
  const [totalItems, setTotalItems] = useState(0);

  // Modes: recommendation | search | upload
  const [mode, setMode] = useState("recommendation");

  // Favorites
  const [favorites, setFavorites] = useState([]);

  // Recommendations
  const [personalized, setPersonalized] = useState([]);
  const [trending, setTrending] = useState([]);

  const resultsPerPage = 10;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* -------------------- HELPERS -------------------- */

  // Check if a book is already saved
  const isSaved = (bookId) => {
    return favorites.some((b) => b.bookId === bookId);
  };

  /* -------------------- SEARCH -------------------- */

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setPage(0);
    setSubmittedQuery(searchQuery);
    setMode("search");

    // Sync query with URL
    setSearchParams({
      q: searchQuery,
      page: 0
    });
  };

  /* -------------------- FAVORITES -------------------- */

  const toggleFavorite = async (book) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      // REMOVE from favorites
      if (isSaved(book.id)) {
        await fetch(
          `http://localhost:5000/api/favorite/${book.id}`,
          {
            method: "DELETE",
            headers: { Authorization: token }
          }
        );

        setFavorites((prev) =>
          prev.filter((b) => b.bookId !== book.id)
        );
      }
      // ADD to favorites
      else {
        // Fetch full book details
        const res = await fetch(
          `http://localhost:5000/api/book/${book.id}`
        );
        const fullBook = await res.json();
        const info = fullBook.volumeInfo;

        await fetch(
          "http://localhost:5000/api/favorite",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token
            },
            body: JSON.stringify({
              bookId: book.id,
              title: info.title,
              thumbnail:
                info.imageLinks?.thumbnail || "",
              authors: info.authors || [],
              categories: info.categories || []
            })
          }
        );

        // Update local state
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
      console.error(err);
    }
  };

  /* -------------------- IMAGE UPLOAD -------------------- */

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:5000/api/upload-book",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();

      console.log("Detected:", data.detectedText);
      console.log("Books:", data.books);

      setDetectedText(data.detectedText || "");
      setBooks(data.books || []);

      // Switch UI mode
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
    const randomIndex = Math.floor(Math.random() * 40);

    const res = await fetch(
      `http://localhost:5000/api/search?q=${randomGenre}&startIndex=${randomIndex}`
    );

    const data = await res.json();
    const randomBook = data.items[0];

    navigate(`/book/${randomBook.id}`);
  };

  /* -------------------- EFFECTS -------------------- */

  // Fetch favorites on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        "http://localhost:5000/api/favorites",
        {
          headers: { Authorization: token }
        }
      );

      const data = await res.json();
      setFavorites(data);
    };

    fetchFavorites();
  }, []);

  // Fetch recommendations
  useEffect(() => {
    if (mode !== "recommendation") return;

    const fetchRecommendations = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setLoading(true);

        const res = await fetch(
          "http://localhost:5000/api/recommendations",
          {
            headers: { Authorization: token }
          }
        );

        const data = await res.json();

        setPersonalized(data.personalized || []);
        setTrending(data.trending || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [mode]);

  // Fetch search results
  useEffect(() => {
    if (mode !== "search") return;

    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `http://localhost:5000/api/search?q=${submittedQuery}&startIndex=${
            page * resultsPerPage
          }`
        );

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
        <h2 style={{ margin: 0 }}>FindBook AI 📚</h2>

        {token && (
          <Link to="/favorites">
            <button>Favorites ❤️</button>
          </Link>
        )}

        {!token && (
          <Link to="/login">
            <button>Login</button>
          </Link>
        )}

        {token && (
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
              window.location.reload();
            }}
          >
            Logout
          </button>
        )}
      </nav>

      {/* ---------------- MAIN ACTION CARDS ---------------- */}
      <div className="container">
        {/* SEARCH */}
        <div className="card">
          <h3>Search Book by Name</h3>
          <input
            type="text"
            placeholder="Enter book name..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
          />
          <button onClick={getRandomBook}>
            🎲 Surprise Me
          </button>
          <button onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* UPLOAD */}
        <div className="card">
          <h3>Upload Book Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setSelectedFile(e.target.files[0])
            }
          />
          <button onClick={handleUpload}>
            Upload & Detect
          </button>
        </div>

        {/* FILTER */}
        <div className="card">
          <h3>Find Books by Preference</h3>
          <p>
            Don't know what to read? Use filters to
            discover books.
          </p>

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

        {/* OCR detected text */}
        {mode === "upload" && detectedText && (
          <p style={{ marginBottom: "10px" }}>
            🔍 Detected:{" "}
            <strong>{detectedText}</strong>
          </p>
        )}

        {loading && <p>Loading books...</p>}
        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        {/* Empty state */}
        {mode === "search" &&
          !loading &&
          books.length === 0 &&
          !error && (
            <p
              style={{
                fontSize: "18px",
                marginTop: "20px"
              }}
            >
              No books found for "
              <strong>{searchQuery}</strong>"
            </p>
          )}

        {/* ---------------- SEARCH RESULTS ---------------- */}
        {mode === "search" && (
          <div className="book-grid">
            {books.map((book) => {
              const info =
                book.volumeInfo || book;

              return (
                <div
                  key={book.id}
                  className="book-card"
                >
                  {isSaved(book.id) && (
                    <span
                      style={{
                        color: "green",
                        fontSize: "12px"
                      }}
                    >
                      ✅ Saved
                    </span>
                  )}

                  {info.imageLinks?.thumbnail && (
                    <img
                      src={
                        info.imageLinks.thumbnail
                      }
                      alt="cover"
                    />
                  )}

                  <Link
                    to={`/book/${book.id}`}
                  >
                    <h4>{info.title}</h4>
                  </Link>

                  <p>
                    {info.authors?.join(", ")}
                  </p>

                  <button
                    onClick={() =>
                      toggleFavorite(book)
                    }
                  >
                    {isSaved(book.id)
                      ? "💔 Remove"
                      : "❤️ Save"}
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
              const info =
                book.volumeInfo || book;

              return (
                <div
                  key={book.id}
                  className="book-card"
                >
                  {info.imageLinks?.thumbnail && (
                    <img
                      src={
                        info.imageLinks.thumbnail
                      }
                      alt="cover"
                    />
                  )}

                  <h4>{info.title}</h4>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- RECOMMENDATIONS ---------------- */}
        {mode === "recommendation" &&
          personalized.length > 0 && (
            <>
              <h3>🔥 Recommended for You</h3>
              <div className="book-grid">
                {personalized.map((book) => {
                  const info =
                    book.volumeInfo || book;

                  return (
                    <div
                      key={book.id}
                      className="book-card"
                    >
                      {info.imageLinks
                        ?.thumbnail && (
                        <img
                          src={
                            info.imageLinks
                              .thumbnail
                          }
                          alt="cover"
                        />
                      )}

                      <Link
                        to={`/book/${book.id}`}
                      >
                        <h4>{info.title}</h4>
                      </Link>

                      <p>
                        {info.authors?.join(", ")}
                      </p>

                      <button
                        onClick={() =>
                          toggleFavorite(book)
                        }
                      >
                        {isSaved(book.id)
                          ? "💔 Remove"
                          : "❤️ Save"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        {/* TRENDING */}
        {mode === "recommendation" &&
          trending.length > 0 && (
            <>
              <h3>📈 Trending Books</h3>
              <div className="book-grid">
                {trending.map((book) => {
                  const info =
                    book.volumeInfo || book;

                  return (
                    <div
                      key={book.id}
                      className="book-card"
                    >
                      {info.imageLinks
                        ?.thumbnail && (
                        <img
                          src={
                            info.imageLinks
                              .thumbnail
                          }
                          alt="cover"
                        />
                      )}

                      <Link
                        to={`/book/${book.id}`}
                      >
                        <h4>{info.title}</h4>
                      </Link>

                      <p>
                        {info.authors?.join(", ")}
                      </p>

                      <button
                        onClick={() =>
                          toggleFavorite(book)
                        }
                      >
                        {isSaved(book.id)
                          ? "💔 Remove"
                          : "❤️ Save"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        {/* ---------------- PAGINATION ---------------- */}
        {mode === "search" &&
          books.length > 0 && (
            <div className="pagination">
              <button
                disabled={page === 0}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  setSearchParams({
                    q: searchQuery,
                    page: newPage
                  });
                }}
              >
                Previous
              </button>

              <span>Page {page + 1}</span>

              <button
                disabled={
                  (page + 1) *
                    resultsPerPage >=
                  totalItems
                }
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  setSearchParams({
                    q: searchQuery,
                    page: newPage
                  });
                }}
              >
                Next
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
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/book/:id"
        element={<BookDetail />}
      />
      <Route
        path="/filter"
        element={<BookFilter />}
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/favorites"
        element={<Favorites />}
      />
    </Routes>
  );
}

export default App;