import { useEffect, useState } from "react";

function Favorites() {

  const [books, setBooks] = useState([]);

  useEffect(() => {

    const fetchFavorites = async () => {

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: {
          Authorization: token
        }
      });

      const data = await res.json();

      console.log("Favorites:", data); // 🔴 IMPORTANT DEBUG

      setBooks(data);

    };

    fetchFavorites();

  }, []);

  return (
    <div>

      <h2>My Favorite Books ❤️</h2>

      {books.length === 0 && <p>No favorites yet</p>}

      {books.map((book) => (
        <div key={book.bookId}>
          <img src={book.thumbnail} width="80" />
          <p>{book.title}</p>
        </div>
      ))}

    </div>
  );

}

export default Favorites;