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

  const { bookId, title, thumbnail } = req.body;

  const user = await User.findById(req.userId);

  const exists = user.favorites.find(b => b.bookId === bookId);

  if (exists) {
    return res.json({ message: "Already saved" });
  }

  user.favorites.push({ bookId, title, thumbnail });

  await user.save();

  res.json({ message: "Book saved ❤️" });

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

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});