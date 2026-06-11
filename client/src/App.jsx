import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

import BookDetail from "./BookDetail";
import BookFilter from "./BookFilter";
import Login from "./Login";
import Favorites from "./Favorites";

import { useAuth } from "./hooks/useAuth";
import { useFavorites } from "./hooks/useFavorites";
import { useBooks } from "./hooks/useBooks";

import "./App.css";

/* =========================================================
   HOME COMPONENT
   ========================================================= */
function Home({ isLoggedIn, setIsLoggedIn }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const { favorites, setFavorites, isSaved, toggleFavorite } = useFavorites(BASE_URL, isLoggedIn);
  const { handleLogout } = useAuth(BASE_URL, setIsLoggedIn, setFavorites);

  const {
    books,
    loading,
    error,
    mode,
    detectedText,
    selectedFile,
    setSelectedFile,
    personalized,
    trending,
    totalItems,
    searchQuery,
    setSearchQuery,
    page,
    resultsPerPage,
    handleSearch,
    handleUpload,
    getRandomBook,
    goToPrevPage,
    goToNextPage
  } = useBooks(BASE_URL, isLoggedIn);

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
            <button onClick={handleLogout}>Logout</button>
          )}
        </div>
      </nav>

      {/* ---------------- MAIN ACTION CARDS ---------------- */}
      <div className="container">
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

        <div className="card">
          <h3>📷 Upload Book Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button onClick={handleUpload}>Upload & Detect</button>
        </div>

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

        {/* SEARCH RESULTS */}
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

        {/* UPLOAD RESULTS */}
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

        {/* PERSONALIZED RECOMMENDATIONS */}
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

        {/* PAGINATION */}
        {mode === "search" && books.length > 0 && (
          <div className="pagination">
            <button disabled={page === 0} onClick={goToPrevPage}>
              ← Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              disabled={(page + 1) * resultsPerPage >= totalItems}
              onClick={goToNextPage}
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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