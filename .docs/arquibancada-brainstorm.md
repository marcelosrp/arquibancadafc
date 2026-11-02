# Arquibancada

> **Seu clube. Seus dados. Sua paixão.**

Documento inicial de visão e planejamento do produto **Arquibancada**
--- uma aplicação web para acompanhar informações atualizadas dos clubes
brasileiros.

## 1. Visão do produto

O Arquibancada será um painel personalizado para torcedores de clubes
brasileiros. Ao criar uma conta, cada pessoa informa seus dados e
escolhe seu time do coração. A aplicação reúne, em um só lugar,
informações da temporada corrente sobre o clube e as competições que
disputa.

A proposta é oferecer uma experiência simples e centralizada, evitando
que o torcedor precise consultar diversos sites para descobrir a
situação do seu time.

### Público inicial

Torcedores de clubes brasileiros, começando por competições nacionais e
expandindo a cobertura conforme a disponibilidade de dados na
API-Football.

### Proposta de valor

- Acompanhar o desempenho do time do coração em um único painel.
- Consultar campeonatos, classificação e estatísticas relevantes.
- Saber quando será a próxima partida.
- Ter informações organizadas por temporada e competição.

## 2. Nome e identidade

**Nome:** Arquibancada

**Conceito:** a arquibancada é o lugar simbólico de quem acompanha,
apoia e vive o clube. O nome aproxima o produto do torcedor e tem
identidade brasileira.

**Possível assinatura:** "Tudo sobre o seu time, em um só lugar."

O nome, domínio, perfis sociais e eventual registro de marca devem ser
verificados antes de uma divulgação pública.

## 3. Escopo funcional do MVP

### 3.1 Cadastro e autenticação

No cadastro, o usuário informa:

- Nome.
- E-mail.
- Senha.
- Time do coração.

Funcionalidades relacionadas:

- Criar conta e entrar na aplicação.
- Encerrar sessão.
- Recuperar ou redefinir senha.
- Consultar e editar dados básicos do perfil.

A senha nunca deve ser armazenada em texto puro. Armazenar apenas um
hash seguro, usando uma biblioteca apropriada como Argon2id ou bcrypt.

### 3.2 Dashboard do clube

Após autenticar, o usuário acessa um dashboard personalizado com:

- Escudo e nome do clube.
- Temporada selecionada (inicialmente, temporada corrente).
- Campeonatos disputados pelo clube.
- Posição e resumo da classificação em cada campeonato.
- Artilheiro de cada competição.
- Líder em assistências de cada competição.
- Próxima partida, com adversário, data, horário e competição.

Quando uma estatística não estiver disponível para determinada
competição, a interface deve informar que o dado não está disponível, em
vez de exibir um valor inventado ou assumir que é zero.

### 3.3 Detalhes da competição

Para cada campeonato, permitir consultar:

- Tabela de classificação.
- Lista de clubes participantes, quando disponível.
- Artilharia.
- Líderes em assistências.
- Partidas anteriores e próximas partidas.

Nem toda competição usa classificação por pontos corridos. Copas e
torneios eliminatórios devem ter uma apresentação apropriada ao formato,
sem forçar uma tabela de liga.

### 3.4 Perfil e preferências

- Visualizar e editar nome.
- Não é possível alterar time favorito.
- Alterar senha.
- Encerrar sessão.

## 4. Fonte de dados: API-Football

### Provedor escolhido

**API-Football (API-SPORTS)**

- Site: <https://www.api-football.com/>
- Documentação: <https://www.api-football.com/documentation-v3>
- Cobertura das competições: <https://www.api-football.com/coverage>

A API-Football será a fonte externa inicial para dados de clubes,
competições, temporadas, partidas, classificação e estatísticas de
jogadores.

> **Atenção:** antes de implementar cada funcionalidade, conferir na
> página de cobertura se a competição e a temporada desejadas oferecem
> aquele tipo específico de dado. A cobertura pode variar por
> competição, temporada e plano contratado. Conferir também os limites e
> condições comerciais vigentes; não assumir que o plano gratuito
> continuará com a mesma franquia.

### Endpoints relevantes

A base da API v3 é:

```text
https://v3.football.api-sports.io
```

A autenticação é feita no backend por meio do header:

```http
x-apisports-key: SUA_API_KEY
```

