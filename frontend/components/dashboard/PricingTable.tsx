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
          <div className="flex items-center gap-3 mb-6">
            <h4 className="font-serif text-xl text-text-primary tracking-premium-tight">
              Convite Luxo com Caixa
            </h4>
            <Badge tone="champagne">Premium</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
            {luxoTiers.map((t) => (
              <div key={t.qtd} className="bg-bg-warm px-4 py-6 text-center">
                <p className="text-[10px] tracking-premium-widest uppercase text-text-tertiary mb-3">
                  {t.qtd} unidades
                </p>
                <p className="font-serif text-2xl text-text-primary">
                  {t.preco}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-line">
          <div className="flex items-center gap-3 mb-6">
            <h4 className="font-serif text-xl text-text-primary tracking-premium-tight">
              Convite Simples com Luva
            </h4>
            <Badge>Econômico</Badge>
          </div>
          <div className="bg-bg-warm px-6 py-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-premium-widest uppercase text-text-tertiary mb-1">
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
