import type { Metadata } from "next";
import { supabase, PublicRepresentative } from "@/lib/supabase";
import {
  SITE_URL,
  OG_IMAGE_PATH,
  PROMO_VIDEO_PATH,
  absoluteUrl,
  buildAdesaoUrl,
} from "@/lib/site";
import AdesaoClient from "./AdesaoClient";

export const dynamic = "force-dynamic";

// Busca a turma pelo slug no SERVIDOR (mesma cascata de fallback do client:
// RPC -> tabela representatives -> tabela legada formandos).
async function getTurmaBySlug(
  slug: string,
): Promise<PublicRepresentative | null> {
  try {
    const { data: rpcData } = await supabase.rpc(
      "get_representative_by_slug",
      { p_slug: slug },
    );
    const rpcRepresentative = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (rpcRepresentative) return rpcRepresentative as PublicRepresentative;

    const { data } = await supabase
      .from("representatives")
      .select("id, name, course_name, institution_name, graduation_year, slug")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return data as PublicRepresentative;

    const { data: legacy } = await supabase
      .from("formandos")
      .select("id, nome, curso, instituicao, semestre, slug")
      .eq("slug", slug)
      .maybeSingle();
    if (legacy) {
      return {
        id: legacy.id,
        name: legacy.nome,
        course_name: legacy.curso,
        institution_name: legacy.instituicao,
        graduation_year: legacy.semestre,
        slug: legacy.slug,
      };
    }
  } catch {
    // Falha de rede/DB no SSR não deve quebrar a página: cai no metadata padrão.
  }
  return null;
}

// METADATA DINÂMICO POR TURMA — injeta Open Graph com título/descrição/
// thumbnail específicos do slug, para o card do WhatsApp ficar personalizado.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const turma = await getTurmaBySlug(params.slug);
  const pageUrl = buildAdesaoUrl(params.slug);
  const ogImage = absoluteUrl(OG_IMAGE_PATH);
  const ogVideo = absoluteUrl(PROMO_VIDEO_PATH);

  const title = turma
    ? `Convites de formatura — Turma de ${turma.course_name} · ${turma.institution_name}`
    : "Alpha Convites — Lista de Interesse";

  const description = turma
    ? `A turma de ${turma.course_name} (${turma.institution_name} · ${turma.graduation_year}) está escolhendo seus convites de formatura com a Alpha. Demonstre seu interesse, sem compromisso.`
    : "Convites de formatura premium. Demonstre o interesse da sua turma, sem compromisso.";

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: pageUrl,
      siteName: "Alpha Convites",
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/jpeg",
        },
      ],
      videos: [
        {
          url: ogVideo,
          type: "video/mp4",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function AdesaoPage({ params }: { params: { slug: string } }) {
  return <AdesaoClient slug={params.slug} />;
}
