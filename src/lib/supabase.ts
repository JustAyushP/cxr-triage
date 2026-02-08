import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

let _supabase: any = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  _supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
} else {
  // Provide a minimal no-op client to avoid runtime crashes when env not set.
  // Calls will either return an error-shaped response or throw, making failures explicit.
  _supabase = {
    from: () => ({
      select: async () => ({ data: null, error: new Error("Supabase not configured") }),
      insert: async () => ({ data: null, error: new Error("Supabase not configured") }),
      upsert: async () => ({ data: null, error: new Error("Supabase not configured") }),
      order: () => ({ data: null, error: new Error("Supabase not configured") }),
      eq: () => ({ data: null, error: new Error("Supabase not configured") }),
    }),
    auth: {
      getUser: async (_token?: string) => ({ data: { user: null }, error: new Error("Supabase not configured") }),
      signOut: async () => ({ error: new Error("Supabase not configured") }),
    },
  };
}

export const supabase = _supabase;
