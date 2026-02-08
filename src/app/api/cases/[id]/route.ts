import { NextResponse } from "next/server";
import { getCase } from "@/lib/store";
import { getDoctorIdFromReq } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // Prefer server-side DB check when Supabase is configured
  if (process.env.SUPABASE_URL) {
    try {
      // verify requester
      const requesterDoctorId = await getDoctorIdFromReq(req);

      const { data, error } = await supabase.from("cases").select("id, data, doctor_id").eq("id", id).limit(1).single();
      if (error || !data) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      const ownerId = data.doctor_id;
      if (!requesterDoctorId || requesterDoctorId !== ownerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json({ caseData: data.data });
    } catch (err) {
      console.error("case fetch error", err);
      return NextResponse.json({ error: "Failed to fetch case" }, { status: 500 });
    }
  }

  // Fallback to in-memory store for dev
  const caseData = await getCase(id);
  if (!caseData) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // no auth in dev fallback
  return NextResponse.json({ caseData });
}