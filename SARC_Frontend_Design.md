# SARC: Smart Academic Research & Collaboration Portal
**Frontend Architecture & Design Document**

## 🎨 1. Design System Guidelines

### Colors
*   **Primary:** Deep Blue (`#1E3A8A`) - Used for primary actions, headers, and brand identity.
*   **Secondary:** Indigo/Purple Gradient (`bg-gradient-to-r from-indigo-500 to-purple-500`) - Used for active states, hero backgrounds, and special highlights.
*   **Accent:** Teal (`#14B8A6`) or Cyan (`#06B6D4`) - Used for call-to-actions, badges, and success states.
*   **Background:** Clean White (`#FFFFFF`) with off-white (`#F8FAFC`) for dashboard canvases. 
*   **Text:** Dark Slate (`#1E293B`) for primary text, Gray (`#64748B`) for secondary text.

### Typography
*   **Font Family:** `Inter` (for clean, readable UI elements and body text) / `Poppins` (for modern, approachable headings).
*   **Hierarchy:**
    *   `h1`: 3rem (48px), Bold
    *   `h2`: 2.25rem (36px), Semi-Bold
    *   `h3`: 1.5rem (24px), Medium
    *   `body`: 1rem (16px), Regular

### UI Aesthetics
*   **Style:** Minimalistic, dashboard-oriented, academic yet modern.
*   **Shadows:** Soft, diffused shadows (`shadow-sm`, `shadow-md` for cards; `shadow-lg` on hover).
*   **Glassmorphism (Optional):** `backdrop-blur-md bg-white/70 border border-white/20` for floating elements like navigation and dropdowns.
*   **Animations:** Framer Motion-style smooth transitions (`transition-all duration-300 ease-in-out`).

---

## 🏗️ 2. Tailwind Class Structure

Here is a reference guide for common utilities in the project:

```css
/* Custom Tailwind Configurations (tailwind.config.js) */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        accent: '#14B8A6',
        surface: '#FFFFFF',
        canvas: '#F8FAFC',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      }
    }
  }
}
```

**Common Utility Patterns:**
*   **Primary Button:** `bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-soft`
*   **Gradient Button:** `bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:opacity-90`
*   **Card:** `bg-white dark:bg-slate-800 rounded-xl shadow-soft p-6 border border-slate-100 dark:border-slate-700 hover:-translate-y-1 hover:shadow-md transition-all duration-300`
*   **Badge:** `px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium`

---

## 🧩 3. Component Breakdown & Reusable React Components

### Core Layout Components
*   `<Navbar />`: Top navigation with role-based links, search, dark mode toggle, and `<NotificationBell />`.
*   `<Sidebar />`: Collapsible vertical navigation for dashboards.
*   `<Footer />`: Simple footer for public pages.
*   `<DashboardLayout />`: Wrapper providing `Sidebar` + `Navbar` + Main Content Area.

### Reusable UI Elements (Atoms & Molecules)
*   `<Button variant="primary|secondary|gradient|outline" size="sm|md|lg" />`: Standardized button component.
*   `<Card />`: Container component with built-in padding, border radius, and hover animations.
*   `<Badge color="blue|teal|red" />`: For skills, status indicators, and roles.
*   `<Avatar src={...} alt={...} />`: User profile picture display.
*   `<StatWidget title="..." value="..." icon={...} />`: Counter cards used across all dashboards.
*   `<TagInput />`: For faculty adding required skills or students adding their stack.
*   `<SkillGapAnalyzer required={[]} userSkills={[]} />`: Utility component to highlight missing skills in red.

---

## 🗺️ 4. UI Hierarchy

