"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SYMPTOM_OPTIONS = [
  "Cough",
  "Fever",
  "Chest Pain",
  "Shortness of Breath",
  "Fatigue",
  "Wheezing",
];

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [patientCardFile, setPatientCardFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    sex: "",
    chiefComplaint: "",
    symptoms: [] as string[],
    smoker: false,
    immunocompromised: false,
  });

  function updateField(field: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSymptom(symptom: string) {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handlePatientCard(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPatientCardFile(file);

    // For MVP: handle JSON patient cards
    if (file.name.endsWith(".json")) {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        setForm((prev) => ({
          ...prev,
          name: data.name || prev.name,
          age: data.age?.toString() || prev.age,
          sex: data.sex || prev.sex,
          chiefComplaint: data.chiefComplaint || prev.chiefComplaint,
          symptoms: data.symptoms || prev.symptoms,
          smoker: data.smoker ?? prev.smoker,
          immunocompromised: data.immunocompromised ?? prev.immunocompromised,
        }));
      } catch {
        alert("Invalid JSON patient card");
      }
    }
    // TODO: Add Gemini vision OCR for image-based patient cards later
  }

  async function handleSubmit() {
    if (!imageFile) {
      alert("Please upload a chest X-ray image");
      return;
    }
    if (!form.name || !form.age || !form.sex) {
      alert("Please fill in at least name, age, and sex");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Send X-ray to model
      const inferRes = await fetch("/api/infer", {
        method: "POST",
        body: imageFile,
      });
      const { predictions } = await inferRes.json();

      // Step 2: Create case
      const caseRes = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: {
            ...form,
            age: parseInt(form.age),
          },
          predictions,
          imageFilename: imageFile.name,
        }),
      });
      const { id } = await caseRes.json();

      // Step 3: Navigate to case page
      router.push(`/case/${id}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          New Case — CXR Triage
        </h1>

        {/* Patient Card Upload */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Patient Card (Optional)
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Upload a JSON patient card to autofill the form below
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handlePatientCard}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {patientCardFile && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Loaded: {patientCardFile.name}
            </p>
          )}
        </div>

        {/* Patient Info Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Patient Information
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Patient name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Age"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sex
            </label>
            <select
              value={form.sex}
              onChange={(e) => updateField("sex", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chief Complaint
            </label>
            <textarea
              value={form.chiefComplaint}
              onChange={(e) => updateField("chiefComplaint", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
              placeholder="Primary reason for visit"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symptoms
            </label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    form.symptoms.includes(symptom)
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "bg-gray-100 border-gray-300 text-gray-600"
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.smoker}
                onChange={(e) => updateField("smoker", e.target.checked)}
              />
              Smoker
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.immunocompromised}
                onChange={(e) =>
                  updateField("immunocompromised", e.target.checked)
                }
              />
              Immunocompromised
            </label>
          </div>
        </div>

        {/* X-ray Upload */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Chest X-Ray
          </h2>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="X-ray preview"
                className="max-w-full max-h-64 rounded border"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>
    </div>
  );
}