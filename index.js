const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { initializeDatabase } = require("./db/db.connect");
const User = require("./models/user.model");
const Book = require("./models/book.model");
const Review = require("./models/review.model");

app.use(express.json());
initializeDatabase();

const jwtSecret = process.env.JWTSECRET;

//JWT middleware
const verifyJwt = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ error: "token not provided" });
  }
  try {
    const tokenParts = token.split(" ");
    const decodedToken = jwt.verify(tokenParts[1], jwtSecret);
    req.user = decodedToken;

    next();
  } catch (error) {
    res.status(403).json("Invalid token.");
  }
};

//signup route
app.post("/v1/signup", async (req, res) => {
  try {
    const { userName, password } = req.body;

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({ message: "User already exist." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      userName,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: newUser._id, role: "user" }, jwtSecret, {
      expiresIn: "12h",
    });
    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//login route
app.post("/v1/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credential" });
    }

    const token = jwt.sign({ userId: user._id, role: "user" }, jwtSecret, {
      expiresIn: "12h",
    });

    res.status(201).json({ message: "User login successfully", token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//add book route
app.post("/v1/books", verifyJwt, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookName, bookDetails, author, genre } = req.body;

    const newBookData = new Book({
      bookName,
      bookDetails,
      author,
      genre,
      postedBy: userId,
    });
    const savedBook = await newBookData.save();

    res
      .status(201)
      .json({ message: "Book data saved successfully.", book: savedBook });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//fetch all books with filter
app.get("/books", async (req, res) => {
  try {
    const { page = 1, limit = 10, author, genre } = req.query;

    const filter = {};
    if (author) filter.author = author;
    if (genre) filter.genre = genre;

    const books = await Book.find(filter)
      .populate("postedBy", "userName")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalBooks = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      page: Number(page),
      totalPages,
      totalBooks,
      books,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//fetch book data with average rating and total reviews
app.get("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const book = await Book.findById(id).populate("postedBy", "userName");

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const reviews = await Review.find({ bookId: id })
      .populate("userId", "username")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Compute average rating and group it
    const ratingStats = await Review.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$bookId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = ratingStats[0]?.averageRating || 0;
    const totalReviews = ratingStats[0]?.totalReviews || 0;
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      book,
      averageRating,
      reviews,
      pagination: {
        page: Number(page),
        totalPages,
        totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//create new review
app.post("/books/:id/reviews", verifyJwt, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    const existingReview = await Review.findOne({
      bookId: req.params.id,
      userId,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this book." });
    }

    // Create new review
    const newReview = new Review({
      bookId: req.params.id,
      userId,
      rating,
      comment,
    });
    const savedReview = await newReview.save();

    res.status(201).json({
      message: "Review submitted successfully.",
      review: savedReview,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//update review by id
app.put("/reviews/:id", verifyJwt, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.userId;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only update your own review." });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    const updatedReview = await review.save();

    res.json({
      message: "Review updated successfully.",
      review: updatedReview,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//delete review by id (only user review)
app.delete("/reviews/:id", verifyJwt, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.userId;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    if (review.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own review." });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

//search by title or author

app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const allBooks = await Book.find();

    const searchTerm = q.toLowerCase();

    const filteredBooks = allBooks.filter(
      (book) =>
        book.bookName.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );

    res.json({ results: filteredBooks });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
