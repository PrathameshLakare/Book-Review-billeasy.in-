const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  bookName: { type: String, required: true },
  bookDetails: { type: String },
  author: { type: String, required: true },
  genre: [{ type: String }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
