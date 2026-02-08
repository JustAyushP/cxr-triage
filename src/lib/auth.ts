import { supabase } from "./supabase";

// Extracts Supabase user id from Authorization header (Bearer <token>).
export async function getDoctorIdFromReq(req: Request): Promise<string | null> {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    if (!token) return null;

    // supabase.auth.getUser accepts an access token to verify
    // This is best-effort — if Supabase client API differs, this may need adjustment.
    const { data, error } = await supabase.auth.getUser(token as string);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch (err) {
    console.error("auth verify error", err);
    return null;
  }
}
