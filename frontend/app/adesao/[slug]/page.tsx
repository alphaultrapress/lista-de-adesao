"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CpfInput from "@/components/forms/CpfInput";
import PhoneInput from "@/components/forms/PhoneInput";
import AcabamentosShowcase from "@/components/dashboard/AcabamentosShowcase";
import { supabase, PublicRepresentative } from "@/lib/supabase";
import { isValidCpf, isValidPhoneBr, onlyDigits } from "@/lib/cpf";

export default function AdesaoPublicaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [turma, setTurma] = useState<PublicRepresentative | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    cpf: "",
    nome: "",
    data_nascimento: "",
    whatsapp: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [topError, setTopError] = useState<string | undefined>();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      let representative: PublicRepresentative | null = null;

      const { data: rpcData } = await supabase.rpc(
        "get_representative_by_slug",
        { p_slug: slug },
      );
      const rpcRepresentative = Array.isArray(rpcData) ? rpcData[0] : rpcData;

      if (rpcRepresentative) {
        representative = rpcRepresentative as PublicRepresentative;
      } else {
        const { data } = await supabase
          .from("representatives")
          .select("id, name, course_name, institution_name, graduation_year, slug")
          .eq("slug", slug)
          .maybeSingle();

        if (data) {
          representative = data as PublicRepresentative;
        }
      }

      if (!representative) {
        const { data: legacy } = await supabase
          .from("formandos")
          .select("id, nome, curso, instituicao, semestre, slug")
          .eq("slug", slug)
          .maybeSingle();

        if (legacy) {
          representative = {
            id: legacy.id,
            name: legacy.nome,
            course_name: legacy.curso,
            institution_name: legacy.instituicao,
            graduation_year: legacy.semestre,
            slug: legacy.slug,
          };
        }
      }

      if (!representative) {
        setNotFound(true);
      } else {
        setTurma(representative);
      }
      setLoading(false);
    })();
  }, [slug]);

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!isValidCpf(form.cpf)) e.cpf = "CPF inválido.";
    if (!form.nome.trim()) e.nome = "Informe seu nome completo.";
    if (!form.data_nascimento) e.data_nascimento = "Informe a data.";
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "Celular inválido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "E-mail inválido.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setTopError(undefined);
    if (!validate() || !turma) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("students").insert({
        representative_id: turma.id,
        cpf: onlyDigits(form.cpf),
        full_name: form.nome.trim(),
        birth_date: form.data_nascimento,
        phone: onlyDigits(form.whatsapp),
        email: form.email.trim().toLowerCase(),
      });

      if (error?.code === "23505") {
        setErrors((e) => ({
          ...e,
          cpf: "Este CPF já foi cadastrado para esta turma.",
        }));
        return;
      }

      if (error?.code === "42P01") {
        const { error: legacyError } = await supabase.from("adesoes").insert({
          slug_origem: slug,
          cpf: onlyDigits(form.cpf),
          nome: form.nome.trim(),
          data_nascimento: form.data_nascimento,
          whatsapp: onlyDigits(form.whatsapp),
          email: form.email.trim().toLowerCase(),
          qtd_luxo: 0,
          qtd_simples: 0,
          tem_fotos: "nao_sei",
          observacoes: null,
        });
        if (legacyError) throw legacyError;
      } else if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      setTopError(
        err?.message ||
          "Não foi possível enviar sua adesão. Tente novamente em instantes.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex flex-col">
        <PremiumHeader compact centeredBrand brandSize="lg" />
        <section className="relative flex flex-1 items-center justify-center px-6 pb-20 pt-32">
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />
          <div className="relative max-w-md text-center fade-up">
            <p className="mb-4 text-[10px] uppercase tracking-premium-widest text-wine">
              Link inválido
            </p>
            <h1 className="font-serif text-4xl tracking-premium-tight text-text-primary">
              Turma não encontrada
            </h1>
            <p className="mt-5 leading-relaxed text-text-secondary">
              Verifique o link recebido ou peça ao representante da sua turma
              para enviá-lo novamente.
            </p>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (success) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex flex-col">
        <PremiumHeader compact centeredBrand brandSize="lg" />
        <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-20 pt-32">
          <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />
          <div className="relative max-w-lg text-center fade-up">
            <div className="relative mx-auto mb-10 h-20 w-20">
              <div className="absolute inset-0 border border-line-strong" />
              <div className="absolute inset-0 flex items-center justify-center bg-ink-950 text-white">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4L19 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="absolute -inset-3 border border-crimson/20 animate-glow" />
            </div>
            <span className="tech-eyebrow">
              <span className="dot" />
              Adesão registrada
            </span>
            <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
              Recebemos sua
              <br />
              <span className="italic font-light text-gray-500">adesão.</span>
            </h1>
            <p className="mt-6 leading-relaxed text-text-secondary">
              Nossa equipe entrará em contato em breve com mais informações
              sobre os convites de formatura.
            </p>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader compact centeredBrand brandSize="lg" />

      <section className="relative mx-auto max-w-3xl px-6 pb-20 pt-32 md:pt-36">
        <div className="absolute left-1/2 top-10 h-[340px] w-[620px] -translate-x-1/2 glow-crimson-soft opacity-60 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-grid-light opacity-50 pointer-events-none" />

        <div className="relative mb-14 text-center fade-up">
          <span className="tech-eyebrow">
            <span className="dot" />
            Lista de adesão
          </span>
          <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Turma de{" "}
            <span className="italic font-light text-gray-500">
              {turma?.course_name}
            </span>
          </h1>
          <p className="mt-4 text-[11px] uppercase tracking-premium-widest text-text-tertiary">
            {turma?.institution_name} · {turma?.graduation_year}
          </p>
          <p className="mx-auto mt-7 max-w-md leading-relaxed text-text-secondary">
            Preencha seus dados para receber informações sobre os convites de
            formatura da sua turma.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-hover space-y-6 p-6 md:p-9"
          noValidate
        >
          <CpfInput
            value={form.cpf}
            onChange={(v) => set("cpf", v)}
            onResolved={(d) => {
              if (d.nome) set("nome", d.nome);
              if (d.data_nascimento) {
                set("data_nascimento", d.data_nascimento);
              }
            }}
            error={errors.cpf}
            required
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Nome completo"
              name="nome"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              error={errors.nome}
              required
            />
            <Input
              label="Data de nascimento"
              name="data_nascimento"
              type="date"
              value={form.data_nascimento}
              onChange={(e) => set("data_nascimento", e.target.value)}
              error={errors.data_nascimento}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <PhoneInput
              label="Celular"
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              required
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              required
            />
          </div>

          {topError && (
            <div className="border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
              {topError}
            </div>
          )}

          <Button type="submit" loading={submitting} fullWidth>
            {submitting ? "Enviando" : "Enviar minha adesão"}
          </Button>

          <p className="text-center text-xs text-text-tertiary">
            Seus dados são tratados com confidencialidade pela Alpha Convites.
          </p>
        </form>
      </section>
      <AcabamentosShowcase />

      <Footer />
    </main>
  );
}
