const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

  favorites: [
    {
      bookId: String,
      title: String,
      thumbnail: String,
      authors: [String],      // ✅ ADD THIS
      categories: [String],   // ✅ ADD THIS
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model("User", userSchema);