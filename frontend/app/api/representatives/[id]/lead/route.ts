import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  const representativeId = ctx.params.id;
  if (!representativeId) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  // --- valida admin ---
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
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
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
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // --- carrega turma + alunos ---
  const { data: rep, error: repErr } = await admin
    .from("representatives")
    .select(
      "id, name, email, course_name, institution_name, graduation_year, slug, lead_created_at",
    )
    .eq("id", representativeId)
    .maybeSingle();
  if (repErr || !rep) {
    return NextResponse.json(
      {
        ok: false,
        error: repErr ? `DB: ${repErr.message}` : "representative not found",
      },
      { status: 404 },
    );
  }

  // consultor é opcional — busca em separado para nao quebrar se a coluna nao existir
  let consultorNome: string | null = null;
  let consultorPhone: string | null = null;
  try {
    const { data: c } = await admin
      .from("representatives")
      .select("consultant_name, consultant_phone")
      .eq("id", representativeId)
      .maybeSingle();
    if (c) {
      consultorNome = (c as any).consultant_name ?? null;
      consultorPhone = (c as any).consultant_phone ?? null;
    }
  } catch {
    // coluna nao existe neste banco — segue sem consultor
  }

  const { data: students } = await admin
    .from("students")
    .select("full_name, email, phone, qtd_convites, created_at")
    .eq("representative_id", representativeId)
    .order("created_at", { ascending: true });

  const total = (students || []).reduce(
    (sum, s: any) => sum + (s.qtd_convites || 0),
    0,
  );

  // --- cria lead no Bitrix ---
  const bitrixWebhook = process.env.BITRIX_WEBHOOK_URL;
  const assignedBy = process.env.BITRIX_ASSIGNED_BY_ID;
  if (!bitrixWebhook) {
    return NextResponse.json(
      { ok: false, error: "BITRIX_WEBHOOK_URL nao configurado" },
      { status: 500 },
    );
  }

  const studentsTxt = (students || [])
    .map(
      (s: any, i: number) =>
        `${i + 1}. ${s.full_name} — ${s.email} · ${s.phone} · ${s.qtd_convites} convite(s)`,
    )
    .join("\n");

  const comments = [
    `Turma: ${rep.course_name} — ${rep.institution_name} (${rep.graduation_year})`,
    `Representante: ${rep.name} <${rep.email}>`,
    consultorNome
      ? `Consultor: ${consultorNome} ${consultorPhone ? `(${consultorPhone})` : ""}`
      : null,
    `Total de convites: ${total}`,
    `Total de adesoes: ${(students || []).length}`,
    "",
    "Lista de adesoes:",
    studentsTxt,
  ]
    .filter(Boolean)
    .join("\n");

  const fields: Record<string, any> = {
    TITLE: `Lista de Adesao — ${rep.course_name} / ${rep.institution_name}`,
    NAME: rep.name,
    EMAIL: [{ VALUE: rep.email, VALUE_TYPE: "WORK" }],
    SOURCE_ID: "WEB",
    COMMENTS: comments,
    OPPORTUNITY: total,
    CURRENCY_ID: "BRL",
  };
  if (assignedBy) fields.ASSIGNED_BY_ID = Number(assignedBy);

  const url = bitrixWebhook.replace(/\/$/, "") + "/crm.lead.add.json";
  let leadId: number | undefined;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields, params: { REGISTER_SONET_EVENT: "Y" } }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return NextResponse.json(
        {
          ok: false,
          error: `Bitrix ${json.error || res.status}: ${json.error_description || ""}`,
        },
        { status: 502 },
      );
    }
    leadId = Number(json.result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 502 },
    );
  }

  // Marca lead_created_at
  await admin
    .from("representatives")
    .update({ lead_created_at: new Date().toISOString() })
    .eq("id", representativeId);

  return NextResponse.json({ ok: true, leadId, total });
}