Principais endpoints:

  --------------------------------------------------------------------------------------------------

  Necessidade                         Endpoint

  ----------------------------------- --------------------------------------------------------------

  Listar competições brasileiras      `GET /leagues?country=Brazil&season={SEASON}`

  Competições de um clube             `GET /leagues?team={TEAM_ID}&season={SEASON}`

  Classificação                       `GET /standings?league={LEAGUE_ID}&season={SEASON}`

  Artilheiros                         `GET /players/topscorers?league={LEAGUE_ID}&season={SEASON}`

  Assistências                        `GET /players/topassists?league={LEAGUE_ID}&season={SEASON}`

  Próximas partidas de um clube       `GET /fixtures?team={TEAM_ID}&season={SEASON}&next=5`

  Informações de clubes               `GET /teams?id={TEAM_ID}`

  Busca de clubes                     `GET /teams?search={TEAM_NAME}`

##   Partidas de uma competição          `GET /fixtures?league={LEAGUE_ID}&season={SEASON}`

Os parâmetros são exemplos de integração e devem ser conferidos na
documentação oficial. Para buscar partidas, considerar filtros adequados
ao caso de uso e não solicitar temporadas ou intervalos
desnecessariamente grandes.

### Identificadores externos

Persistir os identificadores fornecidos pela API, por exemplo:

- `externalId` do clube.
- `externalId` da competição.
- `externalId` da temporada, quando aplicável.
- `externalId` do jogador.
- `externalId` da partida.

Não usar nomes como identificadores: nomes podem variar, conter
abreviações ou ser atualizados.

### Estratégia para selecionar o clube

1. No cadastro, o usuário pesquisa o nome do clube.
2. O backend consulta ou utiliza uma lista local sincronizada de clubes

   brasileiros.
3. A interface apresenta nome e escudo para seleção.
4. O banco salva a referência interna do clube, que contém o

   `externalId` da API-Football.

Evitar consultar a API externa a cada tecla digitada. Pode-se manter uma
lista local de clubes e sincronizá-la periodicamente.

## 5. Arquitetura proposta

### Decisão arquitetural

O Arquibancada será uma **aplicação monolítica em Next.js**, com
frontend e backend no mesmo projeto.

O Next.js será responsável por:

- Renderização das páginas e componentes.
- Rotas de interface.
- Route Handlers para endpoints HTTP.
- Lógica de aplicação no servidor.
- Integração com a API-Football.
- Acesso ao PostgreSQL por meio do Prisma.
- Autenticação e autorização.

Não haverá um backend NestJS separado no MVP. A lógica de servidor
ficará organizada dentro do próprio projeto Next.js, sem misturar
responsabilidades de interface, domínio e infraestrutura.

### Stack tecnológica

  Camada                 Tecnologia

  ---------------------- -----------------------------------------------------------

  Framework fullstack    Next.js (App Router)
  Linguagem              TypeScript
  UI                     React
  Estilização            Tailwind CSS
  Componentes            shadcn/ui
  Backend HTTP           Next.js Route Handlers
  Banco de dados         PostgreSQL
  ORM                    Prisma
  Validação              Zod
  Autenticação           Auth.js ou solução própria bem delimitada
  Integração externa     API-Football
  Testes unitários       Vitest ou Jest
  Testes de integração   Vitest/Jest + ambiente de teste PostgreSQL
  Testes E2E             Playwright
  Deploy                 Plataforma compatível com Next.js e PostgreSQL gerenciado

A escolha entre Auth.js e uma implementação própria deve ser feita no
início. Evitar criar autenticação manual sem necessidade. Em qualquer
opção, proteger as rotas e validar a sessão no servidor.

### Diagrama lógico

```text
┌──────────────────────────────────────────┐
│                 Usuário                  │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│            Next.js / App Router          │
│                                          │
│  ┌────────────────┐  ┌────────────────┐  │
│  │   Interface    │  │ Route Handlers │  │
│  │   React        │  │ /api/*         │  │
│  └────────────────┘  └───────┬────────┘  │
│                              │           │
│                    ┌─────────▼────────┐  │
│                    │ Camada de        │  │
│                    │ aplicação/domínio│  │
│                    └──────┬─────┬─────┘  │
│                           │     │        │
│                    ┌──────▼─┐ ┌─▼──────┐ │
│                    │ Prisma │ │ API-   │ │
│                    │        │ │Football│ │
│                    └───┬────┘ └────────┘ │
└────────────────────────┼─────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  PostgreSQL    │
                └────────────────┘
```

