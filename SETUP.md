# TaskFlow — Setup Guide

## Tech Stack
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL, JWT
- **Frontend**: React 18, Vite, TailwindCSS, React Query, Zustand, Framer Motion

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database

### 1. Clone & Install
```bash
npm run install:all
```

### 2. Configure environment

**backend/.env**
```
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Setup database
```bash
npm run db:push      # Push schema to database
npm run db:seed      # Seed demo data
```

### 4. Start development servers
```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Visit: http://localhost:5173

### Demo accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskflow.com | admin123 |
| Member | alice@taskflow.com | member123 |
| Member | bob@taskflow.com | member123 |

---

## Railway Deployment

### Services needed
1. **PostgreSQL** — Add Railway PostgreSQL plugin
2. **Backend** — Deploy from `/backend` directory
3. **Frontend** — Deploy from `/frontend` directory (or serve via backend)

### Environment Variables (Railway)
```
DATABASE_URL=<from Railway PostgreSQL>
JWT_SECRET=<your-secret>
NODE_ENV=production
PORT=5000
FRONTEND_URL=<your-frontend-railway-url>
```

### Build Commands
**Backend**: `npx prisma generate && npx prisma db push && node src/index.js`
**Frontend**: `npm run build` → serve `dist/` folder

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| GET | /api/auth/me | Get profile |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project + tasks |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member |
| DELETE | /api/projects/:id/members/:userId | Remove member |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get task + comments |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/status | Update status |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/:id/comments | Add comment |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/dashboard/activity | Recent activity |
