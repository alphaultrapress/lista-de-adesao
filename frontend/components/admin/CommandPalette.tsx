"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, GraduationCap, Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { onlyDigits } from "@/lib/cpf";
import { ADM } from "@/lib/admin/tokens";

type Categoria = "Representantes" | "Alunos" | "Instituições";

type Resultado = {
  id: string;
  categoria: Categoria;
  titulo: string;
  subtitulo: string;
  href: string;
};

const ICONE: Record<Categoria, typeof Users> = {
  Representantes: Users,
  Alunos: GraduationCap,
  Instituições: Building2,
};

const DEBOUNCE_MS = 260;
const MIN_TERMO = 2;

/** Realça o trecho pesquisado sem usar dangerouslySetInnerHTML. */
function Realce({ texto, termo }: { texto: string; termo: string }) {
  const i = texto.toLowerCase().indexOf(termo.toLowerCase());
  if (termo.length < MIN_TERMO || i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark style={{ background: "rgba(196,18,48,0.12)", color: "inherit" }}>
        {texto.slice(i, i + termo.length)}
      </mark>
      {texto.slice(i + termo.length)}
    </>
  );
}

export default function CommandPalette({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      setTermo("");
      setResultados([]);
      setErro(null);
      setCursor(0);
      // O foco espera o próximo quadro, senão o input ainda não existe.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [aberto]);

  const buscar = useCallback(async (q: string) => {
    setBusy(true);
    setErro(null);
    try {
      const digitos = onlyDigits(q);
      const like = `%${q}%`;

      const [repRes, aluRes] = await Promise.all([
        supabase
          .from("representatives")
          .select("id, name, email, course_name, institution_name, slug")
          .or(
            [
              `name.ilike.${like}`,
              `email.ilike.${like}`,
              `course_name.ilike.${like}`,
              `institution_name.ilike.${like}`,
            ].join(","),
          )
          .limit(6),
        supabase
          .from("students")
          .select("id, full_name, email, phone, representative_id")
          .or(
            [
              `full_name.ilike.${like}`,
              `email.ilike.${like}`,
              ...(digitos.length >= 4 ? [`phone.ilike.%${digitos}%`] : []),
            ].join(","),
          )
          .limit(6),
      ]);

      if (repRes.error || aluRes.error) throw new Error("falha na consulta");

      const reps = (repRes.data || []) as any[];
      const alunos = (aluRes.data || []) as any[];

      // Instituições saem dos representantes: não existe tabela própria.
      const instituicoes = Array.from(
        new Set(
          reps
            .map((r) => r.institution_name as string)
            .filter((n) => n?.toLowerCase().includes(q.toLowerCase())),
        ),
      ).slice(0, 4);

      setResultados([
        ...reps.map((r) => ({
          id: `rep-${r.id}`,
          categoria: "Representantes" as Categoria,
          titulo: r.name,
          subtitulo: `${r.course_name} · ${r.institution_name}`,
          href: `/admin/dashboard/${r.id}`,
        })),
        ...alunos.map((a) => ({
          id: `alu-${a.id}`,
          categoria: "Alunos" as Categoria,
          titulo: a.full_name,
          subtitulo: a.email || "Sem e-mail",
          href: `/admin/dashboard/${a.representative_id}`,
        })),
        ...instituicoes.map((nome) => ({
          id: `inst-${nome}`,
          categoria: "Instituições" as Categoria,
          titulo: nome,
          subtitulo: "Ver turmas desta instituição",
          href: `/admin/representantes?instituicao=${encodeURIComponent(nome)}`,
        })),
      ]);
      setCursor(0);
    } catch {
      // Nada de mensagem técnica do banco na tela.
      setErro("Não foi possível buscar agora. Tente novamente.");
      setResultados([]);
    } finally {
      setBusy(false);
    }
  }, []);

  // Debounce: não dispara consulta a cada tecla.
  useEffect(() => {
    if (!aberto) return;
    const q = termo.trim();
    if (q.length < MIN_TERMO) {
      setResultados([]);
      setBusy(false);
      return;
    }
    const t = setTimeout(() => buscar(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [termo, aberto, buscar]);

  const grupos = useMemo(() => {
    const m = new Map<Categoria, Resultado[]>();
    for (const r of resultados) {
      const arr = m.get(r.categoria) || [];
      arr.push(r);
      m.set(r.categoria, arr);
    }
    return Array.from(m.entries());
  }, [resultados]);

  const abrir = useCallback(
    (r: Resultado) => {
      onFechar();
      router.push(r.href);
    },
    [onFechar, router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onFechar();
      return;
    }
    if (!resultados.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % resultados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const alvo = resultados[cursor];
      if (alvo) abrir(alvo);
    }
  }

  if (!aberto) return null;

  const q = termo.trim();
  let plano = -1;

  return (
    <div className="fixed inset-0 z-[9990] flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Fechar busca"
        onClick={onFechar}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(17,24,22,0.34)", backdropFilter: "blur(2px)" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
        onKeyDown={onKeyDown}
        className="relative w-full max-w-[620px] overflow-hidden rounded-xl"
        style={{
          background: ADM.surface,
          border: `1px solid ${ADM.border}`,
          boxShadow: "0 24px 60px rgba(17,24,22,0.18)",
        }}
      >
        <div
          className="flex items-center gap-3 px-4"
          style={{ height: 56, borderBottom: `1px solid ${ADM.border}` }}
        >
          <Search size={17} strokeWidth={1.7} color={ADM.textMuted} />
          <input
            ref={inputRef}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar representante, aluno, instituição, e-mail ou telefone"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: ADM.text }}
          />
          <kbd
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: ADM.bg, color: ADM.textMuted, border: `1px solid ${ADM.border}` }}
          >
            Esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto">
          {q.length < MIN_TERMO && (
            <p className="px-4 py-8 text-center text-[13px]" style={{ color: ADM.textMuted }}>
              Digite ao menos {MIN_TERMO} caracteres para buscar.
            </p>
          )}

          {q.length >= MIN_TERMO && busy && (
            <div className="p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                  <span
                    className="h-7 w-7 shrink-0 animate-pulse rounded-md"
                    style={{ background: ADM.bg }}
                  />
                  <span className="flex-1">
                    <span
                      className="mb-1.5 block h-3 w-1/3 animate-pulse rounded"
                      style={{ background: ADM.bg }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse rounded"
                      style={{ background: ADM.bg }}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}

          {q.length >= MIN_TERMO && !busy && erro && (
            <p className="px-4 py-8 text-center text-[13px]" style={{ color: ADM.danger }}>
              {erro}
            </p>
          )}

          {q.length >= MIN_TERMO && !busy && !erro && !resultados.length && (
            <p className="px-4 py-8 text-center text-[13px]" style={{ color: ADM.textMuted }}>
              Nenhum registro encontrado para <strong>{q}</strong>.
            </p>
          )}

          {!busy &&
            !erro &&
            grupos.map(([categoria, itens]) => {
              const Icone = ICONE[categoria];
              return (
                <div key={categoria} className="py-1.5">
                  <p
                    className="px-4 py-1.5 text-[10px] uppercase"
                    style={{ letterSpacing: "0.14em", color: ADM.textMuted }}
                  >
                    {categoria}
                  </p>
                  {itens.map((r) => {
                    plano += 1;
                    const sel = plano === cursor;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => abrir(r)}
                        onMouseEnter={() => setCursor(resultados.findIndex((x) => x.id === r.id))}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                        style={{ background: sel ? ADM.bg : "transparent" }}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{ background: ADM.bg, color: ADM.textMuted }}
                        >
                          <Icone size={14} strokeWidth={1.7} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[13.5px]"
                            style={{ color: ADM.text }}
                          >
                            <Realce texto={r.titulo} termo={q} />
                          </span>
                          <span
                            className="block truncate text-[12px]"
                            style={{ color: ADM.textMuted }}
                          >
                            <Realce texto={r.subtitulo} termo={q} />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>

        <div
          className="flex items-center gap-4 px-4 py-2.5 text-[11px]"
          style={{ borderTop: `1px solid ${ADM.border}`, color: ADM.textMuted }}
        >
          <span>↑ ↓ navegar</span>
          <span>↵ abrir</span>
          <span className="ml-auto">Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
