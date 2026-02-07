"use client";

import { useState, useEffect, use } from "react";

type Case = {
  id: string;
  patient: {
    name: string;
    age: number;
    sex: string;
    chiefComplaint: string;
    symptoms: string[];
    smoker: boolean;
    immunocompromised: boolean;
  };
  predictions: {
    pneumothorax: number;
    pneumonia: number;
    nodule: number;
  };
  triage: {
    level: "URGENT" | "REVIEW" | "ROUTINE";
    reason: string;
    flags: {
      pneumothorax: "low" | "review" | "urgent";
      pneumonia: "low" | "review" | "urgent";
      nodule: "low" | "review" | "urgent";
    };
  };
  report: string | null;
  createdAt: string;
};

const BADGE_COLORS = {
  URGENT: "bg-red-600",
  REVIEW: "bg-yellow-500",
  ROUTINE: "bg-green-600",
};

const FLAG_COLORS = {
  urgent: "text-red-600",
  review: "text-yellow-600",
  low: "text-green-600",
};

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Case not found");
        return res.json();
      })
      .then((data) => setCaseData(data.caseData))
      .catch(() => setError("Case not found"));
  }, [id]);

  async function generateReport() {
    if (!caseData) return;
    setLoadingReport(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: caseData.patient,
          predictions: caseData.predictions,
          triage: caseData.triage,
        }),
      });
      const data = await res.json();
      setReport(data.report);
    } catch {
      alert("Failed to generate report");
    } finally {
      setLoadingReport(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading case...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Case: {caseData.patient.name}
          </h1>
          <span
            className={`${BADGE_COLORS[caseData.triage.level]} text-white px-5 py-2 rounded-full text-lg font-bold`}
          >
            {caseData.triage.level}
          </span>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Patient Information
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <p>Age: {caseData.patient.age}</p>
            <p>Sex: {caseData.patient.sex}</p>
            <p>Chief Complaint: {caseData.patient.chiefComplaint}</p>
            <p>Symptoms: {caseData.patient.symptoms.join(", ") || "None"}</p>
            <p>Smoker: {caseData.patient.smoker ? "Yes" : "No"}</p>
            <p>
              Immunocompromised:{" "}
              {caseData.patient.immunocompromised ? "Yes" : "No"}
            </p>
          </div>
        </div>

        {/* Triage Reason */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Triage Summary
          </h2>
          <p className="text-sm text-gray-700">{caseData.triage.reason}</p>
        </div>

        {/* Predictions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Model Predictions
          </h2>
          {(
            Object.entries(caseData.predictions) as [string, number][]
          ).map(([condition, probability]) => (
            <div key={condition} className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {condition}
                </span>
                <span className="text-sm">
                  <span className="font-semibold">
                    {(probability * 100).toFixed(1)}%
                  </span>
                  {" — "}
                  <span
                    className={`font-semibold ${FLAG_COLORS[caseData.triage.flags[condition as keyof typeof caseData.triage.flags]]}`}
                  >
                    {caseData.triage.flags[
                      condition as keyof typeof caseData.triage.flags
                    ].toUpperCase()}
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${probability * 100}%` }}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-4">
            Model version: MVP-mock • {new Date(caseData.createdAt).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            Explainability (heatmaps) not available in MVP
          </p>
        </div>

        {/* Report */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            AI-Generated Report
          </h2>
          {report ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded">
              {report}
            </pre>
          ) : (
            <button
              onClick={generateReport}
              disabled={loadingReport}
              className="bg-purple-600 text-white px-6 py-2 rounded font-semibold hover:bg-purple-700 disabled:bg-gray-400"
            >
              {loadingReport ? "Generating Report..." : "Generate Report"}
            </button>
          )}
        </div>

        {/* Export */}
        <button
          onClick={() => {
            const bundle = { ...caseData, report };
            const blob = new Blob([JSON.stringify(bundle, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `case-${caseData.id}.json`;
            a.click();
          }}
          className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900"
        >
          Export Case Bundle (JSON)
        </button>
      </div>
    </div>
  );
}