### Organização de pastas sugerida

```text
arquibancada/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── cadastro/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── competicoes/[id]/
│   │   │   └── perfil/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── teams/
│   │   │   ├── dashboard/
│   │   │   └── competitions/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   ├── teams/
│   │   └── competitions/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── teams/
│   │   ├── competitions/
│   │   ├── standings/
│   │   ├── players/
│   │   └── fixtures/
│   ├── server/
│   │   ├── api-football/
│   │   │   ├── client.ts
│   │   │   ├── teams.ts
│   │   │   ├── leagues.ts
│   │   │   ├── standings.ts
│   │   │   ├── players.ts
│   │   │   └── fixtures.ts
│   │   ├── services/
│   │   └── repositories/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── env.ts
│   │   └── validations/
│   └── types/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
└── README.md
```

A estrutura é uma sugestão inicial. Manter módulos coesos e evitar criar
abstrações sem necessidade. Os módulos de domínio não devem depender
diretamente de componentes React.

## 6. Modelagem inicial do banco de dados

### Entidades principais

#### User

  Campo              Tipo sugerido   Observação

  ------------------ --------------- -----------------------

  `id`               UUID            Identificador interno
  `name`             String          Nome do usuário
  `email`            String          Único
  `passwordHash`     String          Hash da senha
  `favoriteTeamId`   UUID            Clube favorito
  `createdAt`        DateTime        Data de criação
  `updatedAt`        DateTime        Última atualização

#### Team

  Campo          Tipo sugerido   Observação

  -------------- --------------- -----------------------------

  `id`           UUID            Identificador interno
  `externalId`   Int             ID do clube na API-Football
  `name`         String          Nome do clube
  `logo`         String?         URL do escudo
  `country`      String          País

#### Competition

  Campo          Tipo sugerido   Observação

  -------------- --------------- -------------------------

  `id`           UUID            Identificador interno
  `externalId`   Int             ID da competição na API
  `name`         String          Nome
  `type`         String?         Liga, copa etc.
  `country`      String?         País

#### Season

  Campo             Tipo sugerido   Observação

  ----------------- --------------- -----------------------

  `id`              UUID            Identificador interno
  `competitionId`   UUID            Competição
  `year`            Int             Ano/temporada
  `startDate`       DateTime?       Início
  `endDate`         DateTime?       Fim

#### TeamCompetition

Relaciona clubes às competições/temporadas em que participam.

  Campo        Tipo sugerido

  ------------ ---------------

  `id`         UUID
  `teamId`     UUID
  `seasonId`   UUID

#### Player

  Campo          Tipo sugerido

  -------------- ---------------

  `id`           UUID
  `externalId`   Int
  `name`         String
  `photo`        String?

#### Fixture

  Campo             Tipo sugerido

  ----------------- ---------------

  `id`              UUID
  `externalId`      Int
  `competitionId`   UUID
  `seasonId`        UUID
  `homeTeamId`      UUID
  `awayTeamId`      UUID
  `homeScore`       Int?
  `awayScore`       Int?
  `date`            DateTime
  `status`          String

### Considerações para a modelagem

- Criar índices únicos para identificadores externos, considerando o
provedor.
- Criar uma restrição única para `email`.
- Considerar unicidade de temporada por competição (`competitionId` +
`year`).
- Definir relações e índices para consultas frequentes.
- Armazenar datas em formato consistente e apresentar no fuso horário
adequado ao usuário.
- Avaliar tabelas próprias para classificação e estatísticas somente
quando houver necessidade de persistir snapshots ou histórico.
- Não duplicar dados da API sem uma finalidade clara.

A modelagem acima é conceitual. Antes de fechar o schema Prisma,
conferir os relacionamentos e a granularidade das estatísticas
retornadas pela API.

## 7. Contratos REST iniciais

