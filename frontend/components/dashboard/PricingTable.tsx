import Card from "../ui/Card";
import Badge from "../ui/Badge";

const luxoTiers = [
  { qtd: 50, preco: "R$ 350,00" },
  { qtd: 100, preco: "R$ 227,00" },
  { qtd: 150, preco: "R$ 193,00" },
  { qtd: 200, preco: "R$ 166,00" },
];

export default function PricingTable() {
  return (
    <Card
      title="Tipos de convite"
      subtitle="Valores por unidade. Tabela referencial — proposta final é personalizada."
    >
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h4 className="font-serif text-lg text-premium-white">
              Convite Luxo com Caixa
            </h4>
            <Badge tone="gold">Premium</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-premium-dark3">
            {luxoTiers.map((t) => (
              <div
                key={t.qtd}
                className="bg-premium-dark2 px-4 py-5 text-center"
              >
                <p className="text-[10px] tracking-premium-wide uppercase text-premium-light1">
                  {t.qtd} unidades
                </p>
                <p className="mt-2 font-serif text-xl text-premium-gold">
                  {t.preco}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t-[0.5px] border-premium-dark3">
          <div className="flex items-center gap-3 mb-4">
            <h4 className="font-serif text-lg text-premium-white">
              Convite Simples com Luva
            </h4>
            <Badge>Econômico</Badge>
          </div>
          <div className="bg-premium-dark2 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-premium-wide uppercase text-premium-light1">
                A partir de 250 unidades
              </p>
              <p className="mt-1 text-sm text-premium-light2">
                Acabamento clássico com luva.
              </p>
            </div>
            <p className="font-serif text-xl text-premium-gold">R$ 25,00</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
