"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import CpfInput from "@/components/forms/CpfInput";
import PhoneInput from "@/components/forms/PhoneInput";
import { supabase, Formando } from "@/lib/supabase";
import { isValidCpf, isValidPhoneBr, onlyDigits } from "@/lib/cpf";

export default function AdesaoPublicaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [turma, setTurma] = useState<Pick<
    Formando,
    "curso" | "instituicao" | "semestre" | "nome"
  > | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    email: "",
    whatsapp: "",
    qtd_luxo: "0",
    qtd_simples: "0",
    tem_fotos: "" as "" | "sim" | "nao" | "nao_sei",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [topError, setTopError] = useState<string | undefined>();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("formandos")
        .select("nome, curso, instituicao, semestre")
        .eq("slug", slug)
        .single();
      if (!data) {
        setNotFound(true);
      } else {
        setTurma(data as any);
      }
      setLoading(false);
    })();
  }, [slug]);

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val } as any));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe seu nome completo.";
    if (form.cpf && !isValidCpf(form.cpf)) e.cpf = "CPF inválido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido.";
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "WhatsApp inválido.";
    const luxo = parseInt(form.qtd_luxo || "0", 10);
    const simples = parseInt(form.qtd_simples || "0", 10);
    if (Number.isNaN(luxo) || luxo < 0) e.qtd_luxo = "Valor inválido.";
    if (Number.isNaN(simples) || simples < 0) e.qtd_simples = "Valor inválido.";
    if (!form.tem_fotos) e.tem_fotos = "Selecione uma opção.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setTopError(undefined);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("adesoes").insert({
        slug_origem: slug,
        nome: form.nome.trim(),
        cpf: form.cpf ? onlyDigits(form.cpf) : null,
        email: form.email.trim().toLowerCase(),
        whatsapp: onlyDigits(form.whatsapp),
        qtd_luxo: parseInt(form.qtd_luxo || "0", 10),
        qtd_simples: parseInt(form.qtd_simples || "0", 10),
        tem_fotos: form.tem_fotos,
        observacoes: form.observacoes.trim() || null,
      });
      if (error) throw error;
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
        <PremiumHeader compact />
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
        <PremiumHeader compact />
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
      <PremiumHeader compact />

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
              {turma?.curso}
            </span>
          </h1>
          <p className="mt-4 text-[11px] uppercase tracking-premium-widest text-text-tertiary">
            {turma?.instituicao} · {turma?.semestre}
          </p>
          <p className="mx-auto mt-7 max-w-md leading-relaxed text-text-secondary">
            Preencha seus dados para receber informações sobre os convites de
            formatura da sua turma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-hover space-y-6 p-6 md:p-9" noValidate>
          <Input
            label="Nome completo"
            name="nome"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            error={errors.nome}
            required
          />

          <CpfInput
            value={form.cpf}
            onChange={(v) => set("cpf", v)}
            onResolved={(d) => {
              if (d.nome && !form.nome) set("nome", d.nome);
            }}
            error={errors.cpf}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              required
            />
            <PhoneInput
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Convites luxo (qtd.)"
              name="qtd_luxo"
              type="number"
              min={0}
              value={form.qtd_luxo}
              onChange={(e) => set("qtd_luxo", e.target.value)}
              error={errors.qtd_luxo}
            />
            <Input
              label="Convites simples (qtd.)"
              name="qtd_simples"
              type="number"
              min={0}
              value={form.qtd_simples}
              onChange={(e) => set("qtd_simples", e.target.value)}
              error={errors.qtd_simples}
            />
          </div>

          <Select
            label="Já tem fotos de formatura prontas?"
            name="tem_fotos"
            value={form.tem_fotos}
            onChange={(e) => set("tem_fotos", e.target.value as any)}
            placeholder="Selecione"
            options={[
              { value: "sim", label: "Sim" },
              { value: "nao", label: "Não" },
              { value: "nao_sei", label: "Ainda não sei" },
            ]}
            error={errors.tem_fotos}
            required
          />

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-premium-widest text-text-tertiary">
              Observações (opcional)
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={4}
              className="input-premium w-full border border-line bg-bg-ice px-4 py-3.5 text-[15px] text-text-primary placeholder:text-text-tertiary/70 transition-all duration-250 hover:border-line-strong"
              placeholder="Conte algo que possa ajudar nossa equipe..."
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
      <Footer />
    </main>
  );
}
