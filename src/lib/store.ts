export type Vital = {
  value: "low" | "normal" | "high" | null;
  individualBaseline: boolean;
};

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
  createdAt: string;
};

import { supabase } from "./supabase";

const inMemory = new Map<string, Case>();

export async function saveCase(c: Case, doctorId?: string | null) {
  // If Supabase not configured, save to in-memory map for dev
  if (!process.env.SUPABASE_URL) {
    inMemory.set(c.id, c);
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
    return inMemory.get(id);
  }

  const { data, error } = await supabase.from("cases").select("data").eq("id", id).limit(1).single();
  if (error || !data) return undefined;
  return data.data as Case;
}

export async function getAllCases(doctorId?: string | null): Promise<Case[]> {
  if (!process.env.SUPABASE_URL) {
    return Array.from(inMemory.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  let query = supabase.from("cases").select("data, doctor_id").order("created_at", { ascending: false });
  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((r: any) => r.data as Case);
}