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

  const [anoStr, semStr] = String(rep.graduation_year || "").split(".");
  const semestreTxt =
    semStr === "1"
      ? "Primeiro Semestre"
      : semStr === "2"
        ? "Segundo Semestre"
        : "";

  const comments = [
    "=== LISTA DE ADESÃO — ALPHA CONVITES ===",
    `Origem do Lead: Lista de Adesão`,
    `Fonte: Marketing`,
    "",
    `Curso: ${rep.course_name}`,
    `Faculdade: ${rep.institution_name}`,
    anoStr ? `Ano de formatura: ${anoStr}` : null,
    semestreTxt ? `Semestre: ${semestreTxt}` : null,
    "",
    `Representante: ${rep.name}`,
    `E-mail: ${rep.email}`,
    "",
    `TOTAL DE CONVITES DESEJADOS: ${total}`,
    `Total de adesões: ${(students || []).length}`,
    "",
    "--- Lista de adesões ---",
    studentsTxt,
  ]
    .filter((l) => l !== null)
    .join("\n");

  // Mapeamento dos campos customizados (IDs das opcoes no Bitrix)
  const ANO_MAP: Record<string, number> = {
    "2025": 759,
    "2026": 761,
    "2027": 10834,
    "2028": 10844,
    "2029": 11700,
  };
  const SEM_MAP: Record<string, number> = { "1": 739, "2": 741 };

  // Campos definitivos. Aplicados via UPDATE porque o crm.lead.add tem um
  // handler interno no Bitrix que limpa fonte/canal/campos customizados.
  const finalFields: Record<string, any> = {
    SOURCE_ID: "WEBFORM", // Fonte = Marketing
    UF_CRM_1531223348: 11718, // Canal de Entrada = Lista de Adesão
    UF_CRM_1690290010: 6726, // 01. Segmento = Convites de Formatura
    UF_CRM_1515146531: rep.course_name, // Curso
    UF_CRM_1515146539: rep.institution_name, // Faculdade
    UF_CRM_1633712858: total, // Quantidade desejada
  };
  if (assignedBy) finalFields.ASSIGNED_BY_ID = Number(assignedBy);
  if (anoStr && ANO_MAP[anoStr]) finalFields.UF_CRM_1515147878 = ANO_MAP[anoStr];
  if (semStr && SEM_MAP[semStr]) finalFields.UF_CRM_1515147809 = SEM_MAP[semStr];

  // Telefones de todos os alunos (sem vazios e sem duplicados)
  const phones = Array.from(
    new Set(
      (students || [])
        .map((s: any) => String(s.phone || "").trim())
        .filter((p) => p.length > 0),
    ),
  ).map((p) => ({ VALUE: p, VALUE_TYPE: "WORK" }));

  const fields: Record<string, any> = {
    TITLE: `Lista de Adesão — ${rep.course_name} / ${rep.institution_name}`,
    NAME: rep.name,
    EMAIL: [{ VALUE: rep.email, VALUE_TYPE: "WORK" }],
    COMMENTS: comments,
    OPPORTUNITY: total,
    CURRENCY_ID: "BRL",
  };
  if (phones.length > 0) fields.PHONE = phones;

  const base = bitrixWebhook.replace(/\/$/, "");
  let leadId: number | undefined;
  try {
    // 1) Cria o lead
    const res = await fetch(`${base}/crm.lead.add.json`, {
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

    // 2) Atualiza com os campos definitivos (sobrescreve o que o handler limpou)
    await fetch(`${base}/crm.lead.update.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, fields: finalFields }),
    });
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
