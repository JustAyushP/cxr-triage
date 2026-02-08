import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _client: any = null;

if (supabaseUrl && supabaseAnonKey) {
  _client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Provide a minimal fallback client to avoid crashing in development when env vars
  // are not set. This makes failures explicit and allows the app to run.
  const notConfiguredError = new Error("Supabase client not configured (NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY missing)");
  _client = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: notConfiguredError }),
      getSession: async () => ({ data: { session: null }, error: notConfiguredError }),
      signOut: async () => ({ error: notConfiguredError }),
      signInWithOtp: async () => ({ error: notConfiguredError }),
      signInWithPassword: async () => ({ data: { user: null }, error: notConfiguredError }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: async () => ({ data: null, error: notConfiguredError }),
    }),
  };
}

export const supabaseClient = _client;

export async function getCurrentUser() {
  try {
    const res = await supabaseClient.auth.getUser();
    return res?.data?.user || null;
  } catch (err) {
    return null;
  }
}

export default supabaseClient;
