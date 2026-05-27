"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import {
  signOutAndClearSession,
  supabase,
  Representative,
  Student,
  META_CONVITES,
} from "@/lib/supabase";
import { formatCpf, formatDateBr, formatPhone } from "@/lib/format";

function slugifyFile(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminRepresentativePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const representativeId = params?.id;
  const [representative, setRepresentative] = useState<Representative | null>(
    null,
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [marcandoAtendido, setMarcandoAtendido] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  const totalConvites = useMemo(
    () => students.reduce((sum, s) => sum + (s.qtd_convites || 0), 0),
    [students],
  );
  const metaAtingida = totalConvites >= META_CONVITES;
  const atendida = Boolean(representative?.contacted_at);

  async function toggleAtendido() {
    if (!representative) return;
    setMarcandoAtendido(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;

      const res = await fetch(
        `/api/representatives/${representative.id}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ contacted: !atendida }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        setRepresentative((current) =>
          current ? { ...current, contacted_at: data.contacted_at } : current,
        );
      }
    } finally {
      setMarcandoAtendido(false);
    }
  }

  function baixarQr() {
    if (!representative) return;
    const canvas = qrWrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const filename = `qrcode-${slugifyFile(representative.course_name)}-${slugifyFile(representative.institution_name)}.png`;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    if (!representativeId) return;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        router.replace("/admin/login");
        return;
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!admin) {
        await signOutAndClearSession();
        router.replace("/admin/login");
        return;
      }

      const [representativeResult, studentsResult] = await Promise.all([
        supabase
          .from("representatives")
          .select("*")
          .eq("id", representativeId)
          .maybeSingle(),
        supabase
          .from("students")
          .select("*")
          .eq("representative_id", representativeId)
          .order("created_at", { ascending: false }),
      ]);

      if (representativeResult.error || studentsResult.error) {
        setError(
          representativeResult.error?.message ||
            studentsResult.error?.message ||
            "Nao foi possivel carregar os dados.",
        );
      } else {
        setRepresentative(
          (representativeResult.data as Representative | null) || null,
        );
        setStudents((studentsResult.data as Student[]) || []);
      }

      setLoading(false);
    })();
  }, [representativeId, router]);

  async function logout() {
    await signOutAndClearSession();
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando representante
        </p>
      </main>
    );
  }

  if (!representative) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex flex-col">
        <PremiumHeader
          onLogout={logout}
          compact
          centeredBrand
          brandSize="lg"
        />
        <section className="relative flex flex-1 items-center justify-center px-6 pb-20 pt-32">
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />
          <div className="relative max-w-md text-center fade-up">
            <p className="mb-4 text-[10px] uppercase tracking-premium-widest text-wine">
              Registro indisponivel
            </p>
            <h1 className="font-serif text-4xl tracking-premium-tight text-text-primary">
              Representante nao encontrado
            </h1>
            <Link
              href="/admin/dashboard"
              className="btn-secondary-tech mt-8 inline-flex"
            >
              Voltar ao painel
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const adesaoUrl = `${appUrl}/adesao/${representative.slug}`;

  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader
        onLogout={logout}
        compact
        centeredBrand
        brandSize="lg"
        actions={[{ href: "/admin/dashboard", label: "Admin" }]}
      />

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 md:pt-36">
        <div className="absolute left-1/2 top-10 h-[340px] w-[620px] -translate-x-1/2 glow-crimson-soft opacity-60 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-grid-light opacity-50 pointer-events-none" />

        <div className="relative mb-10 fade-up">
          <span className="tech-eyebrow">
            <span className="dot" />
            Representante
          </span>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <h1 className="font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
              {representative.name}
            </h1>
            {atendida ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5b7da3]/30 bg-[#5b7da3]/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#3a5a82]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5b7da3]" />
                Atendido
              </span>
            ) : metaAtingida ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0a7d3a]/30 bg-[#0a7d3a]/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#0a7d3a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0a7d3a] animate-pulse" />
                Meta atingida
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-soft px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
                Pendente
              </span>
            )}
          </div>
          <p className="mt-5 text-text-secondary">
            {representative.course_name} · {representative.institution_name} ·{" "}
            {representative.graduation_year}
          </p>
        </div>

        {/* Resumo de convites + ação de atendimento */}
        <div className="relative mb-6 grid gap-4 md:grid-cols-3 fade-up">
          <div className="card-hover p-5">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Total de convites
            </p>
            <p
              className={`mt-3 font-serif text-4xl tracking-premium-tight ${
                metaAtingida ? "text-[#0a7d3a]" : "text-text-primary"
              }`}
            >
              {totalConvites}
              <span className="ml-2 text-base font-sans text-text-tertiary">
                / {META_CONVITES}
              </span>
            </p>
          </div>
          <div className="card-hover p-5">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Alunos cadastrados
            </p>
            <p className="mt-3 font-serif text-4xl tracking-premium-tight text-text-primary">
              {students.length}
            </p>
          </div>
          <div className="card-hover flex flex-col justify-between p-5">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Ação
            </p>
            {metaAtingida ? (
              <button
                type="button"
                onClick={toggleAtendido}
                disabled={marcandoAtendido}
                className={`mt-3 inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-[11px] uppercase tracking-premium-wide font-semibold transition-all duration-300 ${
                  atendida
                    ? "border-line bg-white text-text-secondary hover:border-text-primary hover:text-text-primary"
                    : "border-[#0a7d3a] bg-[#0a7d3a] text-white hover:bg-[#13b85a]"
                } disabled:opacity-50`}
              >
                {marcandoAtendido
                  ? "Salvando…"
                  : atendida
                    ? "Desfazer atendimento"
                    : "Marcar como atendido"}
              </button>
            ) : (
              <p className="mt-3 text-xs text-text-tertiary">
                Faltam {META_CONVITES - totalConvites} convite(s) para liberar o
                atendimento.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="relative mb-8 border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
            {error}
          </div>
        )}

        <div className="relative grid gap-6 lg:grid-cols-[1fr,360px]">
          <div className="card-hover p-6 md:p-8">
            <div className="mb-8 border-b border-line pb-6">
              <h2 className="font-serif text-2xl tracking-premium-tight text-text-primary">
                Informacoes da turma
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Dados reais do representante e link publico da turma.
              </p>
            </div>

            <dl className="grid gap-5 md:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  Nome representante
                </dt>
                <dd className="mt-2 text-sm text-text-primary">
                  {representative.name}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  Curso
                </dt>
                <dd className="mt-2 text-sm text-text-primary">
                  {representative.course_name}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  Instituicao
                </dt>
                <dd className="mt-2 text-sm text-text-primary">
                  {representative.institution_name}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  Ano
                </dt>
                <dd className="mt-2 text-sm text-text-primary">
                  {representative.graduation_year}
                </dd>
              </div>
            </dl>

            <div className="mt-8">
              <p className="mb-2 text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                Link da turma
              </p>
              <div className="break-all border border-line bg-white/70 px-4 py-3 font-mono text-sm text-text-secondary shadow-[0_1px_0_rgba(255,255,255,0.72)_inset]">
                {adesaoUrl}
              </div>
            </div>
          </div>

          <div className="card-hover flex flex-col items-center justify-center p-8 text-center">
            <div
              ref={qrWrapperRef}
              className="border border-line bg-white/80 p-4 shadow-[0_24px_42px_-34px_rgba(10,10,10,0.42)]"
            >
              <QRCodeCanvas
                value={adesaoUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0A0A0A"
                level="M"
              />
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              QR Code da turma
            </p>
            <button
              type="button"
              onClick={baixarQr}
              className="group mt-4 inline-flex items-center gap-1.5 border border-line bg-white px-3 py-2 text-[10px] uppercase tracking-premium-widest text-text-secondary transition-all duration-300 hover:border-text-primary hover:text-text-primary"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-y-[1px]"
              >
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
              </svg>
              Baixar QR Code
            </button>
          </div>
        </div>

        <div className="relative mt-6 card-hover p-6 md:p-8">
          <div className="mb-8 border-b border-line pb-6">
            <h2 className="font-serif text-2xl tracking-premium-tight text-text-primary">
              Alunos cadastrados
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Somente alunos que preencheram o formulario publico aparecem aqui.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  <th className="py-3 pr-4 font-medium">CPF</th>
                  <th className="py-3 pr-4 font-medium">Nome</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Celular</th>
                  <th className="py-3 pr-4 font-medium text-right">Convites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="py-4 pr-4 font-mono text-text-secondary">
                      {formatCpf(student.cpf)}
                    </td>
                    <td className="py-4 pr-4 text-text-primary">
                      {student.full_name}
                    </td>
                    <td className="py-4 pr-4 text-text-secondary">
                      {student.email}
                    </td>
                    <td className="py-4 pr-4 text-text-secondary">
                      {formatPhone(student.phone)}
                    </td>
                    <td className="py-4 pr-4 text-right font-medium text-text-primary">
                      {student.qtd_convites}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {students.length === 0 && (
              <div className="border-t border-line px-4 py-12 text-center">
                <p className="text-sm text-text-secondary">
                  Nenhum aluno preencheu o formulario desta turma ainda.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
