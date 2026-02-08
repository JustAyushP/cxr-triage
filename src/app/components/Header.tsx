"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabaseClient from "@/lib/supabaseClient";

export default function Header() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let sub: any = null;
    (async () => {
      try {
        const { data: { session } = {} } = await (supabaseClient as any).auth.getSession();
        setEmail(session?.user?.email || null);
      } catch {
        setEmail(null);
      }

      // listen for auth changes so header updates immediately
      try {
        const { data } = (supabaseClient as any).auth.onAuthStateChange((event: any, session: any) => {
          // Update displayed id immediately on changes
          setEmail(session?.user?.email || null);
          // If we detect a sign-out event, redirect to login (after sign-out completes)
          if (event === "SIGNED_OUT") {
            try {
              // use replace so back button doesn't re-open protected pages
              router.replace("/login");
            } catch (e) {}
          }
        });
        sub = data?.subscription;
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      try {
        if (sub?.unsubscribe) sub.unsubscribe();
      } catch (e) {}
    };
  }, []);

  async function handleSignOut() {
    try {
      // trigger sign out; the auth listener will handle redirect and header update
      await (supabaseClient as any).auth.signOut();
    } catch (e) {
      console.error("sign out error", e);
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-3">
        {email ? (
          <>
            <span className="text-sm text-gray-700 hidden sm:inline">{email.split("@")[0]}</span>
            <button
              onClick={handleSignOut}
              className="bg-gray-100 border border-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-50"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
