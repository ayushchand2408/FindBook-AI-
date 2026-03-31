<div align="center">

#  FindBook-AI

### AI-Powered Book Search & Recommendation Platform

[![GitHub Repo](https://img.shields.io/badge/GitHub-FindBook--AI-181717?style=for-the-badge&logo=github)](https://github.com/YOUR_USERNAME/FindBook-AI)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

*A full-stack, production-grade application that combines Google Books search, OCR-based book detection, and a personalized recommendation engine — all behind a secure JWT authentication layer.*

</div>


##  Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + Vite)                        │
│                                                                       │
│  ┌────────────┐  ┌─────────────┐  ┌───────────┐  ┌──────────────┐  │
│  │   Search   │  │    Book     │  │ Favorites │  │  OCR Upload  │  │
│  │   Page     │  │   Detail    │  │   Page    │  │    Page      │  │
│  └────────────┘  └─────────────┘  └───────────┘  └──────────────┘  │
│         │               │                │               │           │
│  ┌──────┴───────────────┴────────────────┴───────────────┴───────┐  │
│  │              React Router v6 (Dynamic + Query Params)          │  │
│  └────────────────────────────────┬───────────────────────────────┘  │
│                                   │                                   │
│  ┌────────────────────────────────▼───────────────────────────────┐  │
│  │           Mode-Based State Engine (useState + useEffect)        │  │
│  │          mode: "recommendation" | "search" | "upload"           │  │
│  └────────────────────────────────┬───────────────────────────────┘  │
│                                   │ fetch()                           │
└───────────────────────────────────┼───────────────────────────────────┘
                                    │ HTTP (JWT in Authorization header)
┌───────────────────────────────────┼───────────────────────────────────┐
│                         SERVER (Express.js)                            │
│                                   │                                    │
│  ┌────────────────────────────────▼───────────────────────────────┐   │
│  │                      Auth Middleware (JWT)                       │   │
│  └───────┬──────────────────┬─────────────────┬────────────────────┘  │
│          │                  │                 │                         │
│  ┌───────▼──────┐  ┌────────▼───────┐  ┌─────▼──────────┐            │
│  │  Auth Routes  │  │  Book Routes   │  │  OCR Route      │            │
│  │  /register   │  │  /search       │  │  /upload-book   │            │
│  │  /login      │  │  /book/:id     │  │  (Tesseract.js) │            │
│  └──────────────┘  │  /favorite     │  └────────────────┘            │
│                    │  /favorites    │                                   │
│                    │  /favorite/:id │                                   │
│                    └────────┬───────┘                                  │
│                             │ Axios                                     │
│                    ┌────────▼───────┐                                  │
│                    │ Google Books   │                                   │
│                    │     API        │                                   │
│                    └────────────────┘                                  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    MongoDB Atlas (Mongoose)                       │  │
│  │          Collections: users  │  favorites                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

##  Features

###  Authentication
- JWT-based auth with protected routes
- Token persisted in `localStorage`; injected via `Authorization: Bearer` header on all protected calls
- Auth middleware on all sensitive endpoints

###  Book Search
- Full-text search via Google Books API
- URL-driven state (`?q=&page=`) — shareable, browser-history-friendly
- Pagination with `startIndex` offset

###  Personalized Recommendations
- On login with no active search: generates recommendations derived from saved favorites' genres/authors
- Falls back to curated trending titles when no favorites exist
- Mode-based UI architecture (`"recommendation"` | `"search"` | `"upload"`) eliminates flag sprawl

###  OCR Book Detection
- Upload a book cover photo → Tesseract.js extracts text → triggers an automatic Google Books search
- Handles noise/partial text gracefully via fuzzy matching on extracted strings

###  Favorites System
- Save/remove books with full metadata persistence (MongoDB)
- Live "Saved" badge on search cards
- Dedicated favorites page with inline removal

###  Book Detail
- Dynamic routing (`/book/:id`) with full volume info
- In-context navigation back to search results preserving query state

---

##  Project Structure

```
FindBook-AI/
├── client/                         # React + Vite frontend
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx                 # Route definitions + global layout
│   │   ├── App.css
│   │   ├── BookDetail.jsx          # Dynamic route: /book/:id
│   │   ├── BookFilter.jsx          # Search filters UI component
│   │   ├── BookFilter.css
│   │   ├── Favorites.jsx           # Saved books page
│   │   ├── Login.jsx               # Auth page (login + register)
│   │   ├── main.jsx                # Vite entry point
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                         # Node.js + Express backend
    ├── middleware/
    │   └── auth.js                 # JWT verification middleware
    ├── models/
    │   └── user.js                 # Mongoose User model (favorites embedded)
    ├── uploads/                    # Temp storage for OCR image uploads
    ├── eng.traineddata             # Tesseract.js English language data
    ├── index.js                    # Express app + all route handlers
    ├── .env
    └── package.json
```

---

##  API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/register` | ❌ | `{ name, email, password }` | Register new user |
| `POST` | `/api/login` | ❌ | `{ email, password }` | Returns JWT token |

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

---

### Books

| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|--------------|-------------|
| `GET` | `/api/search` | ✅ | `q`, `startIndex` | Search Google Books API |
| `GET` | `/api/book/:id` | ✅ | — | Fetch single book by Google Books volume ID |

**Search Response:**
```json
{
  "totalItems": 248,
  "items": [
    {
      "id": "zyTCAlFPjgYC",
      "volumeInfo": {
        "title": "The Pragmatic Programmer",
        "authors": ["David Thomas", "Andrew Hunt"],
        "description": "...",
        "imageLinks": { "thumbnail": "https://..." },
        "categories": ["Computers"]
      }
    }
  ]
}
```

---

### Favorites

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/favorite` | ✅ | `{ bookId, title, authors, thumbnail, categories }` | Save a book |
| `GET` | `/api/favorites` | ✅ | — | Get all saved books for the current user |
| `DELETE` | `/api/favorite/:bookId` | ✅ | — | Remove a saved book |

**Favorites Response:**
```json
[
  {
    "_id": "64f2a...",
    "bookId": "zyTCAlFPjgYC",
    "title": "The Pragmatic Programmer",
    "authors": ["David Thomas"],
    "thumbnail": "https://...",
    "categories": ["Computers"],
    "savedAt": "2024-09-01T10:23:00.000Z"
  }
]
```

---

### OCR

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/upload-book` | ✅ | `multipart/form-data` — field: `image` | Upload book cover → returns extracted text + search results |

**OCR Response:**
```json
{
  "extractedText": "The Pragmatic Programmer",
  "searchResults": { "totalItems": 12, "items": [ ... ] }
}
```

---

##  Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/findbookai
JWT_SECRET=your_jwt_secret_key
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

### Client (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

##  Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account
- Google Books API key ([get one here](https://developers.google.com/books/docs/v1/using#APIKey))

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/FindBook-AI.git
cd FindBook-AI
```

### 2. Install dependencies
```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure environment variables
```bash
# In /server — copy and fill in your values
cp .env.example .env

# In /client
cp .env.example .env
```

### 4. Run development servers
```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| State Management | useState + useEffect (mode-driven architecture) |
| HTTP (Client) | Fetch API |
| HTTP (Server) | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT (jsonwebtoken), bcrypt |
| OCR | Tesseract.js |
| External API | Google Books API v1 |

---

##  Roadmap

- [ ] Reading list & progress tracking (currently reading / finished)
- [ ] Rate & review books (stored in MongoDB)
- [ ] Recommendation engine v2 — weighted scoring by genre overlap + author affinity
- [ ] Social features — share reading lists
- [ ] Full deployment (Render backend + Vercel frontend)
- [ ] Redis caching layer for frequent Google Books queries
- [ ] Refresh token rotation

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ by [Ayush Chand](https://github.com/ayushchand2408)

⭐ Star this repo if you found it helpful!

</div>
