import { NextResponse } from "next/server";
import { INSTITUICOES_BR, formatInstituicao } from "@/lib/instituicoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HipolabsUniversity = {
  name: string;
  country: string;
  alpha_two_code?: string;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function extractSigla(name: string): string | null {
  const acronym = name
    .split(/\s+/)
    .filter((w) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(w) && w.length >= 3)
    .map((w) => w[0])
    .join("");
  if (acronym.length >= 3 && acronym.length <= 6) return acronym;
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const nq = normalize(q);

  const localMatches = INSTITUICOES_BR.filter(
    (i) => normalize(i.sigla).includes(nq) || normalize(i.nome).includes(nq),
  )
    .sort((a, b) => {
      const aStarts = normalize(a.sigla).startsWith(nq) ? 0 : 1;
      const bStarts = normalize(b.sigla).startsWith(nq) ? 0 : 1;
      return aStarts - bStarts;
    })
    .map(formatInstituicao);

  let remote: string[] = [];
  try {
    const res = await fetch(
      `http://universities.hipolabs.com/search?country=Brazil&name=${encodeURIComponent(q)}`,
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = (await res.json()) as HipolabsUniversity[];
      remote = data
        .map((u) => {
          if (!u.name) return null;
          const sigla = extractSigla(u.name);
          return sigla ? `${sigla} - ${u.name}` : u.name;
        })
        .filter((v): v is string => Boolean(v));
    }
  } catch {
    // remote opcional — segue com o local
  }

  const seen = new Set<string>();
  const merged: string[] = [];
  for (const name of [...localMatches, ...remote]) {
    const baseName = name.includes(" - ") ? name.split(" - ").slice(1).join(" - ") : name;
    const key = normalize(baseName);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(name);
    if (merged.length >= 12) break;
  }

  return NextResponse.json({ results: merged });
}
