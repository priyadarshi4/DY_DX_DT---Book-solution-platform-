# Dy_Dx_Dt — Mathematical Solutions Platform

> A premium, modern mathematical platform for browsing textbooks, reading step-by-step solutions with LaTeX rendering, downloading PDFs, and engaging with a community of mathematicians.

---

## ✨ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| Media | Cloudinary |
| Math Rendering | KaTeX + react-markdown |
| Notifications | React Hot Toast |
| State | Zustand |

---

## 🗂 Project Structure

```
dydxdt/
├── backend/
│   ├── config/
│   │   └── cloudinary.js         # Cloudinary + Multer setup
│   ├── controllers/
│   │   ├── authController.js     # Signup, Login, Me
│   │   ├── bookController.js     # CRUD books
│   │   ├── chapterController.js  # Chapters, Sections, Questions
│   │   ├── solutionController.js # Solutions + Likes
│   │   ├── commentController.js  # Comments
│   │   └── adminController.js    # Stats, User management
│   ├── middleware/
│   │   └── auth.js               # JWT protect, adminOnly, optionalAuth
│   ├── models/
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── Chapter.js
│   │   └── index.js              # Section, Question, Solution, Comment, Like
│   ├── routes/
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── chapters.js
│   │   ├── solutions.js
│   │   ├── comments.js
│   │   └── admin.js
│   ├── utils/
│   │   └── jwt.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── layout.tsx             # Root layout + toaster
    │   ├── page.tsx               # Landing homepage
    │   ├── auth/
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   ├── books/
    │   │   ├── page.tsx           # Library with search & filters
    │   │   └── [id]/page.tsx      # Book detail + table of contents
    │   ├── solutions/
    │   │   ├── page.tsx           # Solutions listing
    │   │   └── [id]/page.tsx      # Solution detail with LaTeX + comments
    │   ├── profile/page.tsx
    │   └── admin/
    │       ├── layout.tsx         # Admin sidebar layout
    │       ├── page.tsx           # Dashboard + stats
    │       ├── books/page.tsx     # Book CRUD
    │       ├── solutions/page.tsx # Solution CRUD
    │       ├── comments/page.tsx  # Comment moderation
    │       └── users/page.tsx     # User management
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   └── Footer.tsx
    │   ├── math/
    │   │   └── MathFormula.tsx    # KaTeX formula blocks
    │   └── shared/
    │       ├── BookCard.tsx
    │       └── Skeleton.tsx
    ├── lib/
    │   ├── api.ts                 # Axios client + all API calls
    │   ├── store.ts               # Zustand auth store
    │   └── utils.ts               # cn(), formatDate(), etc.
    ├── types/index.ts             # TypeScript interfaces
    ├── styles/globals.css
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── next.config.js
    └── package.json
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Backend Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dydxdt
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Frontend Environment

```bash
cp frontend/.env.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 👤 Creating Your First Admin

After starting the server, register via the signup page. Then use MongoDB Compass or Atlas UI to update your user document:

```json
{ "role": "admin" }
```

Or via MongoDB shell:

```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

Then log in and access `/admin`.

---

## 📚 Content Workflow (Admin)

### Step 1: Add a Book
`/admin/books` → Click "Add Book" → Fill title, author, category, PDF link, upload thumbnail.

### Step 2: Add Chapters
Use the API directly (or build a UI extension):
```
POST /api/chapters
{ title, number, bookId }
```

### Step 3: Add Sections
```
POST /api/chapters/sections
{ title, number, chapterId, bookId }
```

### Step 4: Add Questions
```
POST /api/chapters/questions
{ number, statement, difficulty, sectionId, chapterId, bookId }
```

### Step 5: Add Solutions
`/admin/solutions` → Click "Add Solution" → Select book → chapter → section → question → write solution with Markdown + LaTeX.

**LaTeX in solutions** — use standard KaTeX syntax:
- Inline: `$E = mc^2$`
- Block: `$$\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}$$`

---

## 🌐 Deployment

### Backend → Render

1. Push backend to a GitHub repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect repo, set:
   - Build command: `npm install`
   - Start command: `node server.js`
4. Add all environment variables from `.env.example`
5. Deploy

### Frontend → Vercel

1. Push frontend to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com/api
   ```
4. Deploy

### Database → MongoDB Atlas

1. Create a free cluster on [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist `0.0.0.0/0` (all IPs) for Render compatibility
4. Copy the connection string to `MONGODB_URI`

---

## 🔌 API Reference

### Auth
| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Protected |
| PATCH | `/api/auth/profile` | Protected |

### Books
| Method | Route | Access |
|---|---|---|
| GET | `/api/books` | Public |
| GET | `/api/books/:id` | Public |
| POST | `/api/books` | Admin |
| PUT | `/api/books/:id` | Admin |
| DELETE | `/api/books/:id` | Admin |
| PATCH | `/api/books/:id/download` | Public |

### Chapters / Sections / Questions
| Method | Route | Access |
|---|---|---|
| GET | `/api/chapters/book/:bookId` | Public |
| POST | `/api/chapters` | Admin |
| GET | `/api/chapters/sections/chapter/:chapterId` | Public |
| POST | `/api/chapters/sections` | Admin |
| GET | `/api/chapters/questions/section/:sectionId` | Public |
| POST | `/api/chapters/questions` | Admin |

### Solutions
| Method | Route | Access |
|---|---|---|
| GET | `/api/solutions` | Public |
| GET | `/api/solutions/:id` | Public |
| POST | `/api/solutions` | Admin |
| PUT | `/api/solutions/:id` | Admin |
| DELETE | `/api/solutions/:id` | Admin |
| POST | `/api/solutions/:id/like` | Protected |

### Comments
| Method | Route | Access |
|---|---|---|
| GET | `/api/comments/:solutionId` | Public |
| POST | `/api/comments/:solutionId` | Protected |
| DELETE | `/api/comments/:id` | Owner / Admin |
| GET | `/api/comments/recent` | Admin |

### Admin
| Method | Route | Access |
|---|---|---|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id/toggle` | Admin |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary Background | `#050507` |
| Card Background | `#0f0f14` |
| Gold Accent | `#c8a96e` |
| Text Primary | `#f8f6f0` |
| Text Secondary | `rgba(248,246,240,0.6)` |
| Border | `rgba(200,169,110,0.12)` |
| Display Font | Cormorant Garamond |
| Code Font | JetBrains Mono |
| Body Font | Inter |

---

## 🛡 Security Features

- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- Rate limiting: 100 req/15min general, 20 req/15min auth
- Helmet.js HTTP security headers
- XSS-clean input sanitization
- Role-based access control (user / admin)
- CORS with frontend origin whitelist

---

## 📝 License

MIT — Built with ❤️ for the mathematics community.
