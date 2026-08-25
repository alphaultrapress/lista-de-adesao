import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPhone } from "./format";

export type LeadPdfParams = {
  curso: string;
  instituicao: string;
  ano: string;
  representanteNome: string;
  representanteEmail: string;
  representanteTelefone?: string;
  students: Array<{
    full_name: string;
    email: string;
    phone: string;
    qtd_convites: number;
  }>;
};

// Carrega uma imagem pública como dataURL (para inserir no PDF) e devolve dimensões.
async function loadImage(
  src: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = dataUrl;
      },
    );
    return { dataUrl, ...dims };
  } catch {
    return null;
  }
}

/**
 * Monta o PDF da turma e devolve o documento — quem chama decide o nome do
 * arquivo. O relatório reaproveita este mesmo layout no download em lote.
 */
export async function buildLeadPdf(params: LeadPdfParams) {
  const {
    curso,
    instituicao,
    ano,
    representanteNome,
    representanteEmail,
    representanteTelefone,
    students,
  } = params;

  const total = students.reduce((s, x) => s + (x.qtd_convites || 0), 0);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFillColor(10, 8, 5);
  doc.rect(0, 0, W, 90, "F");

  // Logo da Alpha (imagem). Se falhar o carregamento, cai no texto.
  const logo = await loadImage("/logos/logo-white.png");
  if (logo) {
    const logoH = 46;
    const logoW = (logo.width / logo.height) * logoH;
    doc.addImage(logo.dataUrl, "PNG", 40, 22, logoW, logoH);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "italic");
    doc.setFontSize(26);
    doc.text("Alpha Convites", 40, 45);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(212, 175, 110);
  doc.text("LISTA DE ADESÃO · LEAD COMERCIAL", 40, 78);

  // Título da turma
  doc.setTextColor(20, 15, 10);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(20);
  doc.text(`Turma de ${curso}`, 40, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`${instituicao} · ${ano}`, 40, 150);

  // Bloco representante
  doc.setDrawColor(220, 215, 205);
  doc.line(40, 168, W - 40, 168);
  doc.setFontSize(9);
  doc.setTextColor(140, 107, 58);
  doc.text("REPRESENTANTE", 40, 188);
  doc.setTextColor(20, 15, 10);
  doc.setFontSize(12);
  doc.text(representanteNome, 40, 206);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const contato = representanteTelefone
    ? `${representanteEmail}   ·   ${formatPhone(representanteTelefone)}`
    : representanteEmail;
  doc.text(contato, 40, 222);

  // Métricas
  const metricsY = 246;
  doc.setFontSize(9);
  doc.setTextColor(140, 107, 58);
  doc.text("TOTAL DE CONVITES", W - 220, metricsY);
  doc.text("TOTAL DE ADESÕES", W - 110, metricsY);
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(10, 125, 58);
  doc.text(String(total), W - 220, metricsY + 26);
  doc.setTextColor(20, 15, 10);
  doc.text(String(students.length), W - 110, metricsY + 26);

  // Tabela de alunos
  autoTable(doc, {
    startY: metricsY + 50,
    head: [["#", "Nome", "E-mail", "WhatsApp", "Convites"]],
    body: students.map((s, i) => [
      String(i + 1),
      s.full_name,
      s.email,
      formatPhone(s.phone),
      String(s.qtd_convites),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      textColor: [40, 40, 40],
    },
    headStyles: {
      fillColor: [26, 20, 16],
      textColor: [255, 255, 255],
      fontSize: 9,
      halign: "left",
    },
    alternateRowStyles: { fillColor: [248, 245, 240] },
    columnStyles: {
      0: { cellWidth: 28, halign: "center" },
      5: { halign: "center" },
    },
    margin: { left: 40, right: 40 },
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Alpha Convites · gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      40,
      H - 24,
    );
    doc.text(`Página ${i} de ${pageCount}`, W - 90, H - 24);
  }

  const slug = `${curso}-${instituicao}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { doc, slug };
}

export async function downloadLeadPdf(params: LeadPdfParams) {
  const { doc, slug } = await buildLeadPdf(params);
  doc.save(`lead-${slug}.pdf`);
}
