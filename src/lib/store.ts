export type Vital = {
  value: "low" | "normal" | "high" | null;
  individualBaseline: boolean;
};

export type Resolution =
  | "no_finding"
  | "pneumonia"
  | "nodule"
  | "pneumothorax"
  | "other"
  | null;

export type Case = {
  id: string;
  patient: {
    name: string;
    age: number;
    sex: string;
    chiefComplaint: string;
    vitals: {
      spo2: Vital;
      bp: Vital;
      rr: Vital;
      hr: Vital;
      temperature: Vital;
    };
    symptoms: {
      breathlessness: "low" | "normal" | "high" | null;
      dyspneaOnExertion: "low" | "normal" | "high" | null;
      cough: "low" | "normal" | "high" | null;
      chestPain: "low" | "normal" | "high" | null;
      sputum: "low" | "normal" | "high" | null;
      hemoptysis: "low" | "normal" | "high" | null;
    };
    examFindings: {
      breathSounds: "absent" | "normal" | "present" | null;
      crackles: "absent" | "normal" | "present" | null;
      bronchialBreathSounds: "absent" | "normal" | "present" | null;
      trachealDeviation: "absent" | "normal" | "present" | null;
    };
    smoker: boolean;
    immunocompromised: boolean;
  };
  imageFilename: string;
  imageData: string | null;
  predictions: {
    pneumothorax: number;
    pneumonia: number;
    nodule: number;
  } | null;
  triage: {
    level: "URGENT" | "REVIEW" | "ROUTINE";
    reason: string;
    flags: {
      pneumothorax: "low" | "review" | "urgent";
      pneumonia: "low" | "review" | "urgent";
      nodule: "low" | "review" | "urgent";
    };
  } | null;
  report: string | null;
  resolution: Resolution;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  similarCaseId: string | null;
  similarityScore: number | null;
  createdAt: string;
};

import { supabase } from "./supabase";

/**
 * Sanitize a Case read from Supabase JSONB.
 * Some fields may have been stored as {} (e.g. from un-awaited Promises
 * serialised via JSON.stringify) instead of the expected primitive type.
 * This ensures every rendered field is safe for React.
 */
function sanitizeCase(c: any): Case {
  if (!c || typeof c !== "object") return c;

  // Ensure top-level string fields
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v : fallback;
  const num = (v: unknown, fallback = 0) =>
    typeof v === "number" ? v : fallback;

  c.id = str(c.id, c.id);
  c.createdAt = str(c.createdAt, new Date().toISOString());
  c.imageFilename = str(c.imageFilename, "");
  c.resolution = typeof c.resolution === "string" ? c.resolution : null;
  c.resolutionNotes = typeof c.resolutionNotes === "string" ? c.resolutionNotes : null;
  c.resolvedAt = typeof c.resolvedAt === "string" ? c.resolvedAt : null;
  c.similarCaseId = typeof c.similarCaseId === "string" ? c.similarCaseId : null;
  c.similarityScore = typeof c.similarityScore === "number" ? c.similarityScore : null;
  c.report = typeof c.report === "string" ? c.report : null;
  c.imageData = typeof c.imageData === "string" ? c.imageData : null;

  // Ensure patient object
  if (!c.patient || typeof c.patient !== "object") {
    c.patient = { name: "Unknown", age: 0, sex: "Unknown", chiefComplaint: "", vitals: {}, symptoms: {}, examFindings: {}, smoker: false, immunocompromised: false };
  } else {
    c.patient.name = str(c.patient.name, "Unknown");
    c.patient.age = num(c.patient.age, 0);
    c.patient.sex = str(c.patient.sex, "Unknown");
    c.patient.chiefComplaint = str(c.patient.chiefComplaint, "");
  }

  // Ensure triage object
  if (!c.triage || typeof c.triage !== "object" || !c.triage.level) {
    c.triage = { level: "ROUTINE", reason: "Unable to determine triage", flags: { pneumothorax: "low", pneumonia: "low", nodule: "low" } };
  } else {
    c.triage.reason = str(c.triage.reason, "");
  }

  // Ensure predictions object
  if (!c.predictions || typeof c.predictions !== "object") {
    c.predictions = { pneumothorax: 0, pneumonia: 0, nodule: 0 };
  } else {
    c.predictions.pneumothorax = num(c.predictions.pneumothorax, 0);
    c.predictions.pneumonia = num(c.predictions.pneumonia, 0);
    c.predictions.nodule = num(c.predictions.nodule, 0);
  }

  return c as Case;
}

// Attach to globalThis so the store survives Turbopack module isolation
// and hot reloads — without this, each API route gets its own empty Map.
const globalForStore = globalThis as unknown as {
  __cxrCases: Map<string, Case>;
  __cxrCaseCounter: number;
};
if (!globalForStore.__cxrCases) {
  globalForStore.__cxrCases = new Map<string, Case>();
}
if (!globalForStore.__cxrCaseCounter) {
  globalForStore.__cxrCaseCounter = 0;
}
const cases = globalForStore.__cxrCases;

