import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { META_CONVITES } from "@/lib/supabase";
import { maskPhone } from "@/lib/cpf";
import { dataAdmin, dataHoraAdmin } from "@/lib/admin/format";
import { STATUS_LABEL } from "@/lib/admin/data";
import {
  descreverFiltro,
  porAtendimento,
  porCurso,
  porEstado,
  porMes,
  resumoRelatorio,
  rotuloMes,
  type Agrupado,
  type FiltroRelatorio,
  type TurmaRelatorio,
} from "@/lib/admin/relatorio";

/* ──────────────────────────────────────────────────────────────────────────
   PDF consolidado do recorte.

   Três partes, na ordem em que a equipe lê: os números do período, a tabela
   de turmas e, no fim, turma a turma com o nome de cada aluno. Mesma marca do
   PDF de lead — é o mesmo documento, em escala maior.
   ────────────────────────────────────────────────────────────────────────── */

const TINTA: [number, number, number] = [26, 20, 16];
const OURO: [number, number, number] = [140, 107, 58];
const CINZA: [number, number, number] = [110, 110, 110];
const VERDE: [number, number, number] = [10, 125, 58];

async function carregarLogo(): Promise<{ dataUrl: string; ratio: number } | null> {
  try {
    const res = await fetch("/logos/logo-white.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const ratio = await new Promise<number>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img.width / img.height);
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, ratio };
  } catch {
    return null;
  }
}

function ultimoY(doc: jsPDF, padrao: number): number {
  const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  return typeof y === "number" ? y : padrao;
}

export type RelatorioPdfParams = {
  linhas: TurmaRelatorio[];
  filtro: FiltroRelatorio;
  /** Quando falso, o PDF fica só no resumo + tabela de turmas. */
  detalharAlunos?: boolean;
};

