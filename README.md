# FarmCore

**Plataforma open source de gestao agricola completa.** Controle safras, areas, atividades, financeiro, estoque, analise de solo, imagens de satelite e notas fiscais — tudo em um so lugar.

FarmCore e construido com tecnologias modernas e pensado para atender desde pequenos produtores ate grandes operacoes agricolas, com suporte multi-fazenda e controle de acesso por perfil.

---

## Funcionalidades

### Gestao de Areas (Talhoes)

- Cadastro de areas com geometria em GeoJSON
- Desenho e edicao de talhoes diretamente no mapa interativo
- Importacao de arquivos KML
- Visualizacao com cores personalizadas por area
- Calculo automatico de area em hectares

### Mapa Interativo

- Mapa da fazenda com [Leaflet](https://leafletjs.com/) e camadas de satelite
- Sobreposicao de imagens true color e NDVI (Sentinel-2)
- Navegacao visual entre talhoes e safras
- Upload de KML para importar geometrias

### Monitoramento por Satelite (NDVI)

- Integracao com [Copernicus / Sentinel Hub](https://www.sentinel-hub.com/) para imagens Sentinel-2
- Indice de vegetacao NDVI por talhao com estatisticas (media, min, max, desvio padrao)
- Historico de leituras com grafico temporal
- Filtragem automatica por cobertura de nuvens
- Escala de cores: vermelho (baixo vigor) a verde (alto vigor)

### Safras

- Criacao de ciclos de safra com cultura, tipo de plantio e status
- Culturas suportadas: cana-de-acucar, soja, milho, cafe, algodao, trigo, arroz, feijao, sorgo, amendoim, laranja, eucalipto, pastagem e outros
- Vinculacao de areas a safras
- Acompanhamento de status: planejada, em andamento, finalizada
- Configuracao de descontos e unidade de medida padrao

### Colheita

- Registro de colheita por safra com metricas completas
- Indicadores: ATR, Brix, Pol, Fibra, Pureza, TCH
- Vinculo com transacoes financeiras

### Atividades e Operacoes

- Tipos de atividade configuraveis: preparo de solo, plantio, fertilizacao, aplicacao, colheita e outros
- Workflow de status: a fazer, em progresso, revisar, concluido
- Classificacao planejado vs. realizado
- Execucao em multiplas areas simultaneamente
- Atribuicao de equipe e controle de custos
- Registro de insumos utilizados por atividade (dose/ha)
- Log de auditoria com usuario e timestamp

### Estoque e Insumos

- Catalogo de insumos: herbicidas, inseticidas, fungicidas, fertilizantes, adjuvantes, sementes, combustiveis
- Multiplos depositos (insumos e producao)
- Controle de entradas e saidas com rastreio de lote
- Estoque minimo configuravel por insumo
- Historico completo de movimentacoes

### Analise de Solo

- Importacao de laudos de laboratorio em CSV, XLS e XLSX
- Formatos suportados: Lagoa da Serra (CSV), Ciencia em Solo (XLS), FarmCore (XLSX)
- Parametros completos: pH, MO, P, K, Ca, Mg, Al, H+Al, S, B, Cu, Fe, Mn, Zn
- Textura do solo: argila, silte, areia
- Valores derivados: soma de bases, CTC, saturacao por bases, saturacao por aluminio
- Historico e comparacao entre amostras
- Faixas ideais de referencia para cana-de-acucar

### Financeiro

- Contas bancarias com saldo inicial e conta padrao
- Transacoes de receita e despesa
- Status: pendente, pago, recebido, cancelado, atrasado
- Categorias hierarquicas com cores e icones
- Parcelamento de pagamentos
- Vinculo com fornecedores, compras e colheitas

### Compras

- Pedidos de compra com workflow: rascunho, confirmada, recebida, cancelada
- Multiplos itens por pedido com vinculo ao catalogo de insumos
- Controle de frete, descontos e prazo de entrega
- Vinculo com fornecedor

### Fornecedores

- Cadastro com CNPJ, contato, endereco e tipo (produtos, servicos)
- Multiplos contatos por fornecedor
- Integracao com compras e transacoes financeiras

### Notas Fiscais Eletronicas (NFe)

- Upload e armazenamento seguro de certificados digitais (A1/PFX)
- Criptografia AES-256-GCM para certificados em repouso
- Consulta de notas na SEFAZ via DistDFe
- Parsing de XML: emitente, produtos (NCM, CFOP), valores
- Workflow de aprovacao/rejeicao
- Criacao automatica de transacao financeira e compra ao aprovar

### Terceirizados

- Cadastro de prestadores de servico externos
- Informacoes de contato e anotacoes

### Clima

- Registro manual de dados meteorologicos
- Temperatura (min/max), precipitacao, umidade, vento
- Preparado para integracao com APIs de clima

### Multi-fazenda e Controle de Acesso

- Um usuario pode pertencer a multiplas fazendas
- 5 perfis de acesso: proprietario, gerente, contador, operador, visualizador
- Troca de fazenda ativa no sidebar
- Isolamento completo de dados entre fazendas

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Linguagem | TypeScript 5 |
| UI | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI) |
| Banco de dados | PostgreSQL 16 |
| ORM | [Prisma 7](https://www.prisma.io/) |
| Autenticacao | [Auth.js (NextAuth v5)](https://authjs.dev/) |
| Mapas | [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) |
| Graficos | [Recharts](https://recharts.org/) |
| Formularios | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Satelite | [Sentinel Hub API](https://www.sentinel-hub.com/) |
| NFe | fast-xml-parser + node-forge |

---

## Primeiros passos

### Pre-requisitos

- Node.js 20+
- PostgreSQL 16 (ou Docker/Podman)

### 1. Clone o repositorio

```bash
git clone https://github.com/edusanches/farmcore.git
cd farmcore
```

### 2. Instale as dependencias

```bash
npm install
```

### 3. Configure as variaveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` conforme necessario. As variaveis essenciais:

```env
DATABASE_URL="postgresql://farmcore:farmcore_dev@localhost:5433/farmcore"
AUTH_SECRET="gere-um-secret-seguro"
AUTH_URL="http://localhost:3000"
```

Para NDVI via satelite (opcional):

```env
SENTINELHUB_CLIENT_ID="seu-client-id"
SENTINELHUB_CLIENT_SECRET="seu-client-secret"
```

### 4. Suba o banco de dados

Com Docker Compose / Podman:

```bash
docker compose up -d
```

Ou aponte `DATABASE_URL` para um PostgreSQL existente.

### 5. Execute as migrations e seed

```bash
npm run db:migrate
npm run db:seed
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy em producao

O projeto gera um build standalone do Next.js, pronto para containerizacao:

```bash
npm run build
npm start
```

Um `docker-compose.prod.yml` esta disponivel para deploy com PostgreSQL incluso.

---

## Estrutura do projeto

```
src/
├── app/                     # Next.js App Router
│   ├── (app)/               # Rotas autenticadas
│   │   ├── mapa/            # Mapa interativo
│   │   ├── areas/           # Gestao de talhoes
│   │   ├── safras/          # Safras e colheita
│   │   ├── financeiro/      # Transacoes e contas
│   │   ├── fornecedores/    # Fornecedores
│   │   ├── notas-fiscais/   # NFe
│   │   ├── analise-solo/    # Analise de solo
│   │   └── configuracoes/   # Configuracoes
│   └── api/                 # Endpoints REST
├── actions/                 # Server Actions (mutacoes)
├── queries/                 # Funcoes de consulta ao banco
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── map/                 # Mapa e desenho de areas
│   ├── activities/          # Gestao de atividades
│   ├── financial/           # Widgets financeiros
│   ├── ndvi/                # Imagens de satelite
│   └── nfe/                 # Notas fiscais
├── lib/                     # Utilidades e integracoes
│   ├── nfe/                 # Parser XML e criptografia
│   ├── sentinel-hub.ts      # API Sentinel Hub
│   └── soil-analysis-parser.ts
└── providers/               # Context providers React

prisma/
├── schema.prisma            # Schema do banco de dados
├── seed.ts                  # Dados de exemplo
└── migrations/              # Historico de migrations
```

---

## Contribuindo

Contribuicoes sao bem-vindas! Veja como participar:

1. Faca um fork do repositorio
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas alteracoes (`git commit -m 'feat: minha nova feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

### Padroes do projeto

- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)
- Codigo em TypeScript com validacao Zod
- Server Actions para mutacoes, queries separadas para leitura
- Componentes UI via shadcn/ui

---

## Licenca

Este projeto esta licenciado sob a [MIT License](LICENSE).
