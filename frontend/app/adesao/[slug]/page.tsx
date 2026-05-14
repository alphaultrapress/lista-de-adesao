"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CpfInput from "@/components/forms/CpfInput";
import PhoneInput from "@/components/forms/PhoneInput";
import AcabamentosShowcase from "@/components/dashboard/AcabamentosShowcase";
import SocialProof from "@/components/SocialProof";
import { SOCIAL } from "@/lib/social";
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
          "Não foi possível enviar seu interesse. Tente novamente em instantes.",
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
          <div className="relative max-w-2xl text-center fade-up">
            <div className="relative mx-auto mb-10 h-20 w-20">
              <div className="absolute inset-0 border border-[#00ff7f]/60 bg-[#00ff7f] shadow-[0_0_24px_rgba(0,255,127,0.35)]" />
              <div className="absolute inset-0 flex items-center justify-center text-ink">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4L19 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="absolute -inset-3 border border-[#00ff7f]/25 shadow-[0_0_44px_rgba(0,255,127,0.18)] animate-glow" />
            </div>
            <span className="tech-eyebrow">
              <span className="dot" />
              Interesse registrado
            </span>
            <div className="mt-7 flex flex-col items-center justify-center gap-5 md:flex-row md:gap-8">
              <h1 className="font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
                Recebemos seu
                <br />
                <span className="italic font-light text-gray-500">interesse.</span>
              </h1>
              <Image
                src="/logos/logo-dark.png"
                alt="Alpha Convites"
                width={420}
                height={140}
                priority
                className="h-auto w-[120px] md:w-[150px]"
              />
            </div>
            <p className="mt-6 leading-relaxed text-text-secondary">
              Nossa equipe entrará em contato em breve para apresentar as
              possibilidades de convites para a sua turma, sem compromisso.
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

      <section className="relative mx-auto max-w-3xl px-6 pb-20 pt-36 md:pt-44">
        <div className="absolute left-1/2 top-10 h-[380px] w-[680px] -translate-x-1/2 glow-crimson-soft opacity-60 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[460px] bg-grid-light opacity-50 pointer-events-none" />

        <div className="relative mb-20 text-center fade-up">
          <span className="tech-eyebrow">
            <span className="dot" />
            Lista de interesse da turma
          </span>

          <h1 className="mt-8 font-serif text-[2.6rem] leading-[1.04] tracking-premium-tight text-text-primary md:text-6xl">
            Sua turma merece um{" "}
            <span className="italic font-light text-gray-500">
              convite inesquecível.
            </span>
          </h1>

          <div
            aria-hidden
            className="mx-auto mt-9 h-px w-24 md:w-32"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />

          <p className="mt-9 font-serif text-lg italic text-text-secondary md:text-xl">
            Turma de {turma?.course_name}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-premium-widest text-text-tertiary">
            {turma?.institution_name} · {turma?.graduation_year}
          </p>

          <p className="mx-auto mt-10 max-w-xl leading-relaxed text-text-secondary md:text-lg">
            Conheça os convites, acabamentos e possibilidades que a Alpha
            prepara para turmas de todo o Brasil.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="#interesse"
              className="group inline-flex items-center justify-center gap-2 bg-ink px-7 py-3.5 text-sm uppercase tracking-premium-wide text-text-inverse transition-all duration-450 ease-premium hover:bg-ink-700"
            >
              <span>Quero demonstrar interesse</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="transition-transform duration-450 ease-premium group-hover:translate-y-0.5"
              >
                <path
                  d="M12 5v14M6 13l6 6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href={SOCIAL.instagram ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 border border-line-strong bg-transparent px-7 py-3.5 text-sm uppercase tracking-premium-wide text-text-primary transition-all duration-450 ease-premium hover:border-ink hover:bg-ink hover:text-text-inverse"
            >
              <span>Conheça nosso Instagram</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="transition-transform duration-450 ease-premium group-hover:translate-x-0.5"
              >
                <path
                  d="M7 17L17 7M9 7h8v8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <ul className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-3 text-[11px] uppercase tracking-premium-wide text-text-tertiary md:flex md:flex-wrap md:justify-center md:gap-x-8">
            {[
              "Modelos exclusivos",
              "Acabamentos premium",
              "Atendimento especializado",
              "+50 anos de tradição",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center justify-center gap-2"
              >
                <span
                  aria-hidden
                  className="inline-block h-1 w-1 rotate-45"
                  style={{ background: "#C9A961" }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </section>

      <section className="relative overflow-hidden bg-bg-ice py-20 md:py-24">
        <div className="absolute inset-0 bg-grid-tech bg-[length:48px_48px] opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-6 text-center fade-up">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Nossa história
          </span>
          <h2 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Há mais de 50 anos{" "}
            <span className="italic font-light text-gray-500">
              transformando histórias em memórias.
            </span>
          </h2>
          <p className="mx-auto mt-7 max-w-2xl leading-relaxed text-text-secondary md:text-lg">
            A Alpha acompanha momentos especiais através de convites que unem
            tradição, sofisticação e acabamentos exclusivos.
          </p>

          <div
            aria-hidden
            className="mx-auto mt-12 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 md:gap-10">
            {[
              { value: "50+", label: "anos transformando histórias em memórias" },
              { value: "30+", label: "anos sob a segunda geração" },
              { value: "Brasil", label: "turmas atendidas em todo o país" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <dt className="font-serif text-4xl leading-none tracking-premium-tight text-text-primary md:text-6xl">
                  {item.value}
                </dt>
                <dd className="mt-3 max-w-[14rem] text-[11px] uppercase leading-relaxed tracking-premium-wide text-text-tertiary md:text-xs">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="mb-14 text-center fade-up md:mb-16">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Simples e sem compromisso
          </span>
          <h2 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Como{" "}
            <span className="italic font-light text-gray-500">funciona?</span>
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-8 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />
        </div>

        <ol className="relative mx-auto max-w-5xl">
          <div
            aria-hidden
            className="absolute left-7 top-7 bottom-7 w-px md:hidden"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, #C9A961 12%, #C9A961 88%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute left-[10%] right-[10%] top-7 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 12%, #C9A961 88%, transparent 100%)",
            }}
          />

          <div className="grid gap-10 md:grid-cols-4 md:gap-6">
            {[
              "Compartilhe o link com sua turma",
              "Cada interessado preenche rapidamente",
              "Nossa equipe analisa o interesse da turma",
              "Entramos em contato com possibilidades e condições especiais",
            ].map((step, index) => (
              <li
                key={step}
                className="relative flex items-start gap-5 md:flex-col md:items-center md:gap-6 md:text-center"
              >
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line-strong bg-bg-white shadow-[0_4px_20px_rgba(10,10,10,0.04)]">
                  <span className="font-serif text-xl italic text-text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="pt-2 text-[15px] leading-relaxed text-text-secondary md:max-w-[14rem] md:pt-0 md:text-base">
                  {step}
                </p>
              </li>
            ))}
          </div>
        </ol>

        <div className="relative mx-auto mt-16 max-w-3xl border border-line bg-bg-ice px-7 py-6 md:mt-20 md:px-10 md:py-7">
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-10 w-px -translate-y-1/2"
            style={{ background: "#C9A961" }}
          />
          <div className="flex items-center gap-5">
            <span
              aria-hidden
              className="hidden h-2 w-2 rotate-45 shrink-0 md:inline-block"
              style={{ background: "#C9A961" }}
            />
            <p className="font-serif text-lg italic leading-relaxed text-text-primary md:text-xl">
              Turmas com maior número de interessados podem receber condições
              especiais e projetos personalizados.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="mb-14 text-center fade-up">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Diferenciais Alpha
          </span>
          <h2 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Por que conhecer a{" "}
            <span className="italic font-light text-gray-500">Alpha?</span>
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-8 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Mais de 50 anos de história",
            "Acabamentos premium e personalizados",
            "Turmas atendidas em todo o Brasil",
            "Convite online e soluções complementares",
            "Atendimento especializado para formandos",
            "Projetos com percepção de exclusividade",
          ].map((title, index) => (
            <li
              key={title}
              className="group relative border border-line bg-bg-white p-7 transition-all duration-450 ease-premium hover:border-line-strong"
            >
              <span
                aria-hidden
                className="absolute left-7 top-0 h-px w-8"
                style={{ background: "#C9A961" }}
              />
              <span className="block font-serif text-lg italic text-text-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-sans text-base leading-snug text-text-primary md:text-lg">
                {title}
              </h3>
            </li>
          ))}
        </ul>
      </section>

      <SocialProof />

      <section className="relative mx-auto max-w-2xl px-6 pb-20 pt-20 md:pt-24">
        <div className="mb-10 text-center fade-up">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Seu contato
          </span>
          <h2 className="mt-7 font-serif text-3xl leading-[1.1] tracking-premium-tight text-text-primary md:text-4xl">
            Vamos conversar sobre a{" "}
            <span className="italic font-light text-gray-500">
              sua formatura.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-text-secondary">
            Poucos campos, sem compromisso. Nossa equipe entra em contato pelo
            WhatsApp para apresentar as possibilidades.
          </p>
        </div>

        <form
          id="interesse"
          onSubmit={handleSubmit}
          className="card-hover space-y-6 p-6 md:p-9 scroll-mt-28"
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

          <Input
            label="Seu nome"
            name="nome"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            error={errors.nome}
            required
          />

          <div className="grid gap-6 md:grid-cols-2">
            <PhoneInput
              label="Seu WhatsApp"
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              required
            />
            <Input
              label="Seu e-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              required
            />
          </div>

          <Input
            label="Data de nascimento"
            name="data_nascimento"
            type="date"
            value={form.data_nascimento}
            onChange={(e) => set("data_nascimento", e.target.value)}
            error={errors.data_nascimento}
            required
          />

          {topError && (
            <div className="border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
              {topError}
            </div>
          )}

          <Button type="submit" loading={submitting} fullWidth>
            {submitting ? "Enviando" : "Quero demonstrar interesse"}
          </Button>

          <p className="text-center text-xs leading-relaxed text-text-tertiary">
            Sem compromisso · Gratuito · Seus dados são tratados com
            confidencialidade pela Alpha Convites.
          </p>
        </form>

        <p className="mx-auto mt-6 max-w-md text-center text-[11px] uppercase tracking-premium-wide text-text-tertiary">
          Turma de {turma?.course_name} · {turma?.institution_name} ·{" "}
          {turma?.graduation_year}
        </p>
      </section>
      <AcabamentosShowcase />

      <Footer />
    </main>
  );
}
