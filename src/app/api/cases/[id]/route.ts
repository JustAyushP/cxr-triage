import { NextResponse } from "next/server";
import { getCase, updateCase } from "@/lib/store";
import { getDoctorIdFromReq, getDoctorEmailFromReq } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { addAuditEntry } from "@/lib/auditLog";
import { findMostSimilarCase } from "@/lib/similarity";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Auth check when Supabase is configured
  if (process.env.SUPABASE_URL) {
    try {
      const requesterDoctorId = await getDoctorIdFromReq(req);

      const { data, error } = await supabase.from("cases").select("id, doctor_id").eq("id", id).limit(1).single();
      if (error || !data) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }

      if (!requesterDoctorId || requesterDoctorId !== data.doctor_id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } catch (err) {
      console.error("case auth error", err);
      return NextResponse.json({ error: "Failed to fetch case" }, { status: 500 });
    }
  }

  // Use the shared getCase (which sanitizes data from Supabase)
  const caseData = await getCase(id);
  if (!caseData) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  // Live similarity check — if no match was found at creation, try now
  if (!caseData.similarCaseId && !caseData.resolution) {
    const match = await findMostSimilarCase(caseData);
    if (match) {
      caseData.similarCaseId = match.caseId;
      caseData.similarityScore = match.score;
      await updateCase(id, { similarCaseId: match.caseId, similarityScore: match.score });
    }
  }

  const email = await getDoctorEmailFromReq(req);
  addAuditEntry("CASE_VIEWED", id, email);
  return NextResponse.json({ caseData });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const { resolution, notes } = body;

  const valid = ["no_finding", "pneumonia", "nodule", "pneumothorax", "other"];
  if (!valid.includes(resolution)) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }

  const updated = await updateCase(id, {
    resolution,
    resolutionNotes: notes || null,
    resolvedAt: new Date().toISOString(),
  });

  if (!updated) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const email = await getDoctorEmailFromReq(req);
  addAuditEntry("CASE_RESOLVED", id, email, `Diagnosis: ${resolution}${notes ? `, Notes: ${notes}` : ""}`);

  return NextResponse.json({ caseData: updated });
}