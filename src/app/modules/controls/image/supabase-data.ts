import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = 'https://brjsyzrfwurpphhmpioc.supabase.co';
export const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyanN5enJmd3VycHBoaG1waW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA1MDAwNDYsImV4cCI6MjAxNjA3NjA0Nn0.8teqJ13HzyADOYfJ3xF9N1nkvlUm0Jpd9xeaJn8n58Y';
export const supabase = createClient(supabaseUrl, supabaseKey);
