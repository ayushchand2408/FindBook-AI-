import { useState , useEffect } from "react";
import { Routes, Route , Link ,  useSearchParams } from "react-router-dom";
import BookDetail from "./BookDetail";

function Home() {
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [totalItems, setTotalItems] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
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

    setSearchParams({
      q: searchQuery,
      page: 0
    });
  };
  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setBooks([]);
      return;
    }

    const fetchBooks = async () => {

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `http://localhost:5000/api/search?q=intitle:${searchQuery}&startIndex=${page * resultsPerPage}`
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
  }, [page, searchQuery]);

  return (
    <div>
      <nav style={styles.navbar}>
        <h2>FindBook AI 📚</h2>
      </nav>

      <div style={styles.container}>
        <div style={styles.card}>
          <h3>Search Book by Name</h3>
          <input
            type="text"
            placeholder="Enter book name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleSearch} style={styles.button}>
            Search
          </button>
        </div>

        <div style={styles.card}>
          <h3>Upload Book Image</h3>
          <input type="file" style={styles.input} />
          <button style={styles.button}>Upload</button>
        </div>
      </div>

      <div style={{ marginTop: "40px", padding: "20px" }}>
        <h3>Results</h3>

        {loading && <p>Loading books...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && searchQuery && books.length === 0 && !error && (
          <p style={{ fontSize: "18px", marginTop: "20px" }}>
            No books found for "<strong>{searchQuery}</strong>"
          </p>
        )}

        {books.map((book) => (
          <div
            key={book.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
              display: "flex",
              gap: "20px"
            }}
          >
            {book.volumeInfo.imageLinks?.thumbnail && (
              <img
                src={book.volumeInfo.imageLinks.thumbnail}
                alt="cover"
              />
            )}

            <div>
              <Link
                to={`/book/${book.id}`}
                style={{ textDecoration: "none", color: "black" }}
              >
                <h4>{book.volumeInfo.title}</h4>
              </Link>

              <p>{book.volumeInfo.authors?.join(", ")}</p>
            </div>
          </div>
        ))}

        {/* Pagination OUTSIDE map */}
        {books.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(prev => prev - 1)}
              style={{ marginRight: "10px" }}
            >
              Previous
            </button>

            <span> Page {page + 1} </span>

            <button
              disabled={(page + 1) * resultsPerPage >= totalItems}
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book/:id" element={<BookDetail />} />
    </Routes>
  );
}

const styles = {
  navbar: {
    background: "#111",
    color: "#fff",
    padding: "15px",
    textAlign: "center",
  },
  container: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    marginTop: "50px",
  },
  card: {
    border: "1px solid #ddd",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  },
  button: {
    padding: "8px 15px",
    cursor: "pointer",
  },
};

export default App;