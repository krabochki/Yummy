import { createClient } from "@supabase/supabase-js";
import { adminKey, supabaseKey, supabaseUrl } from "./top-secret";

export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseAdmin = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
