// BookFilter page — lets users discover books by genre, author, and publish year.
// Queries the backend, then applies year-range filtering on the frontend because
// the Google Books API does not expose a native year filter parameter.

import React, { useState } from "react";
import "./BookFilter.css";
import { useNavigate, Link } from "react-router-dom";

// ── Static data ───────────────────────────────────────────────────────────────

const genres = [
  "Romance",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Horror",
  "Adventure",
  "Historical",
  "Biography",
  "Self Help",
  "Business",
  "Technology",
  "Health"
];

// ── Component ─────────────────────────────────────────────────────────────────

const BookPreferenceSearch = () => {

  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    genre: "",
    author: "",
    year: "",
    language: "en",
    freeOnly: false,
    order: "relevance",
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // Handles all input types including checkboxes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!filters.genre && !filters.author && !filters.year) {
        alert("Please select at least one filter");
        return;
    }

    let queryParts = [];

    if (filters.genre) {
        queryParts.push(`subject:${filters.genre}`);
    }

    if (filters.author) {
        queryParts.push(`inauthor:${filters.author}`);
    }

    // Year search (Google Books doesn't support direct year filter)
    // So we search normally and filter later
    let query = queryParts.length ? queryParts.join("+") : "books";

    try {
        setLoading(true);

        const res = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(query)}`
        );

        const data = await res.json();

        let results = data.items || [];
        console.log(data.items[0].volumeInfo.publishedDate);

        // Filter by year on the frontend
        if (filters.year) {
        results = results.filter((book) => {
            const publishedDate = book.volumeInfo?.publishedDate;

            if (!publishedDate) return false;

            const year = parseInt(publishedDate.substring(0, 4));

            switch (filters.year) {
            case "before2000":
                return year < 2000;

            case "2000to2010":
                return year >= 2000 && year <= 2010;

            case "2010to2020":
                return year >= 2010 && year <= 2020;

            case "after2020":
                return year > 2020;

            default:
                return true;
            }
        });
        }

        setBooks(results);

    } catch (err) {
        setError("Something went wrong");
    } finally {
        setLoading(false);
    }
  };

  // Disable the submit button until at least one filter has a value
  const isDisabled = !filters.genre && !filters.author && !filters.year;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="filter-page">

      {/* ── Branding ────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>📚</div>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#fff" }}>
          FindBook AI
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#555" }}>
          Filter books by your preferences
        </p>
      </div>

      {/* ── Filter Form ─────────────────────────────────────────────────────── */}
      <div className="filter-card">
        <h2>Find Books by Preference</h2>

        <form className="filter-form" onSubmit={handleSubmit}>

          <label>Genre</label>
          <select name="genre" value={filters.genre} onChange={handleChange}>
            <option value="">Select Genre</option>
            {genres.map((genre) => (
              <option key={genre} value={genre.toLowerCase()}>
                {genre}
              </option>
            ))}
          </select>

          <label>Author</label>
          <input
            type="text"
            name="author"
            placeholder="Optional author name"
            value={filters.author}
            onChange={handleChange}
          />

          {/* Year filter — applied client-side after API response */}
          <label>Published Year</label>
          <select name="year" value={filters.year} onChange={handleChange}>
            <option value="">Any</option>
            <option value="before2000">Before 2000</option>
            <option value="2000-2010">2000 - 2010</option>
            <option value="2010-2020">2010 - 2020</option>
            <option value="after2020">After 2020</option>
          </select>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="freeBooks"
              name="freeOnly"
              checked={filters.freeOnly}
              onChange={handleChange}
            />
            <label htmlFor="freeBooks">Free ebooks only</label>
          </div>

          <div className="filter-buttons">
            <button type="button" className="back-btn" onClick={() => window.history.back()}>
              ← Back
            </button>

            <button
              type="submit"
              className="search-btn"
              disabled={isDisabled}
            >
              Find Books
            </button>
          </div>

        </form>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <div className="results-container">

        <h3>Results</h3>

        {loading && <p style={{ color: "#888" }}>Loading books...</p>}
        {error && <p style={{ color: "#e05555" }}>{error}</p>}

        {!loading && books.length === 0 && (
          <p style={{ color: "#555", fontSize: "14px" }}>No books found</p>
        )}

        <div className="book-grid">
          {books.map((book) => (
            <div key={book.id} className="book-card">

              {book.volumeInfo.imageLinks?.thumbnail && (
                <img
                  src={book.volumeInfo.imageLinks.thumbnail}
                  alt="cover"
                />
              )}

              <Link
                to={`/book/${book.id}`}
                style={{ textDecoration: "none", color: "#f0f0f0" }}
              >
                <h4>{book.volumeInfo.title}</h4>
              </Link>

              <p>{book.volumeInfo.authors?.join(", ")}</p>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default BookPreferenceSearch;
