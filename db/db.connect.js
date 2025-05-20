const mongoose = require("mongoose");

const mongoURI = process.env.MONGOURI;
console.log(mongoURI);

const initializeDatabase = async () => {
  try {
    const connection = await mongoose.connect(mongoURI);
    if (connection) {
      console.log("Connected to MongoDB successfully.");
    }
  } catch (error) {
    console.error("Error", error);
  }
};

module.exports = { initializeDatabase };