export async function baixarRelatorioPdf({
  linhas,
  filtro,
  detalharAlunos = true,
}: RelatorioPdfParams) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const resumo = resumoRelatorio(linhas);

  /* ── cabeçalho ── */
  doc.setFillColor(10, 8, 5);
  doc.rect(0, 0, W, 84, "F");

  const logo = await carregarLogo();
  if (logo) {
    const h = 42;
    doc.addImage(logo.dataUrl, "PNG", 40, 20, logo.ratio * h, h);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "italic");
    doc.setFontSize(24);
    doc.text("Alpha Convites", 40, 44);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...OURO);
  doc.text("LISTA DE ADESÃO · RELATÓRIO DAS TURMAS", 40, 72);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Gerado em ${dataHoraAdmin(new Date().toISOString())}`, W - 40, 72, {
    align: "right",
  });

  /* ── recorte aplicado ── */
  doc.setTextColor(...TINTA);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(18);
  doc.text("Relatório das turmas", 40, 118);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...CINZA);
  const recorte = `Mostrando ${descreverFiltro(filtro).join(", ")}.`;
  const linhasRecorte = doc.splitTextToSize(recorte, W - 80) as string[];
  doc.text(linhasRecorte, 40, 136);

  /* ── cartões de número ── */
  const topo = 136 + linhasRecorte.length * 12 + 14;
  const cartoes: [string, string][] = [
    ["TURMAS", String(resumo.turmas)],
    ["ALUNOS", String(resumo.adesoes)],
    ["CONVITES", String(resumo.convites)],
    ["CONVITES POR TURMA", resumo.mediaConvites.toFixed(1)],
    [`BATERAM A META (${META_CONVITES})`, String(resumo.naMeta)],
    ["JÁ ATENDIDAS", String(resumo.atendidas)],
    ["FALTA ATENDER", String(resumo.turmas - resumo.atendidas)],
    ["SEM NENHUM ALUNO", String(resumo.semAdesao)],
  ];
  const larguraCartao = (W - 80 - 7 * 8) / 8;
  cartoes.forEach(([label, valor], i) => {
    const x = 40 + i * (larguraCartao + 8);
    doc.setDrawColor(224, 220, 210);
    doc.setFillColor(250, 249, 246);
    doc.roundedRect(x, topo, larguraCartao, 52, 6, 6, "FD");
    doc.setFontSize(7);
    doc.setTextColor(...OURO);
    doc.text(label, x + 10, topo + 17);
    doc.setFont("times", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...(label.startsWith("BATERAM") || label === "JÁ ATENDIDAS" ? VERDE : TINTA));
    doc.text(valor, x + 10, topo + 40);
    doc.setFont("helvetica", "normal");
  });

  /* ── tabela de turmas ── */
  autoTable(doc, {
    startY: topo + 70,
    head: [
      [
        "#",
        "Representante",
        "Curso",
        "Instituição",
        "Cidade",
        "Ano",
        "Criada em",
        "Convites",
        "Alunos",
        "Situação",
        "Falamos em",
      ],
    ],
    body: linhas.map((l, i) => [
      String(i + 1),
      l.rep.name,
      l.rep.course_name,
      l.rep.institution_name,
      [l.rep.city, l.rep.state].filter(Boolean).join("/"),
      l.rep.graduation_year,
      dataAdmin(l.rep.created_at),
      String(l.convites),
      String(l.adesoes),
      STATUS_LABEL[l.status],
      l.rep.contacted_at ? dataAdmin(l.rep.contacted_at) : "—",
    ]),
    foot: [
      [
        "",
        `${linhas.length} turmas no total`,
        "",
        "",
        "",
        "",
        "",
        String(resumo.convites),
        String(resumo.adesoes),
        `${resumo.atendidas} já atendidas`,
        "",
      ],
    ],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 5, textColor: [40, 40, 40] },
    headStyles: { fillColor: TINTA, textColor: [255, 255, 255], fontSize: 8, halign: "left" },
    footStyles: { fillColor: [245, 241, 233], textColor: TINTA, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 245, 240] },
    columnStyles: {
      0: { cellWidth: 24, halign: "center" },
      7: { halign: "center" },
      8: { halign: "center" },
    },
    margin: { left: 40, right: 40 },
  });

  /* ── quebras ── */
  const quebras: [string, string, Agrupado[], (c: string) => string][] = [
    ["Já falamos com a turma?", "Resposta", porAtendimento(linhas), (c) => c],
    ["Cursos", "Curso", porCurso(linhas).slice(0, 15), (c) => c],
    ["Estados", "Estado", porEstado(linhas), (c) => c],
    ["Mês a mês", "Mês", porMes(linhas, filtro.base), rotuloMes],
  ];

  for (const [titulo, coluna, dados, formatar] of quebras) {
    if (!dados.length) continue;
    const y = ultimoY(doc, 200) + 26;
    if (y > doc.internal.pageSize.getHeight() - 140) doc.addPage();
    const inicio = ultimoY(doc, 200) + 26;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TINTA);
    doc.text(titulo, 40, Math.min(inicio, doc.internal.pageSize.getHeight() - 120));
    autoTable(doc, {
      startY: Math.min(inicio, doc.internal.pageSize.getHeight() - 120) + 8,
      head: [[coluna, "Turmas", "Alunos", "Convites"]],
      body: dados.map((g) => [
        formatar(g.chave),
        String(g.turmas),
        String(g.adesoes),
        String(g.convites),
      ]),
      styles: { font: "helvetica", fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: TINTA, textColor: [255, 255, 255], fontSize: 8, halign: "left" },
      alternateRowStyles: { fillColor: [248, 245, 240] },
      columnStyles: {
        1: { cellWidth: 60, halign: "center" },
        2: { cellWidth: 60, halign: "center" },
        3: { cellWidth: 60, halign: "center" },
      },
      margin: { left: 40, right: 40 },
      tableWidth: W - 80,
    });
  }

  /* ── turma a turma, com os alunos ── */
  if (detalharAlunos) {
    for (const l of linhas) {
      doc.addPage();

      doc.setFillColor(...TINTA);
      doc.rect(0, 0, W, 58, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text(l.rep.course_name, 40, 26);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(212, 175, 110);
      doc.text(
        `${l.rep.institution_name} · ${l.rep.graduation_year}${
          l.rep.city ? ` · ${l.rep.city}/${l.rep.state ?? ""}` : ""
        }`,
        40,
        44,
      );
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(
        `${l.convites} convites · ${l.adesoes} alunos · ${
          l.atendida ? `já falamos em ${dataAdmin(l.rep.contacted_at)}` : "ainda não falamos"
        }`,
        W - 40,
        44,
        { align: "right" },
      );

      doc.setTextColor(...OURO);
      doc.setFontSize(8);
      doc.text("REPRESENTANTE", 40, 84);
      doc.setTextColor(...TINTA);
      doc.setFontSize(11);
      doc.text(l.rep.name, 40, 100);
      doc.setFontSize(9);
      doc.setTextColor(...CINZA);
      doc.text(
        [l.rep.email, l.telefone ? maskPhone(l.telefone) : null].filter(Boolean).join("   ·   "),
        40,
        115,
      );

      if (l.alunos.length === 0) {
        doc.setFontSize(9.5);
        doc.setTextColor(...CINZA);
        doc.text("Nenhum aluno entrou nesta turma nas datas escolhidas.", 40, 145);
        continue;
      }

      autoTable(doc, {
        startY: 134,
        head: [["#", "Aluno", "E-mail", "WhatsApp", "Convites", "Entrou em"]],
        body: l.alunos.map((a, i) => [
          String(i + 1),
          a.full_name,
          a.email,
          a.phone ? maskPhone(a.phone) : "—",
          String(a.qtd_convites || 0),
          dataAdmin(a.created_at),
        ]),
        styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [40, 40, 40] },
        headStyles: { fillColor: TINTA, textColor: [255, 255, 255], fontSize: 8, halign: "left" },
        alternateRowStyles: { fillColor: [248, 245, 240] },
        columnStyles: {
          0: { cellWidth: 26, halign: "center" },
          4: { cellWidth: 60, halign: "center" },
          5: { cellWidth: 80, halign: "center" },
        },
        margin: { left: 40, right: 40 },
      });
    }
  }

  /* ── rodapé ── */
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Alpha Convites · relatório gerado em ${dataAdmin(new Date().toISOString())}`, 40, H - 20);
    doc.text(`Página ${i} de ${paginas}`, W - 40, H - 20, { align: "right" });
  }

  doc.save(`relatorio-turmas-${new Date().toISOString().slice(0, 10)}.pdf`);
}
