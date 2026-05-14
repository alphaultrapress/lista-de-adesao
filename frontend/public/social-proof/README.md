# Prova social — Lista de Interesse Alpha

Esta pasta recebe as mídias usadas na seção "Turmas reais" da página
`/adesao/[slug]`.

## Arquivos esperados

| Arquivo              | Tipo                                | Proporção | Tamanho mínimo |
| -------------------- | ----------------------------------- | --------- | -------------- |
| `turma-1.jpg`        | Foto de turma — retrato vertical    | 3:4       | 1200×1600      |
| `acabamento-1.jpg`   | Close de acabamento — paisagem      | 16:9      | 1920×1080      |
| `entrega-1.jpg`      | Entrega/bastidor — quadrada         | 1:1       | 1200×1200      |
| `acabamento-2.jpg`   | Close de acabamento — quadrada      | 1:1       | 1200×1200      |
| `bastidor-1.jpg`     | Bastidor — quadrada                 | 1:1       | 1200×1200      |
| `reels-1.jpg`        | Capa do reels (poster) — paisagem   | 16:9      | 1920×1080      |
| `turma-2.jpg`        | Foto de turma — quadrada            | 1:1       | 1200×1200      |
| `reels-1.mp4` *(opcional)* | Vídeo curto silenciado (H.264) | 16:9 | < 4 MB |

## Como ativar uma foto

1. Suba o arquivo nesta pasta com o nome exato listado acima.
2. Abra `frontend/components/SocialProof.tsx`.
3. No array `mediaSlots`, troque `src: null` por `src: "/social-proof/turma-1.jpg"` (ou o caminho do arquivo correspondente).
4. Ajuste o `alt` para descrever a foto real.

Enquanto `src` for `null`, a página mostra um placeholder premium dark
com o aviso "Em breve" — todos os placeholders ficam marcados no DOM
com `data-placeholder="true"` para facilitar revisão.

## Depoimentos

Os textos dos depoimentos vivem no array `testimonials` em
`SocialProof.tsx`. Substituir diretamente lá.
