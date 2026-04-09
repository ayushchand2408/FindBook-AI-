// BookDetail page — fetches and displays full metadata for a single book.
// The :id param is the Google Books volume ID passed from the search results.

import { useNavigate, useParams } from "react-router-dom";
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

  if (!book) return (
    <div style={styles.page}>
      <p style={styles.loading}>Loading...</p>
    </div>
  );

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
    <div style={styles.page}>

      {/* Back button */}
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back to Results
      </button>

      {/* ── Hero Section: cover + core info side by side ── */}
      <div style={styles.hero}>

        {info.imageLinks?.thumbnail && (
          <img
            src={info.imageLinks.thumbnail}
            alt="cover"
            style={styles.cover}
          />
        )}

        <div style={styles.heroInfo}>
          <h2 style={styles.title}>{info.title}</h2>

          <p style={styles.meta}><span style={styles.metaLabel}>Authors</span> {info.authors?.join(", ")}</p>
          <p style={styles.meta}><span style={styles.metaLabel}>Publisher</span> {info.publisher}</p>
          <p style={styles.meta}><span style={styles.metaLabel}>Published</span> {info.publishedDate}</p>
          <p style={styles.meta}><span style={styles.metaLabel}>Pages</span> {info.pageCount}</p>

          {/* Computed reading stats */}
          <p style={styles.meta}>
            <span style={styles.metaLabel}>Reading Time</span>
            {info.pageCount ? `${hours} hr ${minutes} min` : "Unknown"}
          </p>
          <p style={styles.meta}>
            <span style={styles.metaLabel}>Difficulty</span>
            <span style={styles.badge}>{difficulty}</span>
          </p>

          {/* Price */}
          <p style={styles.meta}>
            <span style={styles.metaLabel}>Price</span>
            {saleInfo?.listPrice ? (
              `${saleInfo.listPrice.amount} ${saleInfo.listPrice.currencyCode}`
            ) : (
              <a href={amazonLink} target="_blank" rel="noopener noreferrer" style={styles.link}>
                Check on Amazon
              </a>
            )}
          </p>
        </div>

      </div>

      {/* ── Find this Book ── */}
      <div style={styles.linksSection}>
        <h3 style={styles.sectionTitle}>Find this Book</h3>
        <div style={styles.linksRow}>
          <a href={amazonLink} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
            🛒 Buy on Amazon
          </a>
          <a href={googleLink} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
            🔎 Search on Google
          </a>
          {info.previewLink && (
            <a href={info.previewLink} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
              📖 Preview on Google Books
            </a>
          )}
        </div>
      </div>

      {/* ── Description — rendered as HTML because the Google Books API returns markup ── */}
      {info.description && (
        <div style={styles.descSection}>
          <h3 style={styles.sectionTitle}>Description</h3>
          <div
            style={styles.description}
            dangerouslySetInnerHTML={{ __html: info.description }}
          />
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
    padding: "40px 48px 60px",
    maxWidth: "860px",
    margin: "0 auto",
    color: "#f0f0f0",
  },

  loading: {
    color: "#555",
    fontSize: "16px",
    marginTop: "40px",
  },

  backBtn: {
    marginBottom: "32px",
    padding: "8px 16px",
    cursor: "pointer",
    background: "transparent",
    color: "#aaa",
    border: "1px solid #333",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "background 0.2s, color 0.2s",
  },

  // Hero: cover image + metadata side by side
  hero: {
    display: "flex",
    gap: "36px",
    alignItems: "flex-start",
    marginBottom: "40px",
    padding: "28px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "16px",
  },

  cover: {
    width: "130px",
    height: "190px",
    objectFit: "cover",
    borderRadius: "10px",
    flexShrink: 0,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  },

  heroInfo: {
    flex: 1,
  },

  title: {
    margin: "0 0 20px",
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: "1.3",
  },

  meta: {
    margin: "0 0 10px",
    fontSize: "14px",
    color: "#ccc",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  metaLabel: {
    minWidth: "110px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  badge: {
    padding: "2px 10px",
    background: "#222",
    border: "1px solid #333",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#aaa",
  },

  link: {
    color: "#aaa",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },

  // "Find this Book" links section
  linksSection: {
    marginBottom: "36px",
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#f0f0f0",
    margin: "0 0 16px",
    paddingBottom: "10px",
    borderBottom: "1px solid #222",
  },

  linksRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  linkBtn: {
    padding: "9px 16px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#ccc",
    fontSize: "14px",
    textDecoration: "none",
    transition: "border-color 0.2s, color 0.2s",
  },

  // Description section
  descSection: {
    marginTop: "8px",
  },

  description: {
    fontSize: "15px",
    color: "#999",
    lineHeight: "1.8",
    maxWidth: "720px",
  },

};

export default BookDetail;
