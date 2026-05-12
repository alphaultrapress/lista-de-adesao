# Logos

Coloque aqui os arquivos da logo Alpha Convites.

## Sugestão de nomes

- `alpha-convites.svg` — logo principal (preferir SVG para qualidade)
- `alpha-convites-light.svg` — versão clara (para fundos escuros)
- `alpha-convites-dark.svg` — versão escura (para fundos claros)
- `alpha-convites-mark.svg` — símbolo isolado (sem texto)
- `favicon.ico` — coloque em `/public/favicon.ico` (raiz)
- `apple-touch-icon.png` — 180x180, em `/public`

## Como usar no código

```tsx
import Image from "next/image";

<Image
  src="/logos/alpha-convites.svg"
  alt="Alpha Convites"
  width={180}
  height={48}
  priority
/>
```

Ou via tag simples para SVGs:

```tsx
<img src="/logos/alpha-convites.svg" alt="Alpha Convites" />
```
