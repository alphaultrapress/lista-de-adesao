"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import {
  signOutAndClearSession,
  supabase,
  Representative,
  Student,
  META_CONVITES,
} from "@/lib/supabase";
import { formatDateBr, formatDateTimeBr } from "@/lib/format";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [nameSearch, setNameSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [removingId, setRemovingId] = useState<string | undefined>();
  const [toRemove, setToRemove] = useState<Representative | null>(null);

  useEffect(() => {
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

      const [representativesResult, studentsResult] = await Promise.all([
        supabase
          .from("representatives")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (representativesResult.error || studentsResult.error) {
        setError(
          representativesResult.error?.message ||
            studentsResult.error?.message ||
            "Não foi possível carregar os dados.",
        );
      } else {
        setRepresentatives((representativesResult.data as Representative[]) || []);
        setStudents((studentsResult.data as Student[]) || []);
      }

      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    await signOutAndClearSession();
    router.replace("/admin/login");
  }

  async function confirmRemove() {
    const representative = toRemove;
    if (!representative) return;

    setRemovingId(representative.id);
    setError(undefined);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        router.replace("/admin/login");
        return;
      }

      const res = await fetch(`/api/representatives/${representative.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível remover o representante.");
      }

      setRepresentatives((current) =>
        current.filter((item) => item.id !== representative.id),
      );
      setStudents((current) =>
        current.filter((item) => item.representative_id !== representative.id),
      );
      setToRemove(null);
    } catch (err: any) {
      setError(err?.message || "Não foi possível remover o representante.");
      setToRemove(null);
    } finally {
      setRemovingId(undefined);
    }
  }

  const studentsByRepresentative = useMemo(() => {
    return students.reduce<Record<string, number>>((acc, student) => {
      acc[student.representative_id] = (acc[student.representative_id] || 0) + 1;
      return acc;
    }, {});
  }, [students]);

  const convitesByRepresentative = useMemo(() => {
    return students.reduce<Record<string, number>>((acc, student) => {
      acc[student.representative_id] =
        (acc[student.representative_id] || 0) + (student.qtd_convites || 0);
      return acc;
    }, {});
  }, [students]);

  const representativeById = useMemo(() => {
    return representatives.reduce<Record<string, Representative>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [representatives]);

  const courseWithMostStudents = useMemo(() => {
    const countByCourse = students.reduce<Record<string, number>>((acc, student) => {
      const course = representativeById[student.representative_id]?.course_name;
      if (!course) return acc;
      acc[course] = (acc[course] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countByCourse).sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [representativeById, students]);

  const latestStudent = students[0];

  const filteredRepresentatives = useMemo(() => {
    const normalize = (value: string) => value.trim().toLowerCase();
    const name = normalize(nameSearch);
    const course = normalize(courseSearch);
    const institution = normalize(institutionSearch);

    return representatives.filter((representative) => {
      const matchesName =
        !name || representative.name.toLowerCase().includes(name);
      const matchesCourse =
        !course || representative.course_name.toLowerCase().includes(course);
      const matchesInstitution =
        !institution ||
        representative.institution_name.toLowerCase().includes(institution);

      return matchesName && matchesCourse && matchesInstitution;
    });
  }, [courseSearch, institutionSearch, nameSearch, representatives]);

  if (loading) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando painel administrativo
        </p>
      </main>
    );
  }

  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader
        onLogout={logout}
        logoutLabel="Sair"
        compact
        centeredBrand
        brandSize="lg"
      />

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-32 md:pt-36">
        <div className="absolute right-0 top-0 h-[300px] w-[400px] glow-crimson-soft opacity-50 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-grid-light opacity-50 pointer-events-none" />

        <div className="relative mb-12 fade-up">
          <h1 className="font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Painel <span className="italic font-light text-gray-500">administrativo.</span>
          </h1>
        </div>

        {error && (
          <div className="relative mb-8 border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
            {error}
          </div>
        )}

        <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="card-hover p-6">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Total representantes
            </p>
            <p className="mt-4 font-serif text-4xl tracking-premium-tight text-text-primary">
              {representatives.length}
            </p>
          </div>
          <div className="card-hover p-6">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Total alunos cadastrados
            </p>
            <p className="mt-4 font-serif text-4xl tracking-premium-tight text-text-primary">
              {students.length}
            </p>
          </div>
          <div className="card-hover p-6">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Última adesão
            </p>
            <p className="mt-4 text-sm font-medium text-text-primary">
              {latestStudent ? latestStudent.full_name : "Sem adesões"}
            </p>
            <p className="mt-2 text-xs text-text-tertiary">
              {latestStudent ? formatDateTimeBr(latestStudent.created_at) : "-"}
            </p>
          </div>
          <div className="card-hover p-6">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Curso com mais adesões
            </p>
            <p className="mt-4 text-sm font-medium text-text-primary">
              {courseWithMostStudents || "Sem adesões"}
            </p>
          </div>
        </div>

        <div className="relative mt-6 card-hover p-6 md:p-8">
          <div className="mb-8 border-b border-line pb-6">
            <h2 className="font-serif text-2xl tracking-premium-tight text-text-primary">
              Representantes
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Filtre por nome, curso ou instituicao para encontrar uma turma.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Busca por nome"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Nome representante"
            />
            <Input
              label="Busca por curso"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Curso"
            />
            <Input
              label="Busca por instituição"
              value={institutionSearch}
              onChange={(e) => setInstitutionSearch(e.target.value)}
              placeholder="Instituição"
            />
          </div>

          <div className="mt-8">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[11%]" />
                <col className="w-[17%]" />
                <col className="w-[5%]" />
                <col className="w-[6%]" />
                <col className="w-[9%]" />
                <col className="w-[7%]" />
                <col className="w-[11%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  <th className="py-3 pr-4 font-medium">Representante</th>
                  <th className="py-3 pr-4 font-medium">Curso</th>
                  <th className="py-3 pr-4 font-medium">Instituição</th>
                  <th className="py-3 pr-4 text-center font-medium">UF</th>
                  <th className="py-3 pr-4 text-center font-medium">Ano</th>
                  <th className="py-3 pr-4 text-center font-medium">Convites</th>
                  <th className="py-3 pr-4 text-center font-medium">Adesões</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRepresentatives.map((representative) => {
                  const totalConvites =
                    convitesByRepresentative[representative.id] || 0;
                  const adesoes =
                    studentsByRepresentative[representative.id] || 0;
                  const metaAtingida = totalConvites >= META_CONVITES;
                  const atendida = Boolean(representative.contacted_at);

                  return (
                    <tr
                      key={representative.id}
                      className="group transition-colors duration-300 hover:bg-bg-ice relative"
                    >
                      <td className="relative py-4 pr-4 text-text-primary">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-wine opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="block pl-4 font-medium leading-snug line-clamp-2" title={representative.name}>
                          {representative.name}
                        </span>
                      </td>
                      <td className="truncate py-4 pr-4 text-text-secondary" title={representative.course_name}>
                        {representative.course_name}
                      </td>
                      <td className="py-4 pr-4 text-text-secondary" title={representative.institution_name}>
                        <span className="line-clamp-2">
                          {representative.institution_name}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-center font-semibold uppercase tabular-nums text-text-secondary">
                        {representative.state || "—"}
                      </td>
                      <td className="py-4 pr-4 text-center text-text-secondary tabular-nums">
                        {representative.graduation_year}
                      </td>
                      <td className="py-4 pr-4 text-center whitespace-nowrap">
                        <span
                          className={`font-semibold tabular-nums ${
                            metaAtingida
                              ? "text-[#0a7d3a]"
                              : "text-text-primary"
                          }`}
                        >
                          {totalConvites}
                        </span>
                        <span className="ml-1 text-xs text-text-tertiary">
                          / {META_CONVITES}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-center text-text-primary tabular-nums">
                        {adesoes}
                      </td>
                      <td className="py-4 pr-4">
                        {atendida ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#5b7da3]/30 bg-[#5b7da3]/8 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-[#3a5a82]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#5b7da3]" />
                            Atendido
                          </span>
                        ) : metaAtingida ? (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#0a7d3a]/30 bg-[#0a7d3a]/8 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-[#0a7d3a]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0a7d3a] animate-pulse" />
                            Meta atingida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-bg-soft px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wider text-text-tertiary">
                            <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-4 pl-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/dashboard/${representative.id}`}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-line bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary transition-all duration-300 hover:border-text-primary hover:-translate-y-[1px]"
                          >
                            Visualizar
                          </Link>
                          <button
                            type="button"
                            onClick={() => setToRemove(representative)}
                            title="Remover representante"
                            aria-label={`Remover ${representative.name}`}
                            className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-wine/30 bg-white text-wine transition-all duration-300 hover:border-wine hover:bg-wine/5 hover:-translate-y-[1px]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRepresentatives.length === 0 && (
              <div className="border-t border-line px-4 py-12 text-center">
                <p className="text-sm text-text-secondary">
                  Nenhum representante encontrado.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <ConfirmDeleteModal
        open={Boolean(toRemove)}
        name={toRemove?.name}
        loading={Boolean(removingId)}
        onConfirm={confirmRemove}
        onClose={() => {
          if (removingId) return;
          setToRemove(null);
        }}
      />

      <Footer />
    </main>
  );
}
