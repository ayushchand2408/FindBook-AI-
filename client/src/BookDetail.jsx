import { useNavigate , useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/book/${id}`
        );
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

  return (
    <div style={{ padding: "40px" }}>
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
      <h2>{info.title}</h2>

      {info.imageLinks?.thumbnail && (
        <img
          src={info.imageLinks.thumbnail}
          alt="cover"
          style={{ margin: "20px 0" }}
        />
      )}

      <p><strong>Authors:</strong> {info.authors?.join(", ")}</p>
      <p><strong>Publisher:</strong> {info.publisher}</p>
      <p><strong>Published:</strong> {info.publishedDate}</p>
      <p><strong>Pages:</strong> {info.pageCount}</p>

      <div
        dangerouslySetInnerHTML={{ __html: info.description }}
      />
    </div>
  );
}

export default BookDetail;