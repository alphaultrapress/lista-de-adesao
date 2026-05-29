"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import CpfInput from "@/components/forms/CpfInput";
import PhoneInput from "@/components/forms/PhoneInput";
import Autocomplete from "@/components/forms/Autocomplete";
import { signOutAndClearSession, supabase } from "@/lib/supabase";
import { isValidCpf, isValidPhoneBr, onlyDigits } from "@/lib/cpf";
import { buildTurmaSlug } from "@/lib/slugify";
import { UFS, fetchMunicipios, Municipio } from "@/lib/ibge";
import { getStoredConsultant } from "@/lib/consultants";
import { CURSOS_COMUNS } from "@/lib/cursos";

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
    cpf: "",
    email: "",
    whatsapp: "",
    data_nascimento: "",
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

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe seu nome completo.";
    if (!isValidCpf(form.cpf)) e.cpf = "CPF inválido.";
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
      // Não bloqueia o cadastro se falhar (ex.: CPF inválido) — só loga.
      if (createdRepresentativeId) {
        const cpfDigits = onlyDigits(form.cpf);
        const phoneDigits = onlyDigits(form.whatsapp);
        const { error: studentErr } = await supabase.from("students").insert({
          representative_id: createdRepresentativeId,
          cpf: cpfDigits,
          full_name: form.nome.trim(),
          birth_date: form.data_nascimento || null,
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

  if (checkingSession) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando cadastro
        </p>
      </main>
    );
  }

  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader
        compact
        onLogout={existingUserId ? logout : undefined}
        logoutLabel="Trocar conta"
        actions={
          existingUserId
            ? []
            : [{ href: "/login", label: "Já tenho cadastro", emphasis: true }]
        }
      />

      <section className="relative mx-auto max-w-3xl px-6 pb-20 pt-32 md:pt-36">
        <div className="absolute left-1/2 top-12 h-[340px] w-[620px] -translate-x-1/2 glow-crimson-soft opacity-60 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-grid-light opacity-50 pointer-events-none" />

        <div className="relative mb-14 text-center fade-up">
          <span className="tech-eyebrow">
            <span className="dot" />
            Cadastro do representante da turma
          </span>
          <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Vamos conhecer
            <br />
            <span className="italic font-light text-gray-500">a sua turma.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md leading-relaxed text-text-secondary">
            Você vai gerar o link oficial para sua sala preencher a lista de
            adesão. O cadastro é feito apenas pelo representante.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-hover space-y-6 p-6 md:p-9"
          noValidate
        >
          {existingUserId && (
            <div className="border border-ink/20 bg-ink/[0.03] px-4 py-3 text-sm text-text-primary">
              Encontramos uma sessão ativa. Complete os dados da turma para
              liberar seu painel.
            </div>
          )}

          <CpfInput
            value={form.cpf}
            onChange={(v) => set("cpf", v)}
            onResolved={(d) => {
              if (d.nome) set("nome", d.nome);
              if (d.data_nascimento) set("data_nascimento", d.data_nascimento);
            }}
            error={errors.cpf}
            required
          />

          <Input
            label="Nome completo"
            name="nome"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            error={errors.nome}
            required
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              readOnly={Boolean(existingUserId)}
              required
            />
            <PhoneInput
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              required
            />
          </div>

          <Autocomplete
            label="Curso de graduação"
            name="curso"
            value={form.curso}
            onChange={(v) => set("curso", v)}
            options={CURSOS_COMUNS}
            placeholder="Ex: Medicina"
            error={errors.curso}
            required
          />

          <Autocomplete
            label="Instituição de ensino"
            name="instituicao"
            value={form.instituicao}
            onChange={(v) => set("instituicao", v)}
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
            required
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Select
              label="Estado"
              name="estado"
              value={form.estado}
              onChange={(e) => set("estado", e.target.value)}
              placeholder="Selecione o estado"
              options={UFS.map((u) => ({ value: u.sigla, label: u.nome }))}
              error={errors.estado}
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
            required
          />

          {!existingUserId && (
            <div className="grid gap-6 md:grid-cols-2">
              <Input
                label="Senha"
                name="senha"
                type="password"
                autoComplete="new-password"
                value={form.senha}
                onChange={(e) => set("senha", e.target.value)}
                hint="Mínimo de 6 caracteres."
                error={errors.senha}
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
                required
              />
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => {
                setAceito(e.target.checked);
                setErrors((er) => ({ ...er, aceito: "" }));
              }}
              className="mt-1 accent-ink"
            />
            <span>
              Aceito os termos de uso e a política de privacidade da Alpha
              Convites.
            </span>
          </label>
          {errors.aceito && (
            <p className="-mt-4 text-xs text-wine">{errors.aceito}</p>
          )}

          {topError && (
            <div className="border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
              {topError}
            </div>
          )}

          <Button type="submit" loading={submitting} fullWidth className="mt-4">
            {submitting ? "Criando sua conta" : "Concluir cadastro"}
          </Button>

          <p className="text-center text-xs text-text-tertiary">
            Já é cadastrado?{" "}
            <Link href="/login" className="editorial-link text-text-primary">
              Entrar
            </Link>
          </p>
        </form>
      </section>
      <Footer />
    </main>
  );
}
