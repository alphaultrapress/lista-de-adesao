import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
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

  // Descobre o user_id (conta de login) do representante para remover também
  // a conta de autenticação e não deixar usuário órfão.
  const { data: rep, error: repErr } = await admin
    .from("representatives")
    .select("user_id")
    .eq("id", representativeId)
    .maybeSingle();

  if (repErr) {
    return NextResponse.json(
      { ok: false, error: repErr.message },
      { status: 500 },
    );
  }

  if (!rep) {
    return NextResponse.json(
      { ok: false, error: "Representante não encontrado" },
      { status: 404 },
    );
  }

  // Apaga a linha do representante. O FK students.representative_id é
  // ON DELETE CASCADE, então os alunos da turma também são removidos.
  const { error: delErr } = await admin
    .from("representatives")
    .delete()
    .eq("id", representativeId);

  if (delErr) {
    return NextResponse.json(
      { ok: false, error: delErr.message },
      { status: 500 },
    );
  }

  // Remove a conta de autenticação associada (best-effort).
  if (rep.user_id) {
    await admin.auth.admin.deleteUser(rep.user_id);
  }

  return NextResponse.json({ ok: true });
}
