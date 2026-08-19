# Mídias da landing page

Todos os arquivos desta pasta são servidos em `/landing/...`.

Enquanto um arquivo não existe, a landing mostra no lugar dele um **quadro cinza
com o tamanho escrito dentro** — é só olhar a página em `localhost:3000` para ver
onde cada peça entra e que formato ela precisa ter.

## Como ativar uma mídia

1. Salve o arquivo nesta pasta com **exatamente o nome da tabela abaixo**.
2. Abra `frontend/lib/landingMedia.ts` e troque `ready: false` → `ready: true`
   no bloco correspondente.

Pronto. O quadro cinza vira a imagem/vídeo, sem mexer em mais nada.

## Tabela de tamanhos

| Arquivo | Tipo | Tamanho | Proporção | Onde aparece |
|---|---|---|---|---|
| `hero.mp4` | vídeo | **1920 × 1080** | 16:9 | fundo da primeira dobra, tela cheia |
| `hero-poster.jpg` | imagem | **1920 × 1080** | 16:9 | primeiro frame, enquanto o vídeo carrega |
| `1400x1400-1.png` … `1400x1400-6.png` | imagem | **1400 × 1400** | 1:1 | carrossel que sobrepõe o rodapé do herói |
| `passo-1.png` … `passo-4.png` | imagem | **800 × 1600** | 1:2 | mockups de celular do "Como funciona" |
| `acabamento-1.jpg` | imagem | **800 × 1000** | 4:5 | Hot stamping |
| `acabamento-2.jpg` | imagem | **800 × 1000** | 4:5 | Alto relevo |
| `acabamento-3.jpg` | imagem | **800 × 1000** | 4:5 | Corte especial |
| `acabamento-4.jpg` | imagem | **800 × 1000** | 4:5 | Acrílico espelhado |
| `galeria-1.jpg` … `galeria-6.jpg` | imagem | **800 × 1000** | 4:5 | grid da galeria (1–2 Medicina, 3–4 Direito, 5–6 Engenharia) |
| `cta.jpg` | imagem | **1920 × 1080** | 16:9 | fundo da chamada final |

São **três formatos**: `1920 × 1080` (16:9), `1400 × 1400` (1:1) e `800 × 1000` (4:5).

**Carrossel do herói:** mostra **3 peças por vez** — a do meio reta, inteira e em
tamanho cheio; as duas laterais giradas em 3D, menores e escurecidas. Troca
sozinha a cada 3,8s e pausa com o mouse em cima. As peças aparecem **inteiras**,
sem corte, atravessando da metade do vídeo até por cima da faixa preta. Como a
peça central aparece por completo, o enquadramento pode usar o quadrado todo.
Pode ter mais ou menos que 6 peças; o carrossel se ajusta sozinho.

## Especificações

**Vídeo do herói (`hero.mp4`)**
- MP4 / H.264, 1920 × 1080, 24–30 fps
- 8 a 12 segundos, em loop que fecha sem corte visível
- **sem áudio** (toca mudo e em autoplay)
- até ~8 MB — acima disso o carregamento no celular pesa

**Enquadramento do herói:** o título e o botão ficam **no centro da tela**, e os
três cards cobrem a faixa de baixo. Deixe o meio e o rodapé do vídeo sem
elemento importante — o rosto ou o convite devem ficar nas laterais.

**Imagens 4:5:** JPG de qualidade 80–85, até ~300 KB cada. Elas são cortadas por
`object-cover`, então o assunto precisa estar centralizado.

**Mockups de celular (`passo-1..4.png`):** um aparelho por peça, em pé, na
proporção **1:2** — 800 × 1600. Exporte em **PNG com fundo transparente**, para
o celular ficar solto sobre o branco da seção em vez de dentro de um retângulo.
Deixe uma folga de uns 40px em volta do aparelho para ele não encostar na borda.
Cada mockup mostra a tela do passo correspondente: 1) criar a lista, 2) o link
sendo compartilhado, 3) a lista enchendo até 30 nomes, 4) o contato da equipe.

**Imagem da chamada final (`cta.jpg`):** ela recebe um véu preto de 60% por cima,
então pode ser uma foto clara — o texto branco continua legível.

## Sobre a cor

O layout inteiro é **preto e branco puros**, sem nenhum vermelho. As fotos podem
ser coloridas (a referência da Squarespace usa fotografia colorida sobre a
estrutura acromática), mas quanto mais neutras e de baixa saturação, mais o
resultado bate com a referência.

## Logo (opcional)

A logo atual (`/logos/logo-white.png`) tem o vermelho neutralizado por um filtro
CSS `grayscale`. Se quiser um resultado mais limpo, mande uma versão **branca
sólida em PNG com fundo transparente, ~600 × 180**, e eu troco.
