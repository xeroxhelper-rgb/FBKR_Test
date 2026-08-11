import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://xhpzkxtybshnzznbpcbu.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocHpreHR5YnNobnp6bmJwY2J1IiwiaWF0IjoxNzg2NDE5MDMxLCJleHAiOjIxMDE5OTUwMzF9.0Jme4UbcAebSSfw_PyoAUOGXBYqVNAICblsoXvXdZLk";

export const supabase = createClient(supabaseUrl, supabaseKey);
