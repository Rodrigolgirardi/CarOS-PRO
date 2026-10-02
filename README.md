# CarOS

**O sistema operacional da sua revenda.** MVP local para gestão de compra e venda de veículos: comprar → preparar → anunciar → negociar → vender → receber → lucro.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Pronto — sem configuração, sem conta, sem nuvem.

> Versão otimizada (mais rápida): `npm run build` e depois `npm start`.

## Onde ficam os seus dados

Tudo é salvo **localmente**, na pasta [`data/`](data) (criada no primeiro uso):

| Caminho | Conteúdo |
| --- | --- |
| `data/caros.db` | Banco SQLite com todos os registros |
| `data/uploads/` | Fotos de veículos e documentos anexados |

Para fazer backup, copie a pasta `data/`. Para zerar o sistema, apague-a (com o servidor parado).

## Rodando em outra máquina

O código vai pelo git; **os dados não** (a pasta `data/` fica fora do repositório de propósito — banco, fotos, documentos e o token da API de placas são seus e ficam locais).

```bash
git clone <url-do-seu-repo>
cd caros
npm install
npm run dev
```

Requisito: **Node.js 22.13+** (o SQLite embutido do Node). Em uma máquina nova o sistema nasce vazio com os dados de demonstração; para levar os seus dados de verdade, copie a pasta `data/` da máquina antiga para a nova (com os servidores parados).

Na primeira execução o CarOS cria **dados de exemplo** para você explorar — remova-os pelo botão *"Limpar dados de exemplo"* na barra lateral.

## Módulos

- **Dashboard** — estoque, capital investido, lucro potencial, vendas do mês e a lista *"Requer sua atenção"*.
- **Veículos** — estoque com custo total, lucro e margem calculados; ficha completa com custos, checklist, documentos e histórico.
- **Compras** — registrar compra cria o veículo no estoque com o checklist de preparação; inclui simulador de lucro.
- **Vendas** — funil Interessado → Proposta → Reservado → Vendido → Entregue. A venda baixa o estoque, gera comissão como custo e cria as contas a receber.
- **Clientes** — CRM simples ligado aos veículos e negociações.
- **Financeiro** — fluxo de caixa (entradas e saídas reais), contas a pagar e a receber.
- **Operações** — tarefas por veículo (preparação, documentação, fotos, anúncio…); concluir com custo lança o custo no veículo.
- **Documentos** — upload local de CRLV, ATPV-e, contratos, laudos, vinculados a veículos e clientes.
- **Relatórios** — estoque, vendas, compras e rankings de veículos.

## Busca por placa (opcional)

No formulário de compra, digite a placa e clique **Buscar** para preencher marca, modelo, versão, anos, cor e combustível automaticamente.

- Usa a [API Placas](https://apiplacas.com.br) (wdapi2), um serviço **pago** de terceiros — não existe mais consulta pública gratuita no Brasil.
- Na primeira busca o CarOS pede o token, que fica salvo **somente no banco local** (ou use a variável de ambiente `PLACA_API_TOKEN`).
- Sem token, nada muda: o cadastro manual continua funcionando normalmente.
- A placa digitada é enviada ao provedor no momento da busca; nenhum outro dado sai do seu computador.
- Para trocar de provedor, reimplemente `fetchPlate` em [src/lib/plate-lookup.ts](src/lib/plate-lookup.ts).

## Regras de ouro do sistema

- Dinheiro é armazenado em **centavos** (inteiros); datas em ISO (`YYYY-MM-DD`).
- **Lucro e margem nunca são digitados** — sempre calculados: `lucro = venda − (compra + custos)`, `margem = lucro ÷ venda`.
- Toda ação relevante gera um evento na **linha do tempo** do veículo/cliente.

## Stack

- [Next.js 15](https://nextjs.org) (App Router, Server Actions) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- SQLite via [`node:sqlite`](https://nodejs.org/api/sqlite.html) (nativo do Node 22+, zero dependências nativas)
- Logos das montadoras em `public/logos/` (29 marcas, via [car-logos-dataset](https://github.com/filippofilip95/car-logos-dataset)); mapeamento e apelidos ("VW", "GM"…) em `src/lib/brands.ts`

Arquitetura em camadas simples, pensada para a fase 2 (nuvem) sem reescrita:

```
src/lib/db.ts          conexão + schema SQLite
src/lib/seed.ts        dados de demonstração
src/lib/queries/*      leituras (SQL)
src/lib/actions/*      escritas + regras de negócio (server actions)
src/app/*              telas (Server Components)
src/components/*       UI
```

## Fase 2 (fora deste MVP, de propósito)

Login/multiusuário, nuvem e banco online, multiempresa, integrações com marketplaces, API pública, permissões e automações externas. A migração natural é trocar `lib/db.ts` por Postgres e manter queries/actions.
