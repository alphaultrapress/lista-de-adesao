import Card from "../ui/Card";
import Badge from "../ui/Badge";

const luxoTiers = [
  { qtd: 50, preco: "R$ 350" },
  { qtd: 100, preco: "R$ 227" },
  { qtd: 150, preco: "R$ 193" },
  { qtd: 200, preco: "R$ 166" },
];

export default function PricingTable() {
  return (
    <Card
      title="Tipos de convite"
      subtitle="Valores referenciais por unidade. Proposta final é personalizada."
    >
      <div className="space-y-10">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h4 className="font-serif text-xl tracking-premium-tight text-text-primary">
              Convite Luxo com Caixa
            </h4>
            <Badge tone="crimson">Premium</Badge>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            {luxoTiers.map((t) => (
              <div key={t.qtd} className="bg-white/70 px-4 py-6 text-center">
                <p className="mb-3 text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                  {t.qtd} unidades
                </p>
                <p className="font-serif text-2xl text-text-primary">
                  {t.preco}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line pt-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h4 className="font-serif text-xl tracking-premium-tight text-text-primary">
              Convite Simples com Luva
            </h4>
            <Badge>Econômico</Badge>
          </div>
          <div className="flex flex-col gap-4 bg-white/70 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                A partir de 250 unidades
              </p>
              <p className="text-sm text-text-secondary">
                Acabamento clássico com luva.
              </p>
            </div>
            <p className="font-serif text-2xl text-text-primary">R$ 25</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
