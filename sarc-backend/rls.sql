-- RLS Setup for User Table

-- 1. Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacultyProfile" ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies
-- Everyone can read all users (needed for profiles)
CREATE POLICY "Public user read access" ON "User" FOR SELECT USING (true);

-- Users can only update their own record
CREATE POLICY "Users can update own record" ON "User" FOR UPDATE USING (
  id::text = current_setting('app.current_user_id', true)
);

CREATE POLICY "Public student read access" ON "StudentProfile" FOR SELECT USING (true);
CREATE POLICY "Students update own profile" ON "StudentProfile" FOR UPDATE USING (
  "userId"::text = current_setting('app.current_user_id', true)
);

CREATE POLICY "Public faculty read access" ON "FacultyProfile" FOR SELECT USING (true);
CREATE POLICY "Faculty update own profile" ON "FacultyProfile" FOR UPDATE USING (
  "userId"::text = current_setting('app.current_user_id', true)
);
