const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.CLIENT_URL
  ],
  credentials: true
}));
app.use(express.json());

app.use(cookieParser());

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
// ── Rate Limiters ─────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: "Too many accounts created from this IP. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: "Too many upload requests. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const auth = require("./middleware/auth");


// ── Reusable validation error handler ────────────────────────────────────────
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  return null;
}

//For Login
app.post(
  "/api/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Please enter a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
  ],
  async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    // never send the token itself, only user info
    res.json({ user: { id: user._id, name: user.name, email: user.email } });

  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

//For SignUp
app.post(
  "/api/register",
  registerLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("email").isEmail().withMessage("Please enter a valid email").normalizeEmail(),
    body("password")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
      .matches(/\d/).withMessage("Password must contain at least one number")
  ],
  async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
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
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

//Logout route
app.post("/api/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
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

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WEBP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

//  NEW: Book Search Route
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  const startIndex = req.query.startIndex || 0;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const safeQuery = encodeURIComponent(query.trim().slice(0, 200)); // sanitize + limit length
  const safeStart = parseInt(startIndex) || 0;

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${safeQuery}&startIndex=${safeStart}&maxResults=10&key=${process.env.GOOGLE_BOOKS_KEY}`
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
app.post("/api/upload-book", uploadLimiter, upload.single("image"), async (req, res) => {
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

    // ── Build personalized fetch (or return cached) ───────────────────────────
    const getPersonalized = async () => {
      if (user.favorites.length === 0) return [];

      const categories = user.favorites.flatMap(b => b.categories);
      const uniqueCategories = [...new Set(categories)];
      const query = uniqueCategories
        .slice(0, 3)
        .map(cat => cat.split("/")[0].trim())
        .join(" OR ");

      const cacheKey = `personalized:${query}`;
      const cached = getCached(cacheKey);
      if (cached) {
        console.log("Personalized (cached):", cached.length);
        return cached;
      }

      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=6&key=${process.env.GOOGLE_BOOKS_KEY}`
      );
      const data = response.data.items || [];
      setCache(cacheKey, data);
      console.log("Personalized:", data.length);
      return data;
    };

    // ── Build trending fetch (or return cached) ───────────────────────────────
    const getTrending = async () => {
      const cached = getCached("trending");
      if (cached) {
        console.log("Trending (cached):", cached.length);
        return cached;
      }

      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=popular books&maxResults=6&key=${process.env.GOOGLE_BOOKS_KEY}`
      );
      const data = response.data.items || [];
      setCache("trending", data);
      console.log("Trending:", data.length);
      return data;
    };

    // ── Fire both in parallel ─────────────────────────────────────────────────
    const [personalized, trending] = await Promise.allSettled([
      getPersonalized(),
      getTrending()
    ]);

    res.json({
      personalized: personalized.status === "fulfilled" ? personalized.value : [],
      trending: trending.status === "fulfilled" ? trending.value : []
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});