# 🎓 SARCG – Student Academic Research Collaboration Platform

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

> A highly scalable, full-stack web application designed to connect **students**, **faculty**, and **industry professionals** for seamless research project collaboration, application management, and team formation.

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [System Architecture & Tools](#%EF%B8%8F-system-architecture--tools)
  - [Frontend Architecture](#frontend-architecture-sarc-frontend)
  - [Backend Architecture](#backend-architecture-sarc-backend)
  - [Data Flow Example](#application-data-flow)
- [Infrastructure & Current Status](#%EF%B8%8F-infrastructure--current-status)
- [Project Structure](#-project-structure)
- [Database Schema](#%EF%B8%8F-database-schema)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Deployment Strategy](#-deployment-strategy)
- [Contributing](#-contributing)

---

## 📖 About the Project

**SARCG (Student Academic Research Collaboration)** is a platform designed to bridge the gap between students seeking research opportunities and faculty members offering research projects. It provides a structured workflow for:

- Faculty posting detailed research or industry projects.
- Students browsing, filtering, and applying to these projects.
- Team formation, milestone tracking, and application status management.
- Real-time in-app notifications and email alerts across all user roles.

---

## ✨ Key Features

### 👨‍🎓 For Students
- **Project Discovery**: Browse open research projects with advanced filters (domain, required skills, technologies).
- **Application Management**: Apply to projects with custom messages and resume uploads. Track statuses (Pending → Shortlisted → Accepted / Rejected).
- **Team Formation**: Create, join, and manage teams for specific collaborative projects.
- **Profile Customization**: Maintain an academic profile with bio, skills, GitHub links, and resume.

### 👨‍🏫 For Faculty
- **Project Creation**: Create, edit, and manage comprehensive research projects or post lightweight project ideas.
- **Application Review**: Review student applicants, download resumes, and manage acceptances.
- **Milestone Tracking**: Define and monitor project milestones to ensure steady progress.

### 🏢 For Industry & Admin
- **Industry Partners**: Post industry-sponsored projects directly to the student portal.
- **Admin Dashboard**: Oversee all users, projects, and platform activity with advanced data visualization and export tools (Excel/CSV).

---

## 🛠️ System Architecture & Tools

SARCG is built as a robust monolithic REST API communicating with a Single Page Application (SPA).

### Frontend Architecture (`sarc-frontend`)
The frontend is designed for high performance, smooth interactions, and easy scalability.
- **Framework**: `React 18` built with `Vite` for lightning-fast HMR and optimized production builds.
- **Routing**: `React Router v6` for seamless client-side navigation.
- **State Management & Caching**: `@tanstack/react-query (v5)` handles all server-state, API data fetching, and caching, eliminating the need for complex Redux boilerplate.
- **Styling**: `Tailwind CSS` for utility-first responsive design.
- **UI & Animations**: `Framer Motion` for page transitions and `Lucide React` for scalable icons.
- **Data Visualization & Utilities**: `Recharts` for admin dashboards, `react-avatar-editor` for profile picture cropping, and `xlsx` for parsing spreadsheet data.

### Backend Architecture (`sarc-backend`)
The backend is a secure, RESTful API following the MVC (Model-View-Controller) design pattern.
- **Framework**: `Node.js` with `Express.js 5.x`.
- **Database & ORM**: `PostgreSQL` managed by `Prisma ORM` for type-safe database queries and automated migrations.
- **Authentication**: `jsonwebtoken` (JWT) for stateless session management and `bcryptjs` for secure password hashing.
- **Security Middlewares**: 
  - `helmet` (secures HTTP headers)
  - `cors` (Cross-Origin Resource Sharing)
  - `xss-clean` (prevents Cross-Site Scripting)
  - `hpp` (prevents HTTP Parameter Pollution).
- **Rate Limiting & Caching**: `ioredis` and `express-rate-limit` using a Redis store to prevent DDoS and brute-force attacks.
- **File Storage**: `@supabase/supabase-js` and `multer` for uploading and handling multipart/form-data (like resumes and avatars) to Supabase Storage.
- **Email Services**: `nodemailer` for transactional notifications.

### Application Data Flow
Example: **A student applying for a project**
1. Student clicks "Apply" on the React frontend.
2. `React Query` triggers an API mutation, sending a `POST` request with form data and the user's JWT.
3. Express router receives it; security middlewares (`helmet`, `xss-clean`) sanitize the input. `authMiddleware` validates the JWT.
4. The controller uses `Prisma` to insert the application into PostgreSQL.
5. `Nodemailer` sends an email notification to the faculty member.
6. The backend returns a `201 Created` response.
7. `React Query` automatically invalidates the application cache, and the UI updates instantly without a page reload.

---

## 🏗️ Infrastructure & Current Status

This section details the specific architectural decisions, environment configurations, and scalability mechanisms currently implemented.

### 1. Database Configuration (Supabase & Prisma)
We use **Supabase Pro** as our PostgreSQL database provider, managed via **Prisma**.
Our environment configuration explicitly uses two different connection URLs:
- `DATABASE_URL`: Connects to Supabase's **Connection Pooler** (Port `6543`). Since our backend is deployed on a **Serverless** architecture (Netlify Functions), every API request spins up a new micro-server. The pooler safely multiplexes thousands of incoming serverless requests over a small number of actual database connections, preventing connection exhaustion.
- `DIRECT_URL`: Connects directly to the database (Port `5432`). Prisma's Migration engine requires a persistent, locked connection to alter tables safely, which a pooler cannot provide. This is used strictly for running database migrations.

### 2. Serverless Compute & Billing
The application frontend and backend are deployed via **Netlify Pro**.
Netlify uses "Compute Credits" for Build Time (compiling the frontend and bundling the backend) and Serverless Function Executions (processing API routes). 
Immediate compute credit consumption upon launching is almost entirely due to the deployment build process. General user traffic consumes milliseconds of execution time, allowing the system to scale gracefully without skyrocketing costs.

### 3. Real-time Notifications vs. Polling
The notification bell in the frontend updates via **"Smart Polling"**.
- Every 60 seconds, the frontend makes an API call to the backend to check for new notifications, *but only if the user is actively looking at the tab* (using `document.visibilityState`). If the tab is minimized, polling stops to save Netlify execution costs.
- While Supabase offers WebSockets for real-time updates, implementing this with our custom backend authentication (JWTs) would require extensive Row Level Security (RLS) configuration and custom token parsing. Smart polling was chosen as the most secure, rapid, and cost-effective solution for our current architecture.

### 4. File Uploads (Supabase Storage)
Image and resume uploads are handled via **Supabase Storage** using a public bucket named **`sarc-uploads`**.
When a user uploads a file, the backend (using the `SUPABASE_SERVICE_KEY`) generates a secure signed URL, uploads the file, and then saves the final public URL to the database. The bucket must be set to "Public" so that the React frontend can render the images via standard `<img>` tags without requiring complex authentication headers.

---

## 📁 Project Structure

```
SRCP_Project/
├── sarc-backend/               # Node.js + Express REST API
│   ├── controllers/            # Business logic handling requests
│   ├── middleware/             # Auth, validation, and security middleware
│   ├── routes/                 # API route definitions
│   ├── prisma/
│   │   └── schema.prisma       # Database schema and models
│   ├── server.js               # Application entry point
│   └── package.json
│
└── sarc-frontend/              # React SPA
    ├── src/
    │   ├── pages/              # Route-based views (Student, Faculty, Admin, Public)
    │   ├── components/         # Reusable UI components (Buttons, Modals, Layouts)
    │   ├── hooks/              # Custom React hooks (React Query wrappers)
    │   ├── App.jsx             # Root component
    │   └── main.jsx
    ├── tailwind.config.js
    └── package.json
```

---

## 🗄️ Database Schema

The database relies on PostgreSQL and is structured as follows:

| Model | Purpose |
|---|---|
| **User** | Base authentication model with role-based access (`STUDENT`, `FACULTY`, `INDUSTRY`, `ADMIN`). |
| **StudentProfile** | Stores skills, GitHub URL, uploaded resume URL, and bio. |
| **FacultyProfile** | Stores designation, research domains, and experience. |
| **Project** | Projects created by faculty (Title, Description, Tech Stack, Status). |
| **ProjectIdea** | Brainstorming ideas posted for student feedback. |
| **Application** | Junction model tracking a student's application status (`PENDING`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`) for a specific project. |
| **Team / TeamMember** | Connects multiple students to form a collaborative group for a project. |
| **Milestone** | Tracks specific deliverables for a project. |
| **Notification** | Stores in-app alerts and read/unread status for users. |

---

## 🔌 API Endpoints

A brief overview of key RESTful routes exposed by the backend:

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account | Public |
| `POST` | `/api/auth/login` | Authenticate and retrieve JWT | Public |
| `GET` | `/api/projects` | Fetch all open projects | Authenticated |
| `POST` | `/api/projects` | Create a new project | Faculty / Admin |
| `GET` | `/api/applications` | Fetch applications (Student sees theirs, Faculty sees applicants) | Authenticated |
| `POST` | `/api/applications` | Apply for a specific project | Student |
| `PUT` | `/api/applications/:id`| Update application status (Accept/Reject) | Faculty |
| `GET` | `/api/users/profile` | Get logged-in user profile details | Authenticated |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- Redis (optional, but recommended for rate limiting)

### 1. Backend Setup
```bash
cd sarc-backend
npm install

# Create a .env file based on environment variables needed
# .env Example:
# DATABASE_URL="postgresql://user:pass@localhost:5432/sarc_db"
# JWT_SECRET="your_jwt_secret"
# PORT=5000

# Initialize the database
npx prisma migrate dev --name init
npx prisma generate

# Start the server
npm run dev
```

### 2. Frontend Setup
```bash
cd sarc-frontend
npm install

# Start the Vite development server
npm run dev
```
The frontend will be accessible at `http://localhost:5173`.

---

## 🚢 Deployment Strategy

- **Frontend**: The React application is optimized via `npm run build` using Vite. The static assets (`dist` folder) can be easily deployed to CDNs like **Netlify**, **Vercel**, or **AWS S3**. A `netlify.toml` file is included for seamless Netlify deployment.
- **Backend**: The Node.js application is designed to be run using a process manager like **PM2** on a VPS (AWS EC2, DigitalOcean) to handle automatic restarts and load balancing. It also includes `serverless-http` for potential deployment as serverless functions.
- **Database**: The PostgreSQL database can be hosted via managed services like **Supabase**, **Render**, or **AWS RDS**.

---

## 🤝 Contributing

Contributions are always welcome!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center">Made with ❤️ for academic research collaboration</p>
