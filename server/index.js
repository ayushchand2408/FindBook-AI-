const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

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

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working 🚀" });
});

// 🔥 NEW: Book Search Route
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  const startIndex = req.query.startIndex || 0;

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}&startIndex=${startIndex}&maxResults=10&key=${process.env.GOOGLE_BOOKS_KEY}`
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

// 📸 Upload + OCR + Search
app.post("/api/upload-book", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    console.log("Processing image:", imagePath);

    // OCR
    const result = await Tesseract.recognize(imagePath, "eng");
    const extractedText = result.data.text;

    if (!extractedText.trim()) {
      return res.json({ message: "No text detected" });
    }

    // Clean text (first 3 non-empty lines)
    const cleanedText = extractedText
      .split("\n")
      .filter(line => line.trim() !== "")
      .slice(0, 3)
      .join(" ");

    console.log("Detected Text:", cleanedText);

    // Search in Google Books
    const booksResponse = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(cleanedText)}&key=${process.env.GOOGLE_BOOKS_KEY}`
    );

    // Optional: delete image after processing
    fs.unlinkSync(imagePath);

    res.json({
      detectedText: cleanedText,
      books: booksResponse.data.items || [],
    });

  } catch (error) {
    console.error("OCR ERROR:", error.message);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});