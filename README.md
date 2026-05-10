# TaskFlow — Team Task Manager

live url :- taskflow-production-464b.up.railway.app

> A production-grade, full-stack team task management platform built with React, Node.js, and PostgreSQL. Role-based access control, real-time Kanban boards, analytics dashboards, and one-click Railway deployment.

---

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Role & Permission Model](#role--permission-model)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)
- [Deployment (Railway)](#deployment-railway)
- [Project Structure](#project-structure)

---

## Overview

TaskFlow is a collaborative project and task management tool designed for engineering teams. It provides a structured workspace where admins can create projects, invite members, assign tasks, and track progress — all from a responsive, animated UI that works equally well on desktop and tablet.

The application is deployed as a **single Railway service**: the Node.js backend serves both the REST API and the compiled React frontend from the same origin, eliminating CORS complexity in production.

---

## Feature Highlights

### Authentication & Profiles
- JWT-based authentication with `httpOnly`-style bearer token storage in Zustand persisted state
- Secure password hashing with **bcrypt (cost factor 12)**
- Per-user profile editing — display name, avatar URL, password change
- Query cache isolation on login/logout — no data bleed between user sessions

### Project Management
- Create, edit, archive, and delete projects
- Project status lifecycle: `ACTIVE → ON_HOLD → COMPLETED → ARCHIVED`
- Deadline tracking with overdue indicators
- Project-level member management — invite users, assign project roles (Admin / Member)

### Task Management
- Full task lifecycle: `TODO → IN_PROGRESS → IN_REVIEW → DONE`
- Priority levels: `LOW · MEDIUM · HIGH · URGENT` with colour-coded badges
- Due date tracking with automatic overdue detection
- Task assignment to any project member
- **Drag-and-drop Kanban board** powered by `@hello-pangea/dnd`
- List view with multi-dimensional filtering (status, priority, assignee, search)
- Slide-over detail panel — full task info, edit form, and inline comment thread

### Comments
- Threaded comments per task with avatar, name, and relative timestamps
- Authors can delete their own comments; project admins can delete any comment
- Comment count displayed on task cards

### Dashboard & Analytics
- Summary stats: total projects, tasks by status, overdue count, team size
- **Pie chart** — task distribution by status (Recharts)
- **Bar chart** — tasks per project
- Recent activity feed

### Search & Notifications
- Full-screen search overlay — searches projects and tasks simultaneously (2+ characters)
- Click-to-navigate results
- Notification bell — overdue tasks (red) and tasks due within 3 days (amber)
- Red dot indicator on bell when overdue tasks exist
- Auto-refreshes every 60 seconds

### Security
- `helmet` — sets 11 security-related HTTP headers
- `express-rate-limit` — 200 req/15 min global, 20 req/15 min on auth routes
- Input validation with `express-validator` on every mutating endpoint
- Global ADMIN role cannot be self-assigned through the API
- Cascade deletes — removing a project removes all its tasks and comments

---

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 5.0 | Build tool & dev server |
| TailwindCSS | 3.4 | Utility-first styling |
| Framer Motion | 11.0 | Page & component animations |
| TanStack Query | 5.17 | Server state, caching, background refetch |
| Zustand | 4.4 | Client auth state with localStorage persistence |
| React Hook Form + Zod | 7.49 + 3.22 | Form management & schema validation |
| @hello-pangea/dnd | 16.6 | Accessible drag-and-drop |
| Recharts | 2.10 | SVG-based charts |
| Axios | 1.6 | HTTP client with auth interceptor |
| React Router DOM | 6.21 | Client-side routing |
| date-fns | 3.3 | Date formatting and comparison |
| Lucide React | 0.309 | Icon system |
| react-hot-toast | 2.4 | Toast notifications |

### Backend
| Library | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.18 | HTTP framework |
| Prisma ORM | 5.7 | Database access layer |
| PostgreSQL | 14+ | Relational database |
| jsonwebtoken | 9.0 | JWT signing & verification |
| bcryptjs | 2.4 | Password hashing |
| helmet | 7.1 | HTTP security headers |
| cors | 2.8 | Cross-origin resource sharing |
| express-rate-limit | 7.1 | Rate limiting |
| express-validator | 7.0 | Input validation |
| morgan | 1.10 | HTTP request logging |
| dotenv | 16.3 | Environment variable loading |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Railway Service                    │
│                                                     │
│  ┌──────────────┐      ┌────────────────────────┐  │
│  │   React SPA  │      │    Express REST API     │  │
│  │  (Vite build)│      │   /api/*                │  │
│  │  served as   │◄────►│                         │  │
│  │  static files│      │  Auth · Users           │  │
│  └──────────────┘      │  Projects · Tasks       │  │
│                        │  Dashboard · Comments   │  │
│                        └────────────┬───────────┘  │
│                                     │               │
│                          ┌──────────▼──────────┐   │
│                          │  Prisma ORM          │   │
│                          │  (query builder +    │   │
│                          │   migrations)        │   │
│                          └──────────┬───────────┘  │
└─────────────────────────────────────┼───────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │   Railway PostgreSQL     │
                         │   (managed database)     │
                         └─────────────────────────┘
```

**Request flow in production:**
1. Browser loads React SPA from `/` (served by Express static middleware)
2. React app calls `/api/*` endpoints — same origin, no CORS needed
3. Express routes through middleware chain → controller → Prisma → PostgreSQL
4. JSON response returned, React Query caches and re-renders UI

---

## Database Schema

```
User
├── id (cuid)
├── email (unique)
├── password (bcrypt hash)
├── name
├── avatar?
├── role: GlobalRole (ADMIN | MEMBER)
├── ownedProjects → Project[]
├── projectMembers → ProjectMember[]
├── assignedTasks → Task[]
├── createdTasks → Task[]
└── comments → Comment[]

Project
├── id (cuid)
├── name
├── description?
├── status: ProjectStatus (ACTIVE | ON_HOLD | COMPLETED | ARCHIVED)
├── deadline?
├── owner → User
├── members → ProjectMember[]
└── tasks → Task[]

ProjectMember                     ← Junction table
├── id (cuid)
├── role: MemberRole (ADMIN | MEMBER)
├── joinedAt
├── project → Project (cascade delete)
├── user → User (cascade delete)
└── @@unique([projectId, userId])

Task
├── id (cuid)
├── title
├── description?
├── status: TaskStatus (TODO | IN_PROGRESS | IN_REVIEW | DONE)
├── priority: Priority (LOW | MEDIUM | HIGH | URGENT)
├── dueDate?
├── project → Project (cascade delete)
├── assignee? → User
├── creator → User
└── comments → Comment[]

Comment
├── id (cuid)
├── content
├── task → Task (cascade delete)
└── user → User
```

---

## API Reference

All endpoints (except `/api/auth/register` and `/api/auth/login`) require:
```
Authorization: Bearer <token>
```

### Authentication — `/api/auth`

| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Create account |
| `POST` | `/login` | Login, returns JWT |
| `GET` | `/me` | Get current user profile |
| `PUT` | `/profile` | Update name / avatar |
| `PUT` | `/change-password` | Change password |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Admin | List all users |
| `GET` | `/:id` | Any | Get user by ID |
| `PUT` | `/:id` | Admin | Update user role |
| `DELETE` | `/:id` | Admin | Delete user |

### Projects — `/api/projects`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Any | List accessible projects |
| `POST` | `/` | Any | Create project (caller becomes owner + admin) |
| `GET` | `/:id` | Member | Get project with members and task counts |
| `PUT` | `/:id` | Project Admin | Update project |
| `DELETE` | `/:id` | Project Member | Delete project |
| `GET` | `/:id/members` | Member | List project members |
| `POST` | `/:id/members` | Project Admin | Add member |
| `PUT` | `/:id/members/:userId` | Project Admin | Update member role |
| `DELETE` | `/:id/members/:userId` | Project Admin | Remove member |

### Tasks — `/api/tasks`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Any | List tasks (filterable by project, status, priority, assignee) |
| `POST` | `/` | Project Member | Create task |
| `GET` | `/:id` | Member | Get task with comments |
| `PUT` | `/:id` | Member | Full task update |
| `PATCH` | `/:id/status` | Member | Status-only update (Kanban drag) |
| `DELETE` | `/:id` | Member | Delete task |
| `POST` | `/:id/comments` | Member | Add comment |
| `DELETE` | `/:id/comments/:commentId` | Author or Admin | Delete comment |

### Dashboard — `/api/dashboard`

| Method | Path | Description |
|---|---|---|
| `GET` | `/stats` | Aggregate counts and chart data |
| `GET` | `/activity` | Recent task and project activity feed |

### Health Check

```
GET /api/health
→ { success: true, message: "TaskFlow API is running", timestamp: "..." }
```

---

## Role & Permission Model

TaskFlow uses a **two-layer RBAC** system:

### Layer 1 — Global Role

| Permission | ADMIN | MEMBER |
|---|:---:|:---:|
| Manage all users | ✅ | ❌ |
| Access any project | ✅ | ❌ |
| View global dashboard | ✅ | ✅ |

### Layer 2 — Project Role

| Permission | Project ADMIN | Project MEMBER |
|---|:---:|:---:|
| View project & tasks | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Move tasks (Kanban) | ✅ | ✅ |
| Edit / delete tasks | ✅ | ✅ |
| Add comments | ✅ | ✅ |
| Delete own comments | ✅ | ✅ |
| Add / remove members | ✅ | ❌ |
| Update member roles | ✅ | ❌ |
| Edit project settings | ✅ | ❌ |
| Delete project | ✅ | ❌ |

> Global ADMINs bypass all project-level membership checks.

---

## Getting Started (Local)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- npm 9+

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 2. Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 3. Configure environment

```bash
# backend/.env
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskmanager"
JWT_SECRET="your-super-secret-jwt-key-change-this"
NODE_ENV="development"
PORT=5000
```

### 4. Set up the database

```bash
cd backend
npx prisma db push
node prisma/seed.js
```

### 5. Start development servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# UI running at http://localhost:5173
```

### Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Global Admin | admin@taskflow.com | `password123` |
| Member | alice@taskflow.com | `password123` |
| Member | bob@taskflow.com | `password123` |

---

## Environment Variables

### Backend (required in production)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for signing JWTs — **change this** | `openssl rand -hex 32` output |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Server port (Railway sets this automatically) | `5000` |
| `FRONTEND_URL` | Allowed CORS origin (optional in prod) | `https://taskflow.up.railway.app` |

### Frontend

The frontend uses a single build-time variable:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | API base URL | `/api` (same origin in production) |

In development, Vite proxies `/api` → `http://localhost:5000` via `vite.config.js`.


---

## Project Structure

```
taskflow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database models & enums
│   │   └── seed.js              # Demo data seeder
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── user.controller.js
│       │   ├── project.controller.js
│       │   ├── task.controller.js
│       │   └── dashboard.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js       # JWT verification
│       │   ├── validate.middleware.js   # express-validator runner
│       │   └── projectRole.middleware.js # RBAC guards
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── user.routes.js
│       │   ├── project.routes.js
│       │   ├── task.routes.js
│       │   └── dashboard.routes.js
│       ├── utils/
│       │   ├── jwt.utils.js
│       │   └── response.utils.js
│       └── index.js                     # Express app entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Layout.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── Header.jsx           # Search + notifications
│       │   ├── projects/
│       │   │   ├── ProjectCard.jsx
│       │   │   └── ProjectForm.jsx
│       │   ├── tasks/
│       │   │   ├── TaskCard.jsx
│       │   │   ├── TaskForm.jsx
│       │   │   ├── KanbanBoard.jsx      # Drag-and-drop board
│       │   │   └── TaskDetailPanel.jsx  # Slide-over with comments
│       │   └── ui/                      # Design system primitives
│       │       ├── Avatar.jsx
│       │       ├── Badge.jsx
│       │       ├── Button.jsx
│       │       ├── Input.jsx
│       │       ├── Select.jsx
│       │       ├── Modal.jsx
│       │       ├── Skeleton.jsx
│       │       └── EmptyState.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetail.jsx
│       │   ├── Tasks.jsx
│       │   └── Profile.jsx
│       ├── store/
│       │   └── authStore.js             # Zustand + localStorage
│       └── utils/
│           ├── api.js                   # Axios instance + interceptor
│           └── helpers.js
├── nixpacks.toml                        # Railway build config
├── railway.json                         # Railway deploy config
└── README.md
```

---

