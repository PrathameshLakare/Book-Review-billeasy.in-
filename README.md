# Book Review API

## Overview

A RESTful API for managing books and reviews with user authentication. Users can sign up, log in, add books, submit and manage reviews, and search books by title or author.

## Features

- User signup and login with JWT authentication
- Add, update, and delete books (authenticated users)
- Submit, update, delete reviews (only own reviews)
- Pagination for books and reviews
- Search books by title or author (case-insensitive, partial matches)
- Secure routes with JWT middleware

## Project Setup

### Prerequisites

- Node.js (v14 or above recommended)
- MongoDB database (local or cloud)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

### Install dependencies:

npm install

### Create a .env file in the root folder with the following variables:

PORT=5000

JWTSECRET=your_jwt_secret_here

MONGODB_URI=your_mongodb_connection_string_here

### Running the project locally

npm start

The server will run on http://localhost:5000 by default.

# 📮 API Routes for Book Review API

This contains all the API routes for quick reference and importing into Postman or other tools.

---

## 🧑 Auth

### 🔐 Signup

**POST** `/v1/signup`

```json
{
  "userName": "johnDoe",
  "password": "securePassword"
}
```

### 🔐 Login

**POST** `/v1/login`

```json
{
  "userName": "johnDoe",
  "password": "securePassword"
}
```

> Returns JWT token

---

## 📚 Books

### ➕ Add Book (Protected)

**POST** `/v1/books`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

```json
{
  "bookName": "The Great Gatsby",
  "bookDetails": "A novel set in the Roaring Twenties...",
  "author": "F. Scott Fitzgerald",
  "genre": "Classic"
}
```

### 📖 Get All Books (with filters/pagination)

**GET** `/books?page=1&limit=5&author=F. Scott Fitzgerald&genre=Classic`

### 🔍 Search Books

**GET** `/search?q=gatsby`

### 📘 Get Single Book

**GET** `/books/:id`

---

## ✍️ Reviews

### ➕ Add Review (Protected)

**POST** `/books/:id/reviews`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

```json
{
  "rating": 5,
  "comment": "Absolutely loved it!"
}
```

### ✏️ Update Review (Protected)

**PUT** `/reviews/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`

```json
{
  "rating": 4,
  "comment": "Updated my thoughts"
}
```

### ❌ Delete Review (Protected)

**DELETE** `/reviews/:id`  
**Headers:** `Authorization: Bearer <JWT_TOKEN>`
