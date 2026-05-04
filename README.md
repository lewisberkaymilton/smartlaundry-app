# Smart Laundry Slot System

A full-stack graduation project for managing laundry machine availability and usage sessions.

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Backend   | Node.js, Express, MongoDB (Mongoose)              |
| Auth      | JWT + bcryptjs                                    |
| Frontend  | React (Vite), Tailwind CSS v3, Framer Motion      |
| Icons     | Lucide React                                      |
| HTTP      | Axios                                             |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)

---

### Quick Open (Recommended)

```bash
cd /Users/berkayxlh44/Desktop/laundrysystem
npm install
npm run seed
npm run open
```

This starts both services together:
- Backend: `http://localhost:5001`
- Frontend: `http://localhost:5173`

---

### 1. Backend

```bash
cd backend
cp .env.example .env      # Edit JWT_SECRET if desired
npm run seed              # Seed initial machines + admin user
npm run dev               # Starts on http://localhost:5001
```

**Default admin credentials**
- Email: `admin@laundry.com`
- Password: `admin123`

---

### 2. Frontend

```bash
cd frontend
npm run dev               # Starts on http://localhost:5173
```

---

## API Endpoints

| Method | Path                                | Auth     | Description                       |
|--------|-------------------------------------|----------|-----------------------------------|
| POST   | /api/auth/register                  | Public   | Register new user                 |
| POST   | /api/auth/login                     | Public   | Login                             |
| GET    | /api/auth/me                        | User     | Get current user                  |
| GET    | /api/machines                       | User     | List all machines                 |
| GET    | /api/machines/:id                   | User     | Get single machine                |
| POST   | /api/machines                       | Admin    | Create machine                    |
| PATCH  | /api/machines/:id/status            | Admin    | Update machine status             |
| DELETE | /api/machines/:id                   | Admin    | Delete machine                    |
| POST   | /api/sessions/start                 | User     | Start session on a machine        |
| PATCH  | /api/sessions/machine/:machineId/complete | User | Complete active session       |
| GET    | /api/sessions/history/me            | User     | Get current user's session history|
| GET    | /api/sessions/active                | Admin    | List all active sessions          |
| POST   | /api/reports                        | User     | Create fault/maintenance report   |
| GET    | /api/reports/me                     | User     | List current user's reports       |
| GET    | /api/reports                        | Admin    | List all reports                  |
| PATCH  | /api/reports/:id/status             | Admin    | Update report status              |

---

## Features (Phase 1)

- Register / Login with JWT authentication
- Dashboard with real-time machine grid
- Animated drum spinner while machine is washing
- Countdown timer for active sessions
- Toast notification when your laundry is done
- Usage History page
- Auto-refresh every 15 seconds
- Admin vs Customer role support
