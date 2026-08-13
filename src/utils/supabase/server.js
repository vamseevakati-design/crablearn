import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

/**
 * Express / Node server client (not Next.js).
 * Pass the incoming req + res so auth cookies can be read/written.
 *
 * Usage:
 *   import { createClient } from "../src/utils/supabase/server.js";
 *   const supabase = createClient(req, res);
 */
export function createClient(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or publishable key in env.");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        const header = req?.headers?.cookie || "";
        if (!header) return [];
        return header.split(";").map((part) => {
          const idx = part.indexOf("=");
          const name = part.slice(0, idx).trim();
          const value = part.slice(idx + 1).trim();
          return { name, value };
        }).filter((c) => c.name);
      },
      setAll(cookiesToSet) {
        if (!res || typeof res.appendHeader !== "function") return;
        for (const { name, value, options } of cookiesToSet) {
          const parts = [`${name}=${value}`];
          if (options?.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
          if (options?.domain) parts.push(`Domain=${options.domain}`);
          if (options?.path) parts.push(`Path=${options.path}`);
          else parts.push("Path=/");
          if (options?.httpOnly) parts.push("HttpOnly");
          if (options?.secure) parts.push("Secure");
          if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
          res.appendHeader("Set-Cookie", parts.join("; "));
        }
      }
    }
  });
}
