# 🎓 SARC – Student Academic Research Collaboration Platform

> A full-stack web application that connects **students**, **faculty**, and **industry professionals** for seamless research project collaboration, application management, and team formation.

---

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Endpoints](#api-endpoints)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 About the Project

**SARC (Student Academic Research Collaboration)** is a platform designed to bridge the gap between students seeking research opportunities and faculty members offering research projects. It provides a structured workflow for:

- Faculty posting research/industry projects
- Students browsing and applying to projects
- Team formation and milestone tracking
- Real-time notifications across all user roles
- Admin oversight and management

---

## ✨ Key Features

### 👨‍🎓 Student
- Browse open research projects with filters (domain, skills, technologies)
- Apply to projects with a personal message and resume upload
- Track application statuses (Pending → Shortlisted → Accepted / Rejected)
- Form teams and join other teams
- View and update personal profile (bio, skills, GitHub, resume)
- Receive real-time notifications on application status changes

### 👨‍🏫 Faculty
- Create, edit, and manage research projects
- Post project ideas for student exploration
- Review and manage student applications (shortlist, accept, reject)
- Track project milestones and progress
- Manage team assignments for projects

### 🏢 Industry / Admin
- Industry professionals can post industry-sponsored projects
- Admin can oversee all users, projects, and platform activity

### 🔔 Notifications
- In-app notification system for all important events
- Unread count badge on the notification bell
- Clickable notifications that route to relevant pages

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **Lucide React** | Icon library |
| **Recharts** | Data visualization / charts |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Prisma ORM** | Database access & migrations |
| **PostgreSQL** | Relational database |
| **JWT (jsonwebtoken)** | Authentication & authorization |
| **bcryptjs** | Password hashing |
| **Multer** | File uploads (resume, images, docs) |
| **dotenv** | Environment variable management |
| **CORS** | Cross-origin resource sharing |

---

## 📁 Project Structure

```
SRCP_Project/
├── sarc-backend/               # Node.js + Express REST API
│   ├── controllers/            # Business logic
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── applicationController.js
│   │   ├── teamController.js
│   │   ├── milestoneController.js
│   │   ├── notificationController.js
│   │   └── userController.js
│   ├── middleware/             # Auth & other middleware
│   ├── routes/                 # API route definitions
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── uploads/                # Uploaded files (gitignored)
│   ├── server.js               # App entry point
│   └── package.json
│
└── sarc-frontend/              # React + Vite SPA
    ├── src/
    │   ├── pages/
    │   │   ├── public/         # Login, Register
    │   │   ├── student/        # Dashboard, Browse, Applications
    │   │   ├── faculty/        # Dashboard, Applications
    │   │   ├── admin/          # Admin Dashboard
    │   │   └── shared/         # Profile (all roles)
    │   ├── components/         # Reusable UI components
    │   ├── App.jsx             # Root component & routing
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## 🗄️ Database Schema

The application uses **PostgreSQL** managed via **Prisma ORM** with the following core models:

| Model | Description |
|---|---|
| `User` | Base user with role (STUDENT, FACULTY, INDUSTRY, ADMIN) |
| `StudentProfile` | Student-specific info: skills, GitHub, resume, areas of interest |
| `FacultyProfile` | Faculty-specific info: designation, research areas, experience |
| `IndustryProfile` | Industry partner info |
| `AdminProfile` | Admin profile |
| `Project` | Research projects posted by faculty with status tracking |
| `ProjectIdea` | Lightweight project ideas posted by faculty |
| `Application` | Student applications to projects (PENDING → ACCEPTED/REJECTED) |
| `Team` | Student teams linked to projects |
| `TeamMember` | Many-to-many relationship between teams and students |
| `Milestone` | Project milestones with submission tracking |
| `Notification` | In-app notification center |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd sarc-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create the `.env` file** by copying the example and filling in your values:
   ```bash
   # .env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sarc_db"
   JWT_SECRET="your_super_secret_jwt_key"
   PORT=5000
   ```

4. **Run Prisma migrations** to set up the database:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **(Optional) Seed faculty data:**
   ```bash
   node seed-faculty.js
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```
   The API will be running at `http://localhost:5000`

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd sarc-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be running at `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login and get JWT token | ❌ |
| `GET` | `/api/projects` | Get all open projects | ✅ |
| `POST` | `/api/projects` | Create a new project | ✅ Faculty |
| `PUT` | `/api/projects/:id` | Update a project | ✅ Faculty |
| `DELETE` | `/api/projects/:id` | Delete a project | ✅ Faculty |
| `GET` | `/api/applications` | Get applications | ✅ |
| `POST` | `/api/applications` | Submit an application | ✅ Student |
| `PUT` | `/api/applications/:id` | Update application status | ✅ Faculty |
| `GET` | `/api/notifications` | Get user notifications | ✅ |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read | ✅ |
| `GET` | `/api/teams` | Get teams | ✅ |
| `POST` | `/api/teams` | Create a team | ✅ Student |
| `GET` | `/api/milestones` | Get project milestones | ✅ |
| `POST` | `/api/milestones` | Add a milestone | ✅ Faculty |
| `GET` | `/api/users/profile` | Get logged-in user profile | ✅ |
| `PUT` | `/api/users/profile` | Update user profile | ✅ |

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| **STUDENT** | Browse projects, apply, form teams, track milestones, manage profile |
| **FACULTY** | Post projects & ideas, review applications, manage teams, set milestones |
| **INDUSTRY** | Post industry-sponsored projects |
| **ADMIN** | Full platform oversight and management |

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">Made with ❤️ for academic research collaboration</p>
