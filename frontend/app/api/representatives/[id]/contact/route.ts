import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { contacted?: boolean };

export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  const representativeId = ctx.params.id;
  if (!representativeId) {
    return NextResponse.json(
      { ok: false, error: "id required" },
      { status: 400 },
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing auth token" },
      { status: 401 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json(
      { ok: false, error: "Invalid session" },
      { status: 401 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: adminRow } = await admin
    .from("admins")
    .select("id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!adminRow) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    // default = marcar como atendido
  }

  const contactedAt =
    body.contacted === false ? null : new Date().toISOString();

  const { error } = await admin
    .from("representatives")
    .update({ contacted_at: contactedAt })
    .eq("id", representativeId);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, contacted_at: contactedAt });
}
