# Imagens

Coloque aqui fotos e imagens usadas nas páginas.

## Sugestão de organização

```
images/
├── hero/                    fotos do hero da landing
│   └── hero-convite.jpg
├── convites/                fotos dos produtos
│   ├── luxo-caixa.jpg
│   └── simples-luva.jpg
├── og/                      imagens para Open Graph (compartilhamento)
│   └── og-default.jpg       1200x630, usada em meta tags
└── dashboard/               ilustrações usadas no painel
```

## Como usar no código

```tsx
import Image from "next/image";

<Image
  src="/images/convites/luxo-caixa.jpg"
  alt="Convite Luxo com caixa"
  width={800}
  height={600}
  className="..."
/>
```

## Recomendações

- Prefira **WebP** ou **AVIF** quando possível (menor que JPG)
- Para fotos de produto, exporte em pelo menos **1600px** no lado maior
- Para Open Graph, use exatamente **1200x630px**
- Evite arquivos > 500KB — comprima com [Squoosh](https://squoosh.app)
