"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PhoneInput from "@/components/forms/PhoneInput";
import Autocomplete from "@/components/forms/Autocomplete";
import AuthButton from "@/components/auth/AuthButton";
import AuthMediaPanel from "@/components/auth/AuthMediaPanel";
import { AUTH } from "@/components/auth/tokens";
import { signOutAndClearSession, supabase } from "@/lib/supabase";
import { isValidPhoneBr, onlyDigits } from "@/lib/cpf";
import { buildTurmaSlug } from "@/lib/slugify";
import { UFS, fetchMunicipios, Municipio } from "@/lib/ibge";
import { getStoredConsultant } from "@/lib/consultants";
import { CURSOS_COMUNS } from "@/lib/cursos";
import { useLoadingGate } from "@/components/ui/LoadingScreen";

const SEMESTRES = ["2026.1", "2026.2", "2027.1", "2027.2", "2028.1", "2028.2"];
const DUPLICATE_EMAIL_MESSAGE = "Este e-mail já está cadastrado.";

function isDuplicateEmailError(error: any) {
  const message = String(
    [
      error?.message,
      error?.error_description,
      error?.details,
      error?.hint,
      error?.constraint,
    ]
      .filter(Boolean)
      .join(" "),
  )
    .toLowerCase();

  return (
    message.includes("user already registered") ||
    message.includes("already registered") ||
    message.includes("email already exists") ||
    message.includes("already been registered") ||
    (error?.code === "23505" && message.includes("email")) ||
    (message.includes("email") && message.includes("exists"))
  );
}

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    curso: "",
    instituicao: "",
    estado: "",
    cidade: "",
    semestre: "",
    senha: "",
    confirmar: "",
  });
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [aceito, setAceito] = useState(false);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;

      if (!sessionUser) {
        setCheckingSession(false);
        return;
      }

      // Valida a sessão consultando o servidor — se o user foi apagado
      // do auth.users, getUser() falha e a gente limpa a sessão zumbi.
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        await signOutAndClearSession();
        setExistingUserId(null);
        setCheckingSession(false);
        return;
      }

      const user = userData.user;

      const { data: representative, error } = await supabase
        .from("representatives")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (representative) {
        router.replace("/dashboard");
        return;
      }

      if (error && error.code !== "PGRST116") {
        setTopError(
          error.code === "42P01"
            ? "O banco ainda precisa receber o schema novo. Execute o arquivo supabase/schema.sql no Supabase."
            : error.message,
        );
      }

      setExistingUserId(user.id);
      setForm((current) => ({
        ...current,
        email: user.email || current.email,
      }));
      setCheckingSession(false);
    })();
  }, [router]);

  useEffect(() => {
    if (form.estado) {
      fetchMunicipios(form.estado).then(setMunicipios);
      setForm((f) => ({ ...f, cidade: "" }));
    } else {
      setMunicipios([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.estado]);

  const municipioNomes = useMemo(
    () => municipios.map((m) => m.nome),
    [municipios],
  );

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  // Campos de texto livre sempre em MAIÚSCULAS (nome, curso, instituição).
  function setUpper<K extends keyof typeof form>(key: K, val: string) {
    set(key, val.toUpperCase());
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "E-mail inválido.";
    }
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "WhatsApp inválido.";
    if (!form.curso.trim()) e.curso = "Informe o curso.";
    if (!form.instituicao.trim()) e.instituicao = "Informe a instituição.";
    if (!form.estado) e.estado = "Selecione o estado.";
    if (!form.cidade.trim()) e.cidade = "Selecione a cidade.";
    if (!form.semestre) e.semestre = "Selecione o semestre.";
    if (!existingUserId && form.senha.length < 6)
      e.senha = "Mínimo de 6 caracteres.";
    if (!existingUserId && form.senha !== form.confirmar)
      e.confirmar = "As senhas não coincidem.";
    if (!aceito) e.aceito = "Você precisa aceitar os termos.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setTopError(undefined);
    if (!validate()) return;
    setSubmitting(true);
    try {
      let userId = existingUserId;
      const normalizedEmail = form.email.trim().toLowerCase();

      if (!userId) {
        const [representativeLookup, adminLookup] = await Promise.all([
          supabase
            .from("representatives")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle(),
          supabase
            .from("admins")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle(),
        ]);

        if (representativeLookup.data || adminLookup.data) {
          throw new Error(DUPLICATE_EMAIL_MESSAGE);
        }

        const { data: signUp, error: signErr } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: form.senha,
        });
        if (signErr) {
          if (isDuplicateEmailError(signErr)) {
            throw new Error(DUPLICATE_EMAIL_MESSAGE);
          }
          throw signErr;
        }
        if (signUp.user && signUp.user.identities?.length === 0) {
          throw new Error(DUPLICATE_EMAIL_MESSAGE);
        }
        userId = signUp.user?.id || null;
      }

      if (!userId) {
        throw new Error("Não foi possível criar sua conta. Tente novamente.");
      }

      const baseSlug = buildTurmaSlug(
        form.curso,
        form.instituicao,
        form.semestre,
      );
      const assignedConsultant = getStoredConsultant();
      let insertErr: any = null;
      let createdRepresentativeId: string | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
        const representativePayload: Record<string, string | undefined> = {
          user_id: userId,
          name: form.nome.trim(),
          email: normalizedEmail,
          course_name: form.curso.trim(),
          institution_name: form.instituicao.trim(),
          graduation_year: form.semestre,
          state: form.estado,
          city: form.cidade,
          slug,
        };

        if (assignedConsultant) {
          representativePayload.consultant_name = assignedConsultant.name;
          representativePayload.consultant_phone = assignedConsultant.phone;
        }

        const { data: inserted, error } = await supabase
          .from("representatives")
          .insert(representativePayload)
          .select("id")
          .single();

        insertErr = error;
        if (!error && inserted) {
          createdRepresentativeId = inserted.id;
          break;
        }
        if (assignedConsultant && error?.code === "PGRST204") {
          const { data: fallbackInserted, error: fallbackError } = await supabase
            .from("representatives")
            .insert({
              user_id: userId,
              name: form.nome.trim(),
              email: normalizedEmail,
              course_name: form.curso.trim(),
              institution_name: form.instituicao.trim(),
              graduation_year: form.semestre,
              slug,
            })
            .select("id")
            .single();

          insertErr = fallbackError;
          if (!fallbackError && fallbackInserted) {
            createdRepresentativeId = fallbackInserted.id;
            break;
          }
          if (fallbackError && fallbackError.code !== "23505") throw fallbackError;
          continue;
        }
        if (error && error.code !== "23505") throw error;
      }

      if (insertErr) throw insertErr;

      // Insere o representante automaticamente na lista de adesões da própria turma.
      // Não bloqueia o cadastro se falhar — só loga.
      if (createdRepresentativeId) {
        const phoneDigits = onlyDigits(form.whatsapp);
        const { error: studentErr } = await supabase.from("students").insert({
          representative_id: createdRepresentativeId,
          full_name: form.nome.trim(),
          phone: phoneDigits,
          email: normalizedEmail,
          qtd_convites: 1,
        });
        if (studentErr) {
          console.warn(
            "[cadastro] falha ao inserir representante na lista:",
            studentErr,
          );
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      if (err?.message === DUPLICATE_EMAIL_MESSAGE || isDuplicateEmailError(err)) {
        setTopError(DUPLICATE_EMAIL_MESSAGE);
        return;
      }

      console.error("[cadastro] erro completo:", err);
      const detail = [err?.message, err?.details, err?.hint, err?.code]
        .filter(Boolean)
        .join(" · ");
      setTopError(
        err?.code === "42P01"
          ? "O banco ainda precisa receber o schema novo. Execute o arquivo supabase/schema.sql no Supabase."
          : detail
            ? `Erro: ${detail}`
            : "Não foi possível criar a conta. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    await signOutAndClearSession();
    setExistingUserId(null);
    setForm((current) => ({ ...current, email: "", senha: "", confirmar: "" }));
  }

  // Tela de carregamento premium; o gate a mantém viva até a saída terminar.
  const { mostrando: carregandoTela, tela } = useLoadingGate(checkingSession);
  if (carregandoTela) return tela;

  return (
    <main
      className="relative flex min-h-[100svh] flex-col"
      style={{ background: AUTH.offWhite }}
    >
      <header className="sticky top-0 z-30 flex min-h-[96px] items-start justify-between border-b border-black/[0.06] bg-[#F4F1EB] px-6 pb-4 pt-6 md:relative md:z-10 md:min-h-0 md:items-center md:border-0 md:bg-transparent md:px-10 md:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] transition-colors duration-200 hover:text-[#111210]"
          style={{ color: AUTH.textMuted }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
            <path
              d="M19 12H5M11 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Voltar ao início
        </Link>

        <span
          className="pointer-events-none absolute left-1/2 block -translate-x-1/2 overflow-hidden"
          style={{ top: 16, height: 60, width: 91 }}
        >
          <Image
            src="/logos/logo-dark.png"
            alt="Alpha Convites"
            width={91}
            height={60}
            priority
            className="h-full w-full"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </span>

        {existingUserId ? (
          <button
            type="button"
            onClick={logout}
            className="text-[12px] transition-colors duration-200 hover:text-[#111210]"
            style={{ color: AUTH.textMuted }}
          >
            Trocar conta
          </button>
        ) : (
          <Link
            href="/login"
            className="text-[12px] transition-colors duration-200 hover:text-[#111210]"
            style={{ color: AUTH.textMuted }}
          >
            Já tenho cadastro
          </Link>
        )}
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-10 md:px-6">
        <div
          className="grid w-full max-w-[1120px] overflow-hidden rounded-[24px] border md:grid-cols-[0.78fr_1.22fr]"
          style={{ background: AUTH.warmWhite, borderColor: AUTH.border, boxShadow: "0 32px 90px rgba(0,0,0,0.18)" }}
        >
          <div className="h-[256px] md:h-auto md:min-h-[760px]">
            <AuthMediaPanel
              estado="criar"
              onTrocar={() => router.push("/login")}
              compactoMobile
            />
          </div>

          <div className="p-6 sm:p-9 md:p-12">
            <p
              className="text-[11px] font-medium uppercase"
              style={{ letterSpacing: "0.2em", color: AUTH.textMuted }}
            >
              Cadastro da turma
            </p>
            <h1
              className="mt-5 font-light"
              style={{ fontSize: "clamp(30px, 3vw, 40px)", lineHeight: 1.08, letterSpacing: "-0.03em", color: AUTH.ink }}
            >
              Vamos conhecer sua turma.
            </h1>
            <p className="mt-3 max-w-[48ch] text-[14px] leading-[1.5]" style={{ color: AUTH.textMuted }}>
              Você vai gerar o link oficial para sua sala preencher a lista de adesão.
              O cadastro é feito apenas pelo representante.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          {existingUserId && (
            <div
              className="rounded-[10px] border px-4 py-3 text-sm"
              style={{ borderColor: AUTH.border, background: "rgba(17,18,16,0.03)", color: AUTH.ink }}
            >
              Encontramos uma sessão ativa. Complete os dados da turma para
              liberar seu painel.
            </div>
          )}

          <Input
            label="Nome completo"
            name="nome"
            value={form.nome}
            onChange={(e) => setUpper("nome", e.target.value)}
            error={errors.nome}
            variant="auth"
            required
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              readOnly={Boolean(existingUserId)}
              variant="auth"
              required
            />
            <PhoneInput
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              variant="auth"
              required
            />
          </div>

          <Autocomplete
            label="Curso de graduação"
            name="curso"
            value={form.curso}
            onChange={(v) => setUpper("curso", v)}
            options={CURSOS_COMUNS}
            placeholder="Ex: Medicina"
            error={errors.curso}
            variant="auth"
            required
          />

          <Autocomplete
            label="Instituição de ensino"
            name="instituicao"
            value={form.instituicao}
            onChange={(v) => setUpper("instituicao", v)}
            fetchOptions={async (q) => {
              const res = await fetch(
                `/api/instituicoes?q=${encodeURIComponent(q)}`,
              );
              if (!res.ok) return [];
              const data = await res.json();
              return Array.isArray(data?.results) ? data.results : [];
            }}
            placeholder="Ex: FIMCA, USP, UFRJ…"
            error={errors.instituicao}
            variant="auth"
            required
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Estado"
              name="estado"
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              placeholder="Selecione o estado"
              options={UFS.map((u) => ({ value: u.sigla, label: u.nome }))}
              error={errors.estado}
              variant="auth"
              required
            />
            <Select
              label="Cidade"
              name="cidade"
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
              options={municipioNomes.map((nome) => ({
                value: nome,
                label: nome,
              }))}
              placeholder={
                form.estado ? "Selecione a cidade" : "Selecione o estado primeiro"
              }
              error={errors.cidade}
              disabled={!form.estado || municipioNomes.length === 0}
              variant="auth"
              required
            />
          </div>

          <Select
            label="Semestre previsto de formatura"
            name="semestre"
            value={form.semestre}
            onChange={(e) => set("semestre", e.target.value)}
            placeholder="Selecione"
            options={SEMESTRES.map((s) => ({ value: s, label: s }))}
            error={errors.semestre}
            variant="auth"
            required
          />

          {!existingUserId && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Senha"
                name="senha"
                type="password"
                autoComplete="new-password"
                value={form.senha}
                onChange={(e) => set("senha", e.target.value)}
                hint="Mínimo de 6 caracteres."
                error={errors.senha}
                variant="auth"
                required
              />
              <Input
                label="Confirmar senha"
                name="confirmar"
                type="password"
                autoComplete="new-password"
                value={form.confirmar}
                onChange={(e) => set("confirmar", e.target.value)}
                error={errors.confirmar}
                variant="auth"
                required
              />
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 pt-2 text-[13px] leading-[1.5]" style={{ color: AUTH.textMuted }}>
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => {
                setAceito(e.target.checked);
                setErrors((er) => ({ ...er, aceito: "" }));
              }}
              className="mt-[3px] h-4 w-4 shrink-0"
              style={{ accentColor: AUTH.ink }}
            />
            <span>
              Aceito os termos de uso e a política de privacidade da Alpha
              Convites.
            </span>
          </label>
          {errors.aceito && (
            <p className="-mt-3 text-xs text-[#C41230]">{errors.aceito}</p>
          )}

          {topError && (
            <div className="rounded-[10px] border border-[#C41230] bg-[rgba(196,18,48,0.05)] px-4 py-3 text-sm text-[#C41230]">
              {topError}
            </div>
          )}

          <AuthButton type="submit" loading={submitting} loadingLabel="Criando sua conta" className="mt-2">
            {submitting ? "Criando sua conta" : "Concluir cadastro"}
          </AuthButton>

          <p className="text-center text-[13px]" style={{ color: AUTH.textMuted }}>
            Já é cadastrado?{" "}
            <Link href="/login" className="font-medium underline-offset-4 hover:underline" style={{ color: AUTH.ink }}>
              Entrar
            </Link>
          </p>
            </form>
          </div>
        </div>
      </section>
      <footer className="px-6 pb-6 text-center text-[11px] md:px-10" style={{ color: AUTH.textMuted }}>
        © 2026 Alpha Convites · Cadastro exclusivo para representantes de turma
      </footer>
    </main>
  );
}
