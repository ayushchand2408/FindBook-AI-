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
│  │     Custom Hooks: useAuth | useFavorites | useBooks             │  │
│  │     Mode-Based State Engine: "recommendation"|"search"|"upload" │  │
│  └────────────────────────────────┬───────────────────────────────┘  │
│                                   │ fetch() + httpOnly cookie         │
└───────────────────────────────────┼───────────────────────────────────┘
                                    │
┌───────────────────────────────────┼───────────────────────────────────┐
│                         SERVER (Express.js)                            │
│                                   │                                    │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │   Rate Limiter (express-rate-limit) + Input Validation        │     │
│  │              (express-validator)                               │     │
│  └────────────────────────┬─────────────────────────────────────┘     │
│                           │                                            │
│  ┌────────────────────────▼───────────────────────────────────────┐   │
│  │                   Auth Middleware (JWT + httpOnly Cookie)        │   │
│  └───────┬──────────────────┬─────────────────┬────────────────────┘  │
│          │                  │                 │                         │
│  ┌───────▼──────┐  ┌────────▼───────┐  ┌─────▼──────────┐            │
│  │  Auth Routes  │  │  Book Routes   │  │  OCR Route      │            │
│  │  /register   │  │  /search       │  │  /upload-book   │            │
│  │  /login      │  │  /book/:id     │  │  (Tesseract.js) │            │
│  │  /logout     │  │  /favorite     │  └────────────────┘            │
│  └──────────────┘  │  /favorites    │                                   │
│                    │  /favorite/:id │                                   │
│                    │  /recommendations                                  │
│                    └────────┬───────┘                                  │
│                             │ Axios + In-Memory Cache                   │
│                    ┌────────▼───────┐                                  │
│                    │ Google Books   │                                   │
│                    │     API        │                                   │
│                    └────────────────┘                                  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    MongoDB Atlas (Mongoose)                       │  │
│  │              Collections: users (favorites embedded)             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

##  Features

###  Authentication
- JWT-based auth stored in **httpOnly cookies** (not localStorage — XSS safe)
- Cookie expires after **24 hours** with explicit `expires` + `maxAge` for cross-browser consistency
- Auth middleware on all sensitive endpoints
- Secure cookie flags in production (`secure: true`, `sameSite: none`)

###  Security
- **Rate limiting** — 5 login attempts / 15 min, 10 registrations / hr, 20 uploads / hr
- **Input validation** on all auth routes via `express-validator` (server-side) + Mongoose schema constraints (DB-level)
- **File upload protection** — only JPEG, PNG, WEBP accepted, 5MB size limit
- **Search query sanitization** — `encodeURIComponent` + length cap before hitting Google API

###  Book Search
- Full-text search via Google Books API
- URL-driven state (`?q=&page=`) — shareable, browser-history-friendly
- Pagination with `startIndex` offset

###  Personalized Recommendations
- Generates recommendations from saved favorites' genres/categories
- Falls back to trending titles when no favorites exist
- Both API calls fired **in parallel** via `Promise.allSettled` for faster response
- In-memory caching to avoid redundant Google API calls

###  OCR Book Detection
- Upload a book cover photo → Tesseract.js extracts text → triggers automatic Google Books search
- Handles noise/partial text gracefully

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
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useAuth.js          # Auth check, logout logic
│   │   │   ├── useFavorites.js     # Favorites state, toggle, isSaved
│   │   │   └── useBooks.js         # Search, upload, recommendations, pagination
│   │   ├── App.jsx                 # Route definitions + Home component
│   │   ├── BookDetail.jsx          # Dynamic route: /book/:id
│   │   ├── BookFilter.jsx          # Search filters UI
│   │   ├── Favorites.jsx           # Saved books page
│   │   ├── Login.jsx               # Auth page (login + register)
│   │   └── main.jsx                # Vite entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                         # Node.js + Express backend
    ├── middleware/
    │   └── auth.js                 # JWT cookie verification middleware
    ├── models/
    │   └── user.js                 # Mongoose User schema (favorites embedded)
    ├── uploads/                    # Temp storage for OCR images (auto-deleted)
    ├── index.js                    # Express app + all route handlers
    ├── .env
    └── package.json
```

---

##  API Reference

All protected routes require a valid JWT stored in the `token` httpOnly cookie (set automatically on login).

### Auth

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/register` | ❌ | `{ name, email, password }` | Register new user |
| `POST` | `/api/login` | ❌ | `{ email, password }` | Login — sets httpOnly cookie |
| `POST` | `/api/logout` | ✅ | — | Clears auth cookie |

---

### Books

| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|--------------|-------------|
| `GET` | `/api/search` | ✅ | `q`, `startIndex` | Search Google Books API |
| `GET` | `/api/book/:id` | ✅ | — | Fetch single book by volume ID |
| `GET` | `/api/recommendations` | ✅ | — | Get personalized + trending books |

---

### Favorites

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/favorite` | ✅ | `{ bookId, title, authors, thumbnail, categories }` | Save a book |
| `GET` | `/api/favorites` | ✅ | — | Get all saved books |
| `DELETE` | `/api/favorite/:bookId` | ✅ | — | Remove a saved book |

---

### OCR

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/upload-book` | ✅ | `multipart/form-data` — field: `image` | Upload cover → OCR → search results |

---

##  Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/findbookai
JWT_SECRET=your_jwt_secret_key
GOOGLE_BOOKS_KEY=your_google_books_api_key
NODE_ENV=development
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
# In /server — create .env and fill in your values
cp .env.example .env

# In /client
cp .env.example .env
```

### 4. Run development servers
```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server && node index.js

# Terminal 2 — Frontend (http://localhost:5173)
cd client && npm run dev
```

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| State Management | Custom Hooks (useAuth, useFavorites, useBooks) |
| HTTP Client | Fetch API |
| HTTP Server | Axios |
| Backend | Node.js, Express.js |
| Validation | express-validator, Mongoose schema constraints |
| Rate Limiting | express-rate-limit |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT (jsonwebtoken), bcrypt, httpOnly cookies |
| OCR | Tesseract.js |
| External API | Google Books API v1 |

---

##  Roadmap

- [ ] Refresh token rotation
- [ ] Redis caching layer for Google Books queries
- [ ] Reading list & progress tracking (currently reading / finished)
- [ ] Rate & review books
- [ ] Recommendation engine v2 — weighted scoring by genre + author affinity
- [ ] Full deployment (Render backend + Vercel frontend)
- [ ] Social features — share reading lists

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

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