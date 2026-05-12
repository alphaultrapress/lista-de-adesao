"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand, Footer } from "@/components/Brand";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import CpfInput from "@/components/forms/CpfInput";
import PhoneInput from "@/components/forms/PhoneInput";
import Autocomplete from "@/components/forms/Autocomplete";
import { supabase } from "@/lib/supabase";
import { isValidCpf, isValidPhoneBr, onlyDigits } from "@/lib/cpf";
import { buildTurmaSlug } from "@/lib/slugify";
import { UFS, fetchMunicipios, Municipio } from "@/lib/ibge";
import { CURSOS_COMUNS } from "@/lib/cursos";

const SEMESTRES = ["2026.1", "2026.2", "2027.1", "2027.2", "2028.1", "2028.2"];

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
  const [aceito, setAceito] = useState(false);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido.";
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "WhatsApp inválido.";
    if (!form.data_nascimento) e.data_nascimento = "Informe a data.";
    if (!form.curso.trim()) e.curso = "Informe o curso.";
    if (!form.instituicao.trim()) e.instituicao = "Informe a instituição.";
    if (!form.estado) e.estado = "Selecione o estado.";
    if (!form.cidade.trim()) e.cidade = "Selecione a cidade.";
    if (!form.semestre) e.semestre = "Selecione o semestre.";
    if (form.senha.length < 6) e.senha = "Mínimo de 6 caracteres.";
    if (form.senha !== form.confirmar)
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
      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
      });
      if (signErr) throw signErr;
      const userId = signUp.user?.id;
      if (!userId)
        throw new Error("Não foi possível criar sua conta. Tente novamente.");

      const slug = buildTurmaSlug(form.curso, form.instituicao, form.semestre);

      const { error: insertErr } = await supabase.from("formandos").insert({
        user_id: userId,
        nome: form.nome.trim(),
        cpf: onlyDigits(form.cpf),
        email: form.email.trim().toLowerCase(),
        whatsapp: onlyDigits(form.whatsapp),
        data_nascimento: form.data_nascimento,
        curso: form.curso.trim(),
        instituicao: form.instituicao.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado,
        semestre: form.semestre,
        slug,
      });
      if (insertErr) throw insertErr;

      router.push("/dashboard");
    } catch (err: any) {
      setTopError(
        err?.message ||
          "Algo deu errado ao concluir seu cadastro. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg">
      <header className="bg-ink">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Brand size="sm" variant="light" />
          <Link
            href="/login"
            className="text-[11px] tracking-premium-wide uppercase text-white/70 hover:text-champagne transition-colors duration-250"
          >
            Já tenho cadastro
          </Link>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-premium-widest uppercase text-champagne-deep mb-4">
            Cadastro do representante da turma
          </p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-premium-tight text-text-primary">
            Vamos conhecer
            <br />
            <span className="italic text-text-secondary">a sua turma.</span>
          </h1>
          <p className="mt-5 text-text-secondary max-w-md mx-auto leading-relaxed">
            Você vai gerar o link oficial para sua sala preencher a lista de
            adesão. O cadastro é feito apenas pelo representante.
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

          <div className="grid md:grid-cols-2 gap-6">
            <CpfInput
              value={form.cpf}
              onChange={(v) => set("cpf", v)}
              onResolved={(d) => {
                if (d.nome && !form.nome) set("nome", d.nome);
                if (d.data_nascimento && !form.data_nascimento)
                  set("data_nascimento", d.data_nascimento);
              }}
              error={errors.cpf}
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

          <div className="grid md:grid-cols-2 gap-6">
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
            <PhoneInput
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              required
            />
          </div>

          <Autocomplete
            label="Curso de graduação"
            value={form.curso}
            onChange={(v) => set("curso", v)}
            options={CURSOS_COMUNS}
            placeholder="Ex: Medicina"
            error={errors.curso}
            required
          />

          <Input
            label="Instituição de ensino"
            name="instituicao"
            value={form.instituicao}
            onChange={(e) => set("instituicao", e.target.value)}
            placeholder="Ex: FIMCA"
            error={errors.instituicao}
            required
          />

          <div className="grid md:grid-cols-2 gap-6">
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
            <Autocomplete
              label="Cidade"
              value={form.cidade}
              onChange={(v) => set("cidade", v)}
              options={municipioNomes}
              placeholder={
                form.estado ? "Comece a digitar..." : "Selecione o estado primeiro"
              }
              error={errors.cidade}
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

          <div className="grid md:grid-cols-2 gap-6">
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

          <label className="flex items-start gap-3 text-sm text-text-secondary cursor-pointer pt-2">
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
            <p className="text-xs text-wine -mt-4">{errors.aceito}</p>
          )}

          {topError && (
            <div className="border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
              {topError}
            </div>
          )}

          <Button
            type="submit"
            loading={submitting}
            fullWidth
            className="mt-4"
          >
            {submitting ? "Criando sua conta" : "Concluir cadastro"}
          </Button>

          <p className="text-center text-xs text-text-tertiary">
            Já é cadastrado?{" "}
            <Link
              href="/login"
              className="text-text-primary editorial-link"
            >
              Entrar
            </Link>
          </p>
        </form>
      </section>
      <Footer />
    </main>
  );
}
