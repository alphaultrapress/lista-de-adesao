"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PhoneInput from "@/components/forms/PhoneInput";
import SquareNav from "@/components/landing/SquareNav";
import GaleriaMural from "@/components/landing/GaleriaMural";
import {
  Acabamentos,
  ChamadaFinal,
  FaixaNumeros,
  HeroLanding,
  RodapeLanding,
} from "@/components/landing/SecoesInstitucionais";
import {
  MAX_CONVITES_POR_PESSOA,
  PublicRepresentative,
  supabase,
} from "@/lib/supabase";
import { isValidPhoneBr, onlyDigits } from "@/lib/cpf";
import { useLoadingGate } from "@/components/ui/LoadingScreen";

export default function AdesaoClient({ slug }: { slug: string }) {
  const [turma, setTurma] = useState<PublicRepresentative | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    email: "",
    qtd_convites: "1",
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

  // Nome sempre em MAIÚSCULAS.
  function setUpper<K extends keyof typeof form>(key: K, val: string) {
    set(key, val.toUpperCase());
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe seu nome completo.";
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "Celular inválido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "E-mail inválido.";
    }
    const qtd = parseInt(form.qtd_convites, 10);
    if (!qtd || qtd < 1 || qtd > MAX_CONVITES_POR_PESSOA) {
      e.qtd_convites = "Informe uma quantidade entre 1 e 10.000 convites.";
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
      const qtdConvites = Math.min(
        MAX_CONVITES_POR_PESSOA,
        Math.max(1, parseInt(form.qtd_convites, 10) || 1),
      );
      const { error } = await supabase.from("students").insert({
        representative_id: turma.id,
        full_name: form.nome.trim(),
        phone: onlyDigits(form.whatsapp),
        email: form.email.trim().toLowerCase(),
        qtd_convites: qtdConvites,
      });

      if (error?.code === "23505") {
        setErrors((e) => ({
          ...e,
          email: "Este e-mail já foi cadastrado para esta turma.",
        }));
        return;
      }

      if (error?.code === "42P01") {
        const { error: legacyError } = await supabase.from("adesoes").insert({
          slug_origem: slug,
          nome: form.nome.trim(),
          whatsapp: onlyDigits(form.whatsapp),
          email: form.email.trim().toLowerCase(),
          qtd_luxo: 0,
          qtd_simples: 0,
          qtd_convites: qtdConvites,
          tem_fotos: "nao_sei",
          observacoes: null,
        });
        if (legacyError) throw legacyError;
      } else if (error) {
        throw error;
      }

      // Dispara verificação de meta (fire-and-forget — não bloqueia UX)
      fetch("/api/notify-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representative_id: turma.id }),
      }).catch(() => {});

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

  // Tela de carregamento premium; o gate a mantém viva até a saída terminar.
  const { mostrando: carregandoTela, tela } = useLoadingGate(loading);
  if (carregandoTela) return tela;

  if (notFound) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex flex-col">
        <PremiumHeader compact centeredBrand brandSize="lg" brandHref="" />
        <section className="relative flex flex-1 items-center justify-center px-6 pb-20 pt-32">
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />
          <div className="relative max-w-md text-center fade-up">
            <p className="mb-4 text-[10px] uppercase tracking-premium-widest text-wine">
              Link inválido
            </p>
            <h1 className="font-serif text-4xl tracking-premium-tight text-text-primary">
              Turma não encontrada
            </h1>
            <p className="mt-5 leading-relaxed text-[#3A3A3A]">
              Verifique o link recebido ou peça ao representante da sua turma
              para enviá-lo novamente.
            </p>
          </div>
        </section>
        <Footer minimal />
      </main>
    );
  }

  if (success) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex flex-col">
        <PremiumHeader compact centeredBrand brandSize="lg" brandHref="" />
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
                <span className="italic font-light text-[#C41230]">interesse.</span>
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
            <p className="mt-6 leading-relaxed text-[#3A3A3A]">
              Nossa equipe entrará em contato em breve para apresentar as
              possibilidades de convites para a sua turma, sem compromisso.
            </p>
          </div>
        </section>
        <Footer minimal />
      </main>
    );
  }

  /** O mesmo formulário aparece duas vezes na página; o id muda para as
   *  âncoras não colidirem. */
  const formulario = (formId: string) => (
            <form
              id={formId}
              onSubmit={handleSubmit}
              className="relative space-y-6 overflow-hidden rounded-2xl border border-white/10 bg-obsidian p-6 scroll-mt-28 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] md:p-9"
              noValidate
            >
              <div className="relative z-10 space-y-6">
                <Input
                  label="Seu nome"
                  name="nome"
                  value={form.nome}
                  onChange={(e) => setUpper("nome", e.target.value)}
                  variant="escuro"
                  error={errors.nome}
                  required
                />
                <div className="grid gap-6 md:grid-cols-2">
                  <PhoneInput
                    label="Seu WhatsApp"
                    value={form.whatsapp}
                    onChange={(v) => set("whatsapp", v)}
                    variant="escuro"
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
                    variant="escuro"
                    error={errors.email}
                    required
                  />
                </div>
                <Input
                  label="Quantidade de convites"
                  name="qtd_convites"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.qtd_convites}
                  onChange={(e) =>
                    set("qtd_convites", e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  hint="Quantidade aproximada de convites. Você pode ajustar depois com a equipe."
                  variant="escuro"
                  error={errors.qtd_convites}
                  required
                />
                {topError && (
                  <div className="border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-4 py-3 text-sm text-[#FF6B6B]">
                    {topError}
                  </div>
                )}
                <Button type="submit" variant="light" loading={submitting} fullWidth>
                  {submitting ? "Enviando" : "Quero demonstrar interesse"}
                </Button>
                <p className="text-center text-xs leading-relaxed text-paper/60">
                  Sem compromisso · Gratuito · Seus dados são tratados com
                  confidencialidade pela Alpha Convites.
                </p>
              </div>
            </form>
  );

  return (
    <main
      className="min-h-screen bg-paper font-sans text-obsidian selection:bg-obsidian selection:text-paper"
      // Mesma largura de peça do carrossel usada na landing: o herói e a faixa
      // preta logo abaixo dependem dela.
      style={{ "--hero-card": "clamp(300px, 39vw, 900px)" } as CSSProperties}
    >
      {/* Esta página é o link que o representante manda para a turma: ela é a
          landing inteira, só que sem nada de criar conta — no lugar do CTA de
          cadastro entra o formulário de interesse. */}
      <SquareNav
        comConta={false}
        comComoFunciona={false}
        ctaHref="#interesse"
        ctaLabel="Entrar na lista"
      />

      <HeroLanding
        titulo="Sua turma merece um convite inesquecível"
        ctaHref="#interesse"
        ctaLabel="Entrar na lista"
        apoio="Sem compromisso. Leva menos de um minuto."
      >
        <p
          className="mt-7 text-[13px] font-normal uppercase text-paper/85"
          style={{ letterSpacing: "0.14em" }}
        >
          Turma de {turma?.course_name}
        </p>
        <p className="mt-2 text-[13px] font-normal text-paper/70">
          {turma?.institution_name} · {turma?.graduation_year}
        </p>
      </HeroLanding>

      <FaixaNumeros sobCarrossel />

      {/* No lugar de "Como funciona": esse bloco explica o processo para quem
          vai MONTAR a lista, não para quem só entra nela. */}
      <section className="bg-paper py-20 md:py-[120px]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-6 text-center">
          <h2
            className="max-w-[16ch] font-light text-obsidian"
            style={{
              fontSize: "clamp(34px, 5vw, 56px)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            Vamos conversar sobre a sua formatura
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-[15px] font-normal text-ash">
            Deixe seus dados e nossa equipe entra em contato pelo WhatsApp para
            apresentar opções, modelos e acabamentos.
          </p>
          <div className="mt-10 w-full max-w-[560px] text-left">
            {formulario("interesse")}
          </div>
        </div>
      </section>

      <Acabamentos />

      <GaleriaMural />

      <ChamadaFinal id="interesse-bloco" titulo="Entre na lista da sua turma">
        <div className="mt-10 w-full max-w-[560px] text-left">
          {formulario("interesse-final")}
        </div>
      </ChamadaFinal>

      <RodapeLanding comConta={false} comComoFunciona={false} />
    </main>
  );
}
