// BookDetail page — fetches and displays full metadata for a single book.
// The :id param is the Google Books volume ID passed from the search results.

import { useNavigate , useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  // ── Fetch book details on mount / id change ──────────────────────────────────

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/book/${id}`);
        const data = await res.json();
        setBook(data);
      } catch (error) {
        console.error("Error fetching book details:", error);
      }
    };

    fetchBook();
  }, [id]);

  if (!book) return <h3 style={{ padding: "30px" }}>Loading...</h3>;

  const info = book.volumeInfo;
  const saleInfo = book.saleInfo;

  // ── Reading time calculation ──────────────────────────────────────────────────
  // Assumes 275 words/page and an average reading speed of 250 wpm.

  const wordsPerPage = 275;
  const readingSpeed = 250;

  const totalWords = (info.pageCount || 0) * wordsPerPage;
  const readingTimeMinutes = Math.round(totalWords / readingSpeed);

  const hours = Math.floor(readingTimeMinutes / 60);
  const minutes = readingTimeMinutes % 60;

  // ── Difficulty label based on page count ─────────────────────────────────────

  let difficulty = "Unknown";

  if (info.pageCount) {
    if (info.pageCount < 150) difficulty = "Easy Read";
    else if (info.pageCount <= 350) difficulty = "Medium Read";
    else difficulty = "Long Read";
  }

  // ── External buy / search links ───────────────────────────────────────────────

  const query = encodeURIComponent(`${info.title} ${info.authors?.[0] || ""}`);
  const amazonLink = `https://www.amazon.in/s?k=${query}`;
  const googleLink = `https://www.google.com/search?q=${query}+book`;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "40px" }}>

      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
          padding: "8px 15px",
          cursor: "pointer",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: "6px"
        }}
      >
        ← Back to Results
      </button>

      {/* Book title & cover */}
      <h2>{info.title}</h2>

      {info.imageLinks?.thumbnail && (
        <img
          src={info.imageLinks.thumbnail}
          alt="cover"
          style={{ margin: "20px 0" }}
        />
      )}

      {/* Core metadata */}
      <p><strong>Authors:</strong> {info.authors?.join(", ")}</p>
      <p><strong>Publisher:</strong> {info.publisher}</p>
      <p><strong>Published:</strong> {info.publishedDate}</p>
      <p><strong>Pages:</strong> {info.pageCount}</p>

      {/* Computed reading stats */}
      <p>
      <strong>Estimated Reading Time:</strong>{" "}
      {info.pageCount ? `${hours} hr ${minutes} min` : "Unknown"}
      </p>
      <p>
        <strong>Difficulty:</strong> {difficulty}
      </p>

      {/* Price — falls back to Amazon link if no Google Books price is available */}
      <p> 
        <strong>Price:</strong>{" "}
        {saleInfo?.listPrice ? (
          `${saleInfo.listPrice.amount} ${saleInfo.listPrice.currencyCode}`
        ) : (
          <a href={amazonLink} target="_blank" rel="noopener noreferrer">
            Check on Amazon
          </a>
        )}
      </p>

      {/* External links */}
      <div className="book-links">
        <h3>Find this Book</h3>

        <a href={amazonLink} target="_blank" rel="noopener noreferrer">
          🛒 Buy on Amazon
        </a>

        <br />

        <a href={googleLink} target="_blank" rel="noopener noreferrer">
          🔎 Search on Google
        </a>

        <br />

        {info.previewLink && (
          <a href={info.previewLink} target="_blank" rel="noopener noreferrer">
            📖 Read Preview on Google Books
          </a>
        )}
      </div>

      {/* Description rendered as HTML — Google Books API returns markup here */}
      <h2>Description</h2>
      {info.description && (
        <div dangerouslySetInnerHTML={{ __html: info.description }} />
      )}

    </div>
  );
}

export default BookDetail;
