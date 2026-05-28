import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const META_CONVITES = 30;

type Body = { representative_id?: string };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const representativeId = body.representative_id;
  if (!representativeId) {
    return NextResponse.json(
      { ok: false, error: "representative_id required" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase service not configured" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rep, error: repErr } = await admin
    .from("representatives")
    .select(
      "id, name, email, course_name, institution_name, graduation_year, slug, meta_notified_at",
    )
    .eq("id", representativeId)
    .maybeSingle();

  if (repErr || !rep) {
    return NextResponse.json(
      { ok: false, error: "representative not found" },
      { status: 404 },
    );
  }

  if (rep.meta_notified_at) {
    return NextResponse.json({ ok: true, alreadyNotified: true });
  }

  const { data: convitesRows, error: stErr } = await admin
    .from("students")
    .select("qtd_convites")
    .eq("representative_id", representativeId);

  if (stErr) {
    return NextResponse.json({ ok: false, error: stErr.message }, { status: 500 });
  }

  const total = (convitesRows || []).reduce(
    (sum, s: any) => sum + (s.qtd_convites || 0),
    0,
  );

  if (total < META_CONVITES) {
    return NextResponse.json({ ok: true, total, metaReached: false });
  }

  let bitrixNotified = false;
  let bitrixError: string | undefined;

  const bitrixWebhook = process.env.BITRIX_WEBHOOK_URL;
  const bitrixUserId = process.env.BITRIX_ASSIGNED_BY_ID;

  if (bitrixWebhook && bitrixUserId) {
    try {
      await sendBitrixNotification(bitrixWebhook, {
        userId: Number(bitrixUserId),
        rep,
        total,
        adminUrl:
          (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") +
          "/admin/dashboard",
      });
      bitrixNotified = true;
    } catch (err: any) {
      bitrixError = String(err?.message || err);
    }
  } else {
    bitrixError = "BITRIX_WEBHOOK_URL ou BITRIX_ASSIGNED_BY_ID nao configurados";
  }

  // Marca como notificado independente do Bitrix —
  // o que importa é o painel admin já listar a turma.
  await admin
    .from("representatives")
    .update({ meta_notified_at: new Date().toISOString() })
    .eq("id", representativeId)
    .is("meta_notified_at", null);

  return NextResponse.json({
    ok: true,
    total,
    metaReached: true,
    bitrixNotified,
    bitrixError,
  });
}

async function sendBitrixNotification(
  webhookUrl: string,
  payload: {
    userId: number;
    rep: any;
    total: number;
    adminUrl: string;
  },
): Promise<void> {
  const { userId, rep, total, adminUrl } = payload;

  const message =
    `[B]Lista de Adesão — meta atingida[/B][BR]` +
    `Turma: ${rep.course_name} / ${rep.institution_name} (${rep.graduation_year})[BR]` +
    `Representante: ${rep.name}[BR]` +
    `Total: ${total} convites[BR][BR]` +
    `[URL=${adminUrl}]Abrir painel administrativo →[/URL]`;

  // im.notify do Bitrix espera form-encoded, nao JSON
  const url = webhookUrl.replace(/\/$/, "") + "/im.notify.json";
  const form = new URLSearchParams();
  form.set("to", String(userId));
  form.set("message", message);
  form.set("type", "SYSTEM");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!res.ok) {
    throw new Error(`Bitrix ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Bitrix ${json.error}: ${json.error_description || ""}`);
  }
}
