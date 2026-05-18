"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import {
  signOutAndClearSession,
  supabase,
  Representative,
  Student,
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
            "Nao foi possivel carregar os dados.",
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

  const studentsByRepresentative = useMemo(() => {
    return students.reduce<Record<string, number>>((acc, student) => {
      acc[student.representative_id] = (acc[student.representative_id] || 0) + 1;
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
          <span className="tech-eyebrow">
            <span className="dot" />
            Painel administrativo
          </span>
          <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Representantes e
            <br />
            <span className="italic font-light text-gray-500">alunos.</span>
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-text-secondary">
            Acompanhe as turmas cadastradas, os links ativos e as adesoes reais
            recebidas pelo formulario publico.
          </p>
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
              Ultima adesao
            </p>
            <p className="mt-4 text-sm font-medium text-text-primary">
              {latestStudent ? latestStudent.full_name : "Sem adesoes"}
            </p>
            <p className="mt-2 text-xs text-text-tertiary">
              {latestStudent ? formatDateTimeBr(latestStudent.created_at) : "-"}
            </p>
          </div>
          <div className="card-hover p-6">
            <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
              Curso com mais adesoes
            </p>
            <p className="mt-4 text-sm font-medium text-text-primary">
              {courseWithMostStudents || "Sem adesoes"}
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
              label="Busca por instituicao"
              value={institutionSearch}
              onChange={(e) => setInstitutionSearch(e.target.value)}
              placeholder="Instituicao"
            />
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  <th className="py-3 pr-4 font-medium">Representante</th>
                  <th className="py-3 pr-4 font-medium">Curso</th>
                  <th className="py-3 pr-4 font-medium">Instituicao</th>
                  <th className="py-3 pr-4 font-medium">Ano</th>
                  <th className="py-3 pr-4 font-medium">Adesoes</th>
                  <th className="py-3 pr-4 font-medium">Cadastro</th>
                  <th className="py-3 text-right font-medium">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRepresentatives.map((representative) => (
                  <tr key={representative.id} className="group transition-colors duration-300 hover:bg-bg-ice relative">
                    <td className="py-4 pr-4 text-text-primary relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-wine opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="pl-4">{representative.name}</span>
                    </td>
                    <td className="py-4 pr-4 text-text-secondary">
                      {representative.course_name}
                    </td>
                    <td className="py-4 pr-4 text-text-secondary">
                      {representative.institution_name}
                    </td>
                    <td className="py-4 pr-4 text-text-secondary">
                      {representative.graduation_year}
                    </td>
                    <td className="py-4 pr-4 text-text-primary">
                      {studentsByRepresentative[representative.id] || 0}
                    </td>
                    <td className="py-4 pr-4 text-text-secondary">
                      {formatDateBr(representative.created_at)}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/admin/dashboard/${representative.id}`}
                        className="btn-secondary-tech inline-flex"
                      >
                        Visualizar
                      </Link>
                    </td>
                  </tr>
                ))}
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

      <Footer />
    </main>
  );
}
