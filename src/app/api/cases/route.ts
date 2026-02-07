import { NextResponse } from "next/server";
import { saveCase, getAllCases } from "@/lib/store";
import { computeTriage } from "@/lib/triage";

export async function POST(req: Request) {
  const body = await req.json();
  const { patient, predictions, imageFilename } = body;

  const triage = computeTriage(predictions);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  saveCase({
    id,
    patient,
    predictions,
    triage,
    imageFilename,
    report: null,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ id });
}

export async function GET() {
  return NextResponse.json({ cases: getAllCases() });
}