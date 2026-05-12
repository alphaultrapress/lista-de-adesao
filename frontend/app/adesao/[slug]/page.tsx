"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Brand, Footer } from "@/components/Brand";
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
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-bg flex flex-col">
        <header className="bg-ink">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center">
            <Brand size="sm" variant="light" />
          </div>
        </header>
        <section className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <p className="text-[10px] tracking-premium-widest uppercase text-wine mb-4">
              Link inválido
            </p>
            <h1 className="font-serif text-4xl text-text-primary tracking-premium-tight">
              Turma não encontrada
            </h1>
            <p className="mt-5 text-text-secondary leading-relaxed">
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
      <main className="min-h-screen bg-bg flex flex-col">
        <header className="bg-ink">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center">
            <Brand size="sm" variant="light" />
          </div>
        </header>
        <section className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-lg fade-in">
            <div className="w-16 h-16 mx-auto mb-10 rounded-full border border-champagne flex items-center justify-center text-champagne-deep">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12l4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[10px] tracking-premium-widest uppercase text-champagne-deep mb-4">
              Adesão registrada
            </p>
            <h1 className="font-serif text-4xl md:text-5xl tracking-premium-tight text-text-primary">
              Recebemos sua adesão.
            </h1>
            <p className="mt-5 text-text-secondary leading-relaxed">
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
    <main className="min-h-screen bg-bg">
      <header className="bg-ink">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center">
          <Brand size="sm" variant="light" />
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-premium-widest uppercase text-champagne-deep mb-4">
            Lista de adesão
          </p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-premium-tight text-text-primary">
            Turma de{" "}
            <span className="italic text-text-secondary">{turma?.curso}</span>
          </h1>
          <p className="mt-3 text-sm text-text-secondary tracking-premium-wide uppercase">
            {turma?.instituicao} · {turma?.semestre}
          </p>
          <p className="mt-7 text-text-secondary max-w-md mx-auto leading-relaxed">
            Preencha seus dados para receber informações sobre os convites de
            formatura da sua turma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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

          <div className="grid md:grid-cols-2 gap-6">
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

          <div className="grid md:grid-cols-2 gap-6">
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
            <label className="block mb-2 text-[10px] tracking-premium-widest uppercase text-text-tertiary font-medium">
              Observações (opcional)
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={4}
              className="input-premium w-full bg-bg-ice border border-line hover:border-line-strong text-text-primary px-4 py-3.5 text-[15px] placeholder:text-text-tertiary/70 transition-all duration-250"
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
