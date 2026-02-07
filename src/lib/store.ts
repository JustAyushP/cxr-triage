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

const cases = new Map<string, Case>();

export function saveCase(c: Case) {
  cases.set(c.id, c);
}

export function getCase(id: string): Case | undefined {
  return cases.get(id);
}

export function getAllCases(): Case[] {
  return Array.from(cases.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}