Mesmo em um monólito Next.js, vale definir contratos HTTP claros para
separar a interface da lógica do servidor.

  Método    Rota                                  Objetivo

  --------- ------------------------------------- ---------------------------------

  `POST`    `/api/auth/register`                  Criar conta
  `POST`    `/api/auth/login`                     Autenticar
  `POST`    `/api/auth/logout`                    Encerrar sessão
  `GET`     `/api/me`                             Consultar usuário autenticado
  `PATCH`   `/api/me`                             Atualizar perfil/time favorito
  `GET`     `/api/teams?search=`                  Pesquisar clubes
  `GET`     `/api/dashboard`                      Dados consolidados do dashboard
  `GET`     `/api/teams/:teamId/competitions`     Competições do clube
  `GET`     `/api/competitions/:id/standings`     Classificação
  `GET`     `/api/competitions/:id/top-scorers`   Artilheiros
  `GET`     `/api/competitions/:id/top-assists`   Assistências
  `GET`     `/api/teams/:teamId/fixtures`         Partidas do clube

As rotas privadas devem validar a sessão no servidor e garantir que o
usuário só altere os próprios dados.

## 8. Atualização, cache e consumo da API

### Princípio

O navegador não deve chamar a API-Football diretamente. Todas as
chamadas externas devem passar pelo servidor Next.js.

Fluxo:

1. O usuário abre o dashboard.
2. O servidor identifica o usuário e seu clube favorito.
3. A aplicação consulta os dados persistidos/cacheados.
4. Se os dados estiverem válidos, retorna a resposta sem chamar o

   provedor.
5. Se estiverem vencidos ou ausentes, o servidor atualiza os dados

   respeitando os limites da API.
6. A interface apresenta também o horário da última atualização.

### Frequências iniciais sugeridas

  -----------------------------------------------------------------------

  Dado                                Frequência inicial

  ----------------------------------- -----------------------------------

  Clubes e competições                Diária ou sob demanda controlada

  Classificação                       A cada 1 hora

  Artilheiros                         A cada 6 horas

  Assistências                        A cada 6 horas

  Próximas partidas                   A cada 6 horas

  Partidas ao vivo                    A cada 1 minuto, somente se
                                  necessário e permitido pelo plano

  -----------------------------------------------------------------------

Esses intervalos são hipóteses operacionais, não garantias de
atualização do provedor. Ajustar conforme o plano, os limites de
requisição, a importância do dado e a disponibilidade de uma
infraestrutura de tarefas agendadas.

### Controle de consumo

- Compartilhar dados por competição e temporada entre usuários.
- Não fazer uma chamada externa por usuário.
- Aplicar cache e persistência dos resultados.
- Usar expiração por tipo de dado.
- Evitar atualizar estatísticas que não mudaram.
- Registrar consumo e respostas da API.
- Tratar `429` (limite excedido), timeout e indisponibilidade do
provedor.
- Implementar tentativas com backoff para falhas transitórias.
- Exibir a data/hora da última atualização e sinalizar dados
temporariamente desatualizados.

### Agendamento

No MVP, usar um mecanismo de tarefas agendadas compatível com o ambiente
de deploy (cron externo ou scheduler da plataforma). O agendador chama
uma rota interna protegida por segredo ou executa uma função server-side
autorizada.

Não depender de `setInterval` ou de processos em memória dentro de uma
função serverless: eles podem ser encerrados entre requisições.

## 9. Segurança e configuração

Variáveis de ambiente esperadas:

```env
DATABASE_URL="postgresql://..."
API_FOOTBALL_BASE_URL="https://v3.football.api-sports.io"
API_FOOTBALL_KEY="..."
AUTH_SECRET="..."
```

Regras:

- Nunca expor `API_FOOTBALL_KEY` em variáveis `NEXT_PUBLIC_*`.
- Validar variáveis de ambiente na inicialização.
- Validar e normalizar dados recebidos com Zod.
- Aplicar rate limiting nas rotas sensíveis.
- Proteger endpoints administrativos e de sincronização.
- Usar cookies seguros e `HttpOnly` para sessão, conforme a solução de
autenticação escolhida.
- Implementar autorização no servidor.
- Não registrar senhas, tokens ou chaves nos logs.
- Configurar CORS apenas se houver necessidade real de consumo
externo; no monólito, evitar abertura desnecessária.

## 10. Estratégia de testes

### Unitários

- Regras de seleção da temporada.
- Mapeamento de respostas da API para modelos internos.
- Tratamento de dados ausentes.
- Validações de cadastro e perfil.
- Cálculos e formatação de dados de classificação.

### Integração

- Persistência com Prisma/PostgreSQL.
- Cadastro e autenticação.
- Consultas do dashboard.
- Cache e expiração.
- Tratamento de erros da API-Football.

### E2E

