import { useState , useEffect } from "react";
import { Routes, Route , Link ,  useSearchParams } from "react-router-dom";
import BookDetail from "./BookDetail";
import './App.css';

function Home() {
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const [submittedQuery, setSubmittedQuery] = useState(
    searchParams.get("q") || ""
  );
  //fr pagination
  const [page, setPage] = useState(
    Number(searchParams.get("page")) || 0
  );
  const resultsPerPage = 10;

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setPage(0);
    setSubmittedQuery(searchQuery);

    setSearchParams({
      q: searchQuery,
      page: 0
    });
  };
  //Handle Upload Button
  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/upload-book", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("Detected:", data.detectedText);
      console.log("Books:", data.books);

      setBooks(data.books); 
      setSubmittedQuery(""); // clear manual search state
      setSearchParams({});

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Image upload failed");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!submittedQuery.trim()) {
      setBooks([]);
      return;
    }

    const fetchBooks = async () => {

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `http://localhost:5000/api/search?q=intitle:${submittedQuery}&startIndex=${page * resultsPerPage}`
        );

        const data = await res.json();

        setTotalItems(data.totalItems || 0);

        if (data.totalItems === 0) {
          setBooks([]);
        } else {
          setBooks(data.items || []);
        }

      } catch (err) {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [page, submittedQuery]);

  return (
  <div>
    {/* Navbar */}
    <nav className="navbar">
      <h2 style={{ margin: 0 }}>FindBook AI 📚</h2>
    </nav>

    {/* Search Section */}
    <div className="container">
      <div className="card">
        <h3>Search Book by Name</h3>
        <input
          type="text"
          placeholder="Enter book name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="card">
        <h3>Upload Book Image</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button onClick={handleUpload}>
          Upload & Detect
        </button>
      </div>
    </div>



    {/* Results Section */}
    <div className="results-container">
      <h3>Results</h3>

      {loading && <p>Loading books...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && submittedQuery && books.length === 0 && !error && (
        <p style={{ fontSize: "18px", marginTop: "20px" }}>
          No books found for "<strong>{searchQuery}</strong>"
        </p>
      )}

      {/* Books Grid */}
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
              style={{ textDecoration: "none", color: "#111" }}
            >
              <h4>{book.volumeInfo.title}</h4>
            </Link>

            <p>{book.volumeInfo.authors?.join(", ")}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {books.length > 0 && (
        <div className="pagination">
          <button
            disabled={page === 0}
            onClick={() => {
              const newPage = page - 1;
              setPage(newPage);
              setSearchParams({ q: searchQuery, page: newPage });
            }}
          >
            Previous
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
            Next
          </button>
        </div>
      )}
    </div>
  </div>
);
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book/:id" element={<BookDetail />} />
    </Routes>
  );
}

export default App;