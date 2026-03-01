import { useState } from "react";
import { Routes, Route , Link} from "react-router-dom";
import BookDetail from "./BookDetail";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/search?q=${searchQuery}`
      );
      const data = await res.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

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

        {books.map((book, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
            }}
          >
            <Link to={`/book/${book.id}`} style={{ textDecoration: "none", color: "black" }}>
              <h4>{book.volumeInfo.title}</h4>
            </Link>
            <p>{book.volumeInfo.authors?.join(", ")}</p>
          </div>
        ))}
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