```text
src/
├── components/
│   ├── common/        (Button, Card, Badge, Modal, Input)
│   ├── layout/        (Navbar, Sidebar, Footer, DashboardLayout)
│   ├── widgets/       (StatWidget, ProjectCard, NotificationBell)
│   └── charts/        (BarChart, PieChart - via Chart.js/Recharts)
├── pages/
│   ├── public/
│   │   ├── LandingPage.jsx
│   │   └── AuthPage.jsx (Login/Signup)
│   ├── student/
│   │   ├── StudentDashboard.jsx
│   │   ├── BrowseProjects.jsx
│   │   └── MyApplications.jsx
│   ├── faculty/
│   │   ├── FacultyDashboard.jsx
│   │   ├── PostProject.jsx
│   │   └── ManageProjects.jsx
│   ├── admin/
│   │   └── AdminDashboard.jsx
│   └── shared/
│       ├── ProjectDetail.jsx
│       └── ProfileSettings.jsx
├── contexts/          (AuthContext, ThemeContext)
└── utils/             (api.js, recommendations.js)
```

---

## 📐 5. Complete Page Layout Structure

### 1️⃣ Landing Page
*   **Navbar:** Logo (SARC), Login, Sign Up.
*   **Hero Section:** 
    *   *Headline:* “Empowering Research Collaboration Through AI”
    *   *Visual:* Abstract nodes/connections or 3D illustration.
    *   *CTAs:* `<Button variant="gradient">Explore Projects</Button>` `<Button variant="outline">Join as Faculty/Student</Button>`
*   **Feature Highlights (Grid of 4-5 Cards):** AI Project Recommendation, Skill Gap Analyzer, Team Formation, Milestone Tracking.
*   **Statistics Section:** `<StatWidget>` row (Active Projects, Faculty Members, Students Enrolled).
*   **Footer:** Links, Copyright, Contact.

### 2️⃣ Login / Signup Page
*   **Layout:** Split screen or centered glassmorphism card over a gradient mesh background.
*   **Elements:** 
    *   Role Selector Tabs (Admin | Faculty | Student | Mentor).
    *   Form inputs for Email/Password.
    *   `<Button variant="primary">Sign In</Button>`
    *   *Optional:* "Continue with Google/University ID".

### 3️⃣ Student Dashboard
*   **Layout:** `<DashboardLayout>` (Sidebar + Main Area).
*   **Main Dashboard View:**
    *   *Top Bar:* "Welcome back, [Name]". `<NotificationBell />` (Alerts for deadlines/messages).
    *   *Row 1:* Quick Stats (Applications Sent, Ongoing Projects).
    *   *Row 2:* **Recommended Projects Carousel/Grid** (Cards utilizing the AI matching score).
    *   *Row 3:* **Skill Gap Alerts** (Warnings indicating skills needed to improve match rate).
*   **Sidebar Links:** Dashboard, Browse Projects, My Applications, Recommended Projects, Team Formation, Milestones, Profile.

### 4️⃣ Faculty Dashboard
*   **Layout:** `<DashboardLayout>`.
*   **Main Dashboard View:**
    *   *Row 1:* `<StatWidget>` (Total Projects, Pending Applications, Approved Teams).
    *   *Row 2:* **Active Projects List** (table or list of `<ProjectCard>` with status badges).
    *   *Row 3:* **Recent Applications** (Mini-profiles of students applying to projects).
*   **Sidebar Links:** Dashboard, Post Project, Manage Projects, Applications, Milestones, Research Collaboration, Analytics.

### 5️⃣ Admin Dashboard
*   **Layout:** `<DashboardLayout>`.
*   **Main Dashboard View (Analytics Heavy):**
    *   *Row 1:* Top-level stats (Total Users, Active Projects, Success Rate).
    *   *Row 2:* **Charts (Recharts/Chart.js)**: 
        *   Bar Chart: Department-wise Research Activity.
        *   Gauge/Donut Chart: Student Participation Rate.
    *   *Row 3:* System health / Recent moderation flags.

### 6️⃣ Project Detail Page
*   **Header:** Project Title, Status Badge (e.g., `<Badge color="teal">Accepting Applications</Badge>`).
*   **Left Column (70%):**
    *   Detailed Description & Goals.
    *   Milestones & Timeline.
*   **Right Column (30%):**
    *   **Faculty Info Card:** Name, Department, Contact.
    *   **Required Skills:** List of `<Badge>` tags.
    *   **Skill Gap Section:** Compares current user state with requirements (Missing skills highlighted in `text-red-500` and `bg-red-50`).
    *   **Apply CTA:** `<Button variant="gradient" size="lg" className="w-full">Apply Now</Button>`
