const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ── Simple in-memory cache ────────────────────────────────────────────────────
// Prevents hammering the Google Books API with the same queries repeatedly.
// Cache entries expire after 10 minutes.

const cache = {};
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) return null;
  return entry.data;
}

function setCache(key, data) {
  cache[key] = { data, time: Date.now() };
}
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const auth = require("./middleware/auth");


//For Login
app.post("/api/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }

});

//For SignUp
app.post("/api/register", async (req, res) => {

  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }

});

//Favorite Books Post
app.post("/api/favorite", auth, async (req, res) => {
  // console.log("BODY:", req.body); // 👈 ADD THIS

  try {
    const { bookId, title, thumbnail, authors, categories } = req.body;

    const user = await User.findById(req.userId);

    // 🔒 Prevent duplicate
    const exists = user.favorites.find(b => b.bookId === bookId);
    if (exists) {
      return res.json({ message: "Already saved" });
    }

    // ✅ Push full metadata
    user.favorites.push({
      bookId,
      title,
      thumbnail,
      authors: authors || [],
      categories: categories || [],
      addedAt: new Date()
    });

    await user.save();

    res.json({ message: "Book saved ❤️" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//For Fetching 
app.get("/api/favorites", auth, async (req, res) => {

  const user = await User.findById(req.userId);

  res.json(user.favorites);

});
// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

//  NEW: Book Search Route
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  const startIndex = req.query.startIndex || 0;

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=${startIndex}&maxResults=10&key=${process.env.GOOGLE_BOOKS_KEY}`
    );

    res.json(response.data);

  } catch (error) {
    console.error(
      "SEARCH ERROR:",
      error.response?.data || error.message
    );

    res.status(500).json({ error: "Error fetching books" });
  }
});

// Book id 
app.get("/api/book/:id", async (req, res) => {
  try {
    const bookId = req.params.id;

    console.log("Fetching book:", bookId);

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${process.env.GOOGLE_BOOKS_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    console.error("BOOK DETAIL ERROR:",
      error.response?.data || error.message
    );

    res.status(500).json({ message: "Error fetching book details" });
  }
});

//  Upload + OCR + Search
app.post("/api/upload-book", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    console.log("Processing image:", imagePath);

    // OCR
    const result = await Tesseract.recognize(imagePath, "eng");
    const rawText = result.data.text;

    console.log("Detected Text:", rawText);

    //  Clean text (remove extra spaces & new lines)
    const cleanedText = rawText
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 6) // take first 6 words only
      .join(" ");

    console.log("Searching for:", cleanedText);

    //  Auto search in Google Books
    const booksResponse = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${cleanedText}&maxResults=8&key=${process.env.GOOGLE_BOOKS_KEY}`
    );

    // Optional: delete image after processing
    fs.unlinkSync(imagePath);
    
    res.json({
      detectedText: cleanedText,
      books: booksResponse.data.items || [],
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error.message);
    res.status(500).json({ error: "Failed to process image" });
  }
});

//for recomendation
app.get("/api/recommendations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    let personalized = [];
    let trending = [];

    // 🔥 Personalized — only fetch if user has favorites
    if (user.favorites.length > 0) {
      const categories = user.favorites.flatMap(b => b.categories);
      const uniqueCategories = [...new Set(categories)];

      const query = uniqueCategories
        .slice(0, 3)
        .map(cat => cat.split("/")[0].trim())
        .join(" OR ");

      // Check cache before hitting Google API
      const cacheKey = `personalized:${query}`;
      const cachedPersonalized = getCached(cacheKey);

      if (cachedPersonalized) {
        personalized = cachedPersonalized;
        console.log("Personalized (cached):", personalized.length);
      } else {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=6&key=${process.env.GOOGLE_BOOKS_KEY}`
          );
          personalized = response.data.items || [];
          setCache(cacheKey, personalized);
          console.log("Personalized:", personalized.length);
        } catch (err) {
          // If Google API is down, return empty — don't crash the whole route
          console.error("Personalized fetch failed:", err.message);
        }
      }
    }

    // 📈 Trending — check cache first
    const trendingCached = getCached("trending");

    if (trendingCached) {
      trending = trendingCached;
      console.log("Trending (cached):", trending.length);
    } else {
      try {
        const trendingRes = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=popular books&maxResults=6&key=${process.env.GOOGLE_BOOKS_KEY}`
        );
        trending = trendingRes.data.items || [];
        setCache("trending", trending);
        console.log("Trending:", trending.length);
      } catch (err) {
        // If Google API is down, return empty — don't crash the whole route
        console.error("Trending fetch failed:", err.message);
      }
    }

    res.json({
      personalized,
      trending
    });

  } catch (err) {
    console.error(err);
    // Return empty arrays instead of 500 so the frontend doesn't break
    res.json({ personalized: [], trending: [] });
  }
});

//to remove favorite books
app.delete("/api/favorite/:bookId", auth, async (req, res) => {
  try {
    const { bookId } = req.params;

    const user = await User.findById(req.userId);

    user.favorites = user.favorites.filter(
      (b) => b.bookId !== bookId
    );

    await user.save();

    res.json({ message: "Removed from favorites ❌" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error removing book" });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});