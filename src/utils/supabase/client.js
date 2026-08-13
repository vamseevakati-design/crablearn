import { createBrowserClient } from "@supabase/ssr";

// Vite exposes only VITE_* to the browser; NEXT_PUBLIC_* also read for Supabase docs compatibility.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
