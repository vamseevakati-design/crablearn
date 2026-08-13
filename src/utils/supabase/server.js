import { createClient } from "@supabase/supabase-js";

/**
 * Server / Express helper (Node). Do not import this into React components.
 * Prefer DATABASE_URL + pg for Accounts; use this for Supabase Auth/table APIs from the API.
 */
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL / publishable or service role key.");
  }
  return createClient(supabaseUrl, supabaseKey);
}
