const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
   favorites: [
    {
      bookId: String,
      title: String,
      thumbnail: String
    }
  ]
});

module.exports = mongoose.model("User", userSchema);