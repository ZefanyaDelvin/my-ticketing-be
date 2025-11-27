# My Ticketing Backend (Express.js)

My Ticketing Backend is a REST API for managing ticketing workflows. It provides endpoints for authentication, ticket creation, ticket management, and dashboard analytics. The API is intended to be used by the My Ticketing Frontend.

---

## Installation and Setup

### 1. Clone repository

```
git clone https://github.com/ZefanyaDelvin/my-ticketing-be.git
cd my-ticketing-be
```

### 2. Install dependencies

```
npm install
```

### 3. Environment variables

Buat file `.env` di root project. Contoh konfigurasi:

```
PORT=5000
DATABASE_URL=your-database-url
JWT_SECRET=your-secret-key
```

Sesuaikan berdasarkan database yang digunakan.

### 4. Database migration / model sync

Jika menggunakan Prisma:

```
npx prisma migrate deploy
```

### 5. Run development server

```
npm run start
```

## Scripts

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm run dev`   | Run application in development mode |
| `npm run start` | Run application in production mode  |
| `npm run test`  | Run tests (if configured)           |

---

## Author

Developed by **Zefanya Delvin**
GitHub: [https://github.com/ZefanyaDelvin](https://github.com/ZefanyaDelvin)

---
