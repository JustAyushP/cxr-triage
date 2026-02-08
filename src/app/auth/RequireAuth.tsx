"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "@/lib/supabaseClient";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } = {} } = await (supabaseClient as any).auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }
      } catch (e) {
        router.replace("/login");
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
