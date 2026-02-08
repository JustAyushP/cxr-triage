import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, name } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: "missing userId or email" }, { status: 400 });
    }

    if (!process.env.SUPABASE_URL) {
      return NextResponse.json({ ok: false, note: "Supabase not configured" });
    }

    const { data, error } = await supabase.from("doctors").upsert([
      { id: userId, email, name },
    ]);

    if (error) {
      console.error("upsert doctor error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
