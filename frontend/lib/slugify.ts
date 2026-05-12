export function slugify(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildTurmaSlug(
  curso: string,
  instituicao: string,
  semestre: string,
): string {
  const cursoSlug = slugify(curso);
  const instSlug = slugify(instituicao);
  const semSlug = slugify(semestre);
  return [cursoSlug, instSlug, semSlug].filter(Boolean).join("-");
}
