"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const [password, setPassword] = useState("");

  async function signInWithPasswordOnly() {
    setStatus(null);
    try {
      const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
      if (allowedDomain && !email.endsWith("@" + allowedDomain)) {
        setStatus(`Email must be at domain ${allowedDomain}`);
        return;
      }

      const { data, error } = await (supabaseClient as any).auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus("Signed in with password.");
      const userId = data?.user?.id;
      // notify server to upsert doctor record
      await fetch("/api/auth/upsert-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, email, name: data?.user?.user_metadata?.name || null }),
      });
      // redirect to main page after successful login
      router.push("/");
    } catch (e: any) {
      console.error(e);
      setStatus(e?.message || "Authentication failed.");
    }
  }

  async function signOut() {
    await supabaseClient.auth.signOut();
    setStatus("Signed out");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h1 className="text-lg font-semibold mb-4">Doctor login</h1>
        <p className="text-sm text-gray-600 mb-4">Sign in with your hospital email and password</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@hospital.org"
          className="w-full border rounded px-3 py-2 mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border rounded px-3 py-2 mb-3"
        />
        <div className="flex gap-2">
          <button onClick={signInWithPasswordOnly} className="bg-blue-600 text-white px-4 py-2 rounded">Sign in</button>
          <button onClick={signOut} className="bg-gray-200 px-4 py-2 rounded">Sign out</button>
        </div>
        {status && <p className="text-sm text-gray-600 mt-3">{status}</p>}
      </div>
    </div>
  );
}
