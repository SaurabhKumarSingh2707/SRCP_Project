import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://azvavauoqdtcgjtzsnot.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dmF2YXVvcWR0Y2dqdHpzbm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODgwNTYsImV4cCI6MjA5NzQ2NDA1Nn0.JCztIRAvoyOUvFS0wtB843hSj_FW-_z0mUs_KJzK2RA";

console.log("Supabase Client Init:", { url: supabaseUrl, hasKey: !!supabaseKey });
let supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