/** Generate a human-readable case ID like CXR-001, CXR-002, etc. */
let _counterInitialized = false;

async function ensureCounterSynced(): Promise<void> {
  if (_counterInitialized) return;
  _counterInitialized = true;

  if (!process.env.SUPABASE_URL) {
    // In-memory mode: counter is already correct from existing map
    const existing = Array.from(cases.keys());
    let max = 0;
    for (const id of existing) {
      const num = parseInt(id.replace("CXR-", ""), 10);
      if (!isNaN(num) && num > max) max = num;
    }
    globalForStore.__cxrCaseCounter = max;
    return;
  }

  // Supabase mode: find the highest CXR-NNN id in the database
  try {
    const { data } = await supabase
      .from("cases")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(100);

    let max = 0;
    if (data) {
      for (const row of data) {
        const num = parseInt((row.id as string).replace("CXR-", ""), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    }
    globalForStore.__cxrCaseCounter = max;
  } catch {
    // If query fails, keep whatever counter we have
  }
}

export async function nextCaseId(): Promise<string> {
  await ensureCounterSynced();
  globalForStore.__cxrCaseCounter += 1;
  return `CXR-${String(globalForStore.__cxrCaseCounter).padStart(3, "0")}`;
}

export async function saveCase(c: Case, doctorId?: string | null) {
  // If Supabase not configured, save to in-memory map for dev
  if (!process.env.SUPABASE_URL) {
    cases.set(c.id, c);
    return;
  }

  await supabase.from("cases").upsert({
    id: c.id,
    data: c,
    image_filename: c.imageFilename,
    created_at: c.createdAt,
    doctor_id: doctorId || null,
  });
}

export async function getCase(id: string): Promise<Case | undefined> {
  if (!process.env.SUPABASE_URL) {
    return cases.get(id);
  }

  const { data, error } = await supabase.from("cases").select("id, data").eq("id", id).limit(1).single();
  if (error || !data) return undefined;
  const c = sanitizeCase(data.data);
  c.id = data.id;
  return c;
}

export async function getAllCases(doctorId?: string | null): Promise<Case[]> {
  if (!process.env.SUPABASE_URL) {
    return Array.from(cases.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  let query = supabase.from("cases").select("id, data, doctor_id").order("created_at", { ascending: false });
  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((r: any) => {
    const c = sanitizeCase(r.data);
    c.id = r.id;
    return c;
  });
}

export async function updateCase(
  id: string,
  updates: Partial<Pick<Case, "resolution" | "resolutionNotes" | "resolvedAt" | "similarCaseId" | "similarityScore">>
): Promise<Case | undefined> {
  if (!process.env.SUPABASE_URL) {
    // In-memory path
    const existing = cases.get(id);
    if (!existing) return undefined;

    const updated: Case = { ...existing };
    if (updates.resolution !== undefined) updated.resolution = updates.resolution;
    if (updates.resolutionNotes !== undefined) updated.resolutionNotes = updates.resolutionNotes;
    if (updates.resolvedAt !== undefined) updated.resolvedAt = updates.resolvedAt;
    if (updates.similarCaseId !== undefined) updated.similarCaseId = updates.similarCaseId;
    if (updates.similarityScore !== undefined) updated.similarityScore = updates.similarityScore;

    cases.set(id, updated);
    return updated;
  }

  // Supabase path — fetch, merge, and upsert
  const { data, error } = await supabase
    .from("cases")
    .select("id, data")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) return undefined;

  const existing = sanitizeCase(data.data);
  existing.id = data.id;

  const updated: Case = { ...existing };
  if (updates.resolution !== undefined) updated.resolution = updates.resolution;
  if (updates.resolutionNotes !== undefined) updated.resolutionNotes = updates.resolutionNotes;
  if (updates.resolvedAt !== undefined) updated.resolvedAt = updates.resolvedAt;
  if (updates.similarCaseId !== undefined) updated.similarCaseId = updates.similarCaseId;
  if (updates.similarityScore !== undefined) updated.similarityScore = updates.similarityScore;

  const { error: updateError } = await supabase
    .from("cases")
    .update({ data: updated })
    .eq("id", id);

  if (updateError) {
    console.error("updateCase supabase error", updateError);
    return undefined;
  }

  return updated;
}

export async function getResolvedCases(): Promise<Case[]> {
  if (!process.env.SUPABASE_URL) {
    return Array.from(cases.values()).filter((c) => c.resolution !== null);
  }

  // Supabase path — fetch all cases and filter for resolved ones
  const { data, error } = await supabase
    .from("cases")
    .select("id, data")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data
    .map((r: any) => {
      const c = sanitizeCase(r.data);
      c.id = r.id;
      return c;
    })
    .filter((c) => c.resolution !== null);
}