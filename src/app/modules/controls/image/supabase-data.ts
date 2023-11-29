import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = 'https://brjsyzrfwurpphhmpioc.supabase.co';
export const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyanN5enJmd3VycHBoaG1waW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA1MDAwNDYsImV4cCI6MjAxNjA3NjA0Nn0.8teqJ13HzyADOYfJ3xF9N1nkvlUm0Jpd9xeaJn8n58Y';
export const adminKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyanN5enJmd3VycHBoaG1waW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDUwMDA0NiwiZXhwIjoyMDE2MDc2MDQ2fQ.sC5M-pmja_BfrS8KcAPjmuLMRLvXBfdQEqnJqaF-I6k';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseAdmin = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
