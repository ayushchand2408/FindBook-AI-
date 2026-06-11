import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const RESULTS_PER_PAGE = 10;

const GENRES = [
  "fiction", "science", "history", "technology",
  "romance", "mystery", "self-help"
];

export function useBooks(BASE_URL, isLoggedIn) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("recommendation");
  const [detectedText, setDetectedText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [personalized, setPersonalized] = useState([]);
  const [trending, setTrending] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);

  const navigate = useNavigate();
  const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setPage(0);
    setSubmittedQuery(searchQuery);
    setMode("search");
    setSearchParams({ q: searchQuery, page: 0 });
  };

  // ── Upload + OCR ──────────────────────────────────────────────────────────
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

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Random Book ───────────────────────────────────────────────────────────
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

  // ── Pagination ────────────────────────────────────────────────────────────
  const goToPrevPage = () => {
    const newPage = page - 1;
    setPage(newPage);
    setSearchParams({ q: searchQuery, page: newPage });
  };

  const goToNextPage = () => {
    const newPage = page + 1;
    setPage(newPage);
    setSearchParams({ q: searchQuery, page: newPage });
  };

  // ── Fetch search results ──────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "search") return;

    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${BASE_URL}/api/search?q=${submittedQuery}&startIndex=${page * RESULTS_PER_PAGE}`,
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

  // ── Fetch recommendations ─────────────────────────────────────────────────
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

  return {
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
    resultsPerPage: RESULTS_PER_PAGE,
    handleSearch,
    handleUpload,
    getRandomBook,
    goToPrevPage,
    goToNextPage
  };
}