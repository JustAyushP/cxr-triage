"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn() {
    setStatus(null);
    setLoading(true);
    try {
      const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
      if (allowedDomain && !email.endsWith("@" + allowedDomain)) {
        setStatus(`Email must be at domain ${allowedDomain}`);
        setLoading(false);
        return;
      }

      const { data, error } = await (supabaseClient as any).auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data?.user?.id;
      await fetch("/api/auth/upsert-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, name: data?.user?.user_metadata?.name || null }),
      });

      router.push("/");
    } catch (e: any) {
      console.error(e);
      setStatus(e?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CXR Triage</h1>
          <p className="text-sm text-gray-500 mt-1">AI-Powered Chest X-Ray Triage</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Sign In
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your hospital credentials to continue
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.org"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>

            <button
              onClick={handleSignIn}
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          {status && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