- Cadastro e seleção do clube.
- Login e logout.
- Acesso ao dashboard.
- Visualização de competições e classificação.
- Alteração do time favorito.

Nos testes automatizados, usar respostas mockadas da API-Football para
evitar consumo de cota e dependência de disponibilidade externa.

## 11. Roadmap de desenvolvimento

  -----------------------------------------------------------------------

  Etapa                               Entrega

  ----------------------------------- -----------------------------------

  1 Fundação                        Criar projeto Next.js, TypeScript,
                                      lint, estrutura e configuração de
                                      ambiente

  2 Banco                           Configurar PostgreSQL, Prisma e
                                      migrations

  3 Usuários                        Cadastro, login, sessão e perfil

  4 Clubes                          Busca, seleção e persistência do
                                      clube favorito

  5 Integração                      Cliente API-Football, autenticação
                                      externa e mapeamento de respostas

  6 Dashboard                       Competições, classificação,
                                      artilharia, assistências e próxima
                                      partida

  7 Atualização                     Cache, agendamento, logs e
                                      tratamento de limites

  8 Qualidade                       Testes unitários, integração e E2E

  9 Publicação                      Deploy, banco gerenciado,
                                  observabilidade e documentação

  -----------------------------------------------------------------------

## 12. Funcionalidades futuras

Depois de validar o MVP, considerar:

- Notificações de início e resultado de partidas.
- Histórico de temporadas.
- Comparação entre clubes.
- Estatísticas avançadas de jogadores e equipes.
- Notícias relacionadas ao clube.
- Calendário com opção de adicionar partidas.
- Mais de um clube favorito.
- Preferências de notificações.
- Aplicação PWA.
- Planos premium, caso exista uma proposta de valor e licenciamento
adequados.

## 13. Riscos e pontos de atenção

1. **Cobertura estatística:** confirmar se artilharia, assistências e

   classificação estão disponíveis para cada competição brasileira e
     temporada.
2. **Limite de requisições:** o plano gratuito pode não suportar

   atualizações frequentes para muitos usuários.
3. **Licenciamento:** verificar os termos de uso, armazenamento,

   exibição e redistribuição dos dados, escudos e imagens.
4. **Temporadas diferentes:** algumas competições atravessam anos ou

   possuem calendários próprios; não assumir que toda temporada
     corresponde ao ano corrente.
5. **Formato das competições:** não tratar copas como campeonatos de

   pontos corridos.
6. **Disponibilidade:** prever falhas, respostas parciais e atrasos na

   atualização do provedor.
7. **Dados históricos:** definir desde o início se o produto precisa

   guardar snapshots ou apenas mostrar o estado mais recente.

## 14. Critérios de aceite do MVP

O MVP estará pronto para validação quando:

- Um usuário conseguir criar uma conta com nome, e-mail, senha e clube
favorito.
- O usuário conseguir entrar e sair da aplicação.
- O dashboard exibir o clube favorito correto.
- A aplicação listar as competições do clube na temporada escolhida,
conforme cobertura da API.
- Para cada competição com dados disponíveis, exibir classificação,
artilheiro e líder em assistências.
- Exibir a próxima partida quando houver uma partida futura
disponível.
- Informar quando algum dado não estiver disponível.
- Os dados forem obtidos pelo backend, nunca diretamente pelo
navegador.
- A chave da API permanecer protegida.
- O consumo externo for controlado por cache e atualização agendada.
- Os principais fluxos estiverem cobertos por testes.

------------------------------------------------------------------------

## Resumo das decisões

  Tema                Decisão inicial

  ------------------- -------------------------------------------------

  Produto             Arquibancada
  Público             Torcedores de clubes brasileiros
  Fonte esportiva     API-Football
  Arquitetura         Monólito fullstack
  Framework           Next.js App Router
  Backend             Route Handlers e módulos server-side do Next.js
  Linguagem           TypeScript
  ORM                 Prisma
  Banco               PostgreSQL
  UI                  Tailwind CSS + shadcn/ui
  Atualização         Cache + tarefas agendadas
  Primeiro objetivo   Dashboard personalizado do clube favorito

**Diretriz de implementação:** começar pequeno, validar a cobertura real
da API-Football para os campeonatos desejados e evoluir a arquitetura
conforme as necessidades aparecerem. O monólito deve manter separação
clara entre interface, aplicação, domínio e infraestrutura, sem
adicionar serviços independentes antes de existir uma necessidade
concreta.
