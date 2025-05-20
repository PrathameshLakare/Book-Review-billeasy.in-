const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number },
  comment: { type: String },
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
