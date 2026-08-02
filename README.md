# 🎓 SARCG – Guide Selection Process Documentation

The **Guide Selection Process** is a specialized, multi-phase workflow in the SARCG (Student Academic Research Collaboration) platform. It is designed to manage the pairing of student project teams with faculty guides for academic research and final year projects. This repository's current focus is exclusively on this system.

---

## 🆕 Recent Updates & New Features

Recent developments have significantly enhanced the Guide Selection workflow, adding robust communication, file handling, and administrative oversight:

1. **Team Instructions & Mentorship System**: A fully-fledged instruction system has been introduced. Faculty guides can now broadcast instructions directly to their allocated teams. The system tracks read receipts (`isRead`) and timestamps, managed via the new `TeamInstruction` schema, backend controllers (`instructionController.js`), and frontend components (`TeamInstructions.jsx`).
2. **Abstract & Document Uploads (Supabase Integration)**: Teams can now upload their abstract files and project documents directly to the platform. This is powered by a new Supabase storage integration (`uploadController.js`, `testUpload.cjs`), allowing seamless file handling and display within the consolidated `TeamDetails.jsx` view.
3. **Advanced Team Details View**: The introduction of `TeamDetails.jsx` provides a comprehensive, centralized hub. Students and faculty can view a team's status, members, uploaded documents, and guide instructions all on one page.
4. **Enhanced Admin Configurations**: The `GuideAdminConfig` dashboard and `systemController` have been heavily expanded. Administrators have granular control over review phases (`activeReviewPhase`), team creation toggles, manual overrides, and can easily manage system-wide exceptions.
5. **Robust Security & User Management**: Added `AdminUserManagement.jsx` for direct user control and resolved issues in `authController.js` regarding secure password handling.

---

## 🏗️ 1. Architecture & Database Entities

The process is underpinned by a relational database schema managed via **Prisma**. Key entities include:

- **Team**: Represents the student project group.
  - `status`: Tracks progression through the workflow (`FORMING` ➔ `REQUESTED_GUIDE` ➔ `APPROVED`).
  - `selectionSource`: Indicates whether the pairing was initiated by the student (`STUDENT`) or directly selected by the faculty (`FACULTY`).
  - `isEditedByGuide`: Tracks if the guide has modified the project scope post-approval.
- **TeamMember**: Connects students to teams, managing `inviteStatus` (`PENDING`, `ACCEPTED`, `REJECTED`) and designating the team leader.
- **FacultyGuideSlot**: Tracks faculty availability. By default, a faculty member has a `totalSlots` limit (e.g., 7 teams), and the system tracks `usedSlots` to prevent over-allocation.
- **SystemConfig & GuideSelectionConfig**: Singleton tables that allow administrators to toggle global phases (e.g., enabling/disabling team creation).
- **TeamInstruction & TeamReview**: Facilitate post-allocation communication, milestones, and grading between the guide and the team.

---

## 👨‍🎓 2. Student Workflow (Team Formation & Request)

The student experience is handled primarily through the `/student/guide/` routes in the React frontend.

1. **Team Creation** (`GuideTeamCreate.jsx`):
   - A student initiates the process by creating a team.
   - They provide a Project Title, a Project Description (strictly validated to a maximum of 100 words), and select a Project Domain (e.g., AI/ML, Web Development, IoT, or a custom domain).
   - The creator automatically becomes the team leader.
2. **Team Building & Invitations** (`GuideTeamMy.jsx` & `TeamInvites.jsx`):
   - The leader can invite peers to join the team using their email or university register number.
   - Invited students receive notifications and can accept or reject the invite.
   - During this phase, the team's status remains `FORMING`.
3. **Browsing Guides & Submitting Requests** (`GuideSelect.jsx`):
   - Once the team is finalized, the leader browses available faculty profiles. Profiles can be filtered by research areas and domain expertise.
   - The system strictly checks the `FacultyGuideSlot` to ensure the targeted faculty member has availability.
   - The leader submits a formal request, changing the team status to `REQUESTED_GUIDE` and locking further member changes.

---

## 👨‍🏫 3. Faculty Workflow (Review & Mentorship)

Faculty members interact with the system via the `/faculty/guide/` dashboard.

1. **Reviewing Requests** (`FacultyTeamSelect.jsx`):
   - Faculty members monitor incoming requests from teams.
   - They review the proposed project title, the 100-word abstract, the domain, and the individual profiles (skills, GitHub, resumes) of the team members.
2. **Decision Making**:
   - **Accept**: The team status updates to `APPROVED`, the faculty is officially assigned as the `guideId`, and their `usedSlots` counter increments.
   - **Reject**: The request is dropped, the team status reverts to `FORMING`, and the students are notified to seek a different guide.
3. **Mentorship & Evaluation** (`FacultyAllocatedTeams.jsx` & `FacultyMyPicks.jsx`):
   - Once allocated, faculty can send broadcast messages (`TeamInstructions`) to their teams and track read receipts.
   - They evaluate the team's progress through predefined `ReviewSchedule` phases (e.g., `REVIEW_1_1`, `REVIEW_2_1`), issuing marks and feedback via `TeamReview`.

---

## 🛡️ 4. Administrator Controls

Administrators have overarching control over the process to ensure it aligns with the academic calendar.

- **Phase Management** (`GuideAdminConfig.jsx` & `systemController.js`):
  - Admins can globally toggle `isTeamCreationEnabled`. If false, students are locked out of the `GuideTeamCreate` form, preventing out-of-band requests.
  - They manage `activeReviewPhase` (e.g., `PHASE_1`, `PHASE_2`, `CLOSED`) which dictates which evaluations faculty can perform.
- **Oversight**: Admins have access to global statistics (via `statsController.js`), allowing them to see unallocated teams, faculty slot usage, and overall progress, stepping in for manual allocations if necessary.

---

## 🔌 5. Core API Endpoints

The backend (`sarc-backend/routes`) exposes specific RESTful endpoints to drive this process:

- **`/api/guide/teams`** (`guideTeamController.js`): Handles student team creation, member invitations, and fetching team status.
- **`/api/guide/faculty`** (`facultyGuideController.js`): Handles the faculty side, including fetching incoming requests, accepting/rejecting teams, and fetching allocated teams.
- **`/api/guide/admin`** (`guideAdminController.js`): Handles administrative overrides, slot configurations, and global metrics.
- **`/api/system/config`**: Fetches the current active phases and global toggles for the frontend to render appropriate UI states.
