# Redesign da interface do Arquibancada FC — design

Data: 2026-11-07

## Intenção e porquê

Hoje a aplicação não tem design: são componentes montados com utilitários Tailwind básicos, em tons de cinza neutro (visual "cru"). O objetivo é dar ao produto a sensação de **dashboard moderno com pegada de futebol**, usando boas práticas de design e de frontend, fontes do Google Fonts e componentes via shadcn/ui.

A aplicação é um dashboard do clube favorito do usuário: competições, classificação, artilheiro, líder de assistências e próxima partida (dados da API-Football). O redesign é puramente visual e de experiência: não muda regras de negócio, API, banco ou autenticação.

## Objetivos

- Identidade visual coesa: tokens de design (cor, tipografia, raio, sombra, espaçamento) definidos uma vez e usados em todas as telas.
- **Tema claro e escuro**, escolhido pelo usuário (Claro / Escuro / Sistema; padrão: Sistema).
- Todas as telas redesenhadas: `/` (home), `/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha`, `/dashboard`, `/competicoes/[id]`, `/perfil`.
- Responsivo (mobile-first), acessível (contraste AA, foco visível, navegação por teclado, `prefers-reduced-motion`).
- Componentes via shadcn/ui, reaproveitando o que já está configurado (`components.json`, style `base-nova`, Tailwind v4, lucide).

## Não-objetivos

- Nenhuma mudança de API, Prisma, Auth.js, módulos de domínio (`src/modules/*`) ou regras de cache.
- Nenhuma funcionalidade nova (sem novas páginas ou dados). Excetuam-se o seletor de tema e a navegação (abaixo).
- Sem tema dinâmico por time do coração (a opção "C" dos mockups foi descartada).
- Sem biblioteca de gráficos nesta etapa.

## Anti-objetivos (seria fracasso mesmo "funcionando")

- Quebrar os testes E2E/unit por mudar roles, nomes acessíveis, labels ou `data-testid` (ver "Restrições").
- Visual diferente entre telas, ou fontes/cores hard-coded fora dos tokens.
- Salto de layout (FOUC/flash de tema errado) ao carregar a página.

## Decisões do usuário

1. **Direção visual:** claro = mockup "B · Placar claro"; escuro = mockup "A · Estádio à noite".
   - Escuro: fundo verde-quase-preto (~`#0b1410`), superfícies `#13211a`/`#0f1b15`, bordas `#1f3a2b`, destaque verde néon (~`#b6ff3c`) e texto `#e8f3ec`.
   - Claro: fundo off-white (~`#f6f7f2`), cards brancos com borda `#e3e6dc` e sombra suave, destaque verde de campo (~`#0f7a43`), texto `#14231b`.
   - Os valores acima vêm dos mockups; o builder converte para oklch nos tokens e ajusta para garantir contraste AA.
2. **Tipografia única nos dois modos:** títulos/placares em **Barlow Condensed** (peso 700–800, caixa alta onde fizer sentido), texto e UI em **Inter**. Carregadas via `next/font/google`. (Substitui Geist.)
3. **Seletor de tema pelo usuário:** Claro, Escuro e Sistema.
4. **Navegação:** barra lateral fixa à esquerda nas telas logadas (Dashboard, Competições, Perfil, Sair); no celular vira barra inferior. Telas de autenticação não têm a barra.
5. **Escopo:** todas as telas.
6. **Home `/` como landing page de marketing**, "bem marketeira e vendedora", deixando claro do que se trata o web app: acompanhar o clube do coração (próxima partida, classificação, artilheiro, assistências, competições) num painel só. Estrutura sugerida (builder detalha): hero com proposta de valor e CTAs "Entrar" e "Criar conta", pré-visualização do dashboard (mockup estático com dados de exemplo), seção de benefícios/funcionalidades, como funciona em 3 passos (criar conta, escolher o time, acompanhar), CTA final e rodapé. Sem sidebar; header público com seletor de tema. Texto em português, tom de torcedor, copy escrita pelo builder e revisada pelo usuário. Usuário já logado é redirecionado para `/dashboard`.

## Restrições

- **Next 16.4.3 com breaking changes.** O `AGENTS.md` exige ler `node_modules/next/dist/docs/` antes de codar. O worktree não tem `node_modules`: rodar `npm install` primeiro e ler os guias de `next/font` e de layout.
- Tailwind v4, React 19.3, shadcn style `base-nova` (usa `@base-ui/react`). Instalar componentes com a CLI do shadcn (hoje só existe `button`).
- Corrigir no `globals.css` a referência circular `--font-sans: var(--font-sans)`: apontar para as variáveis do `next/font` (`--font-inter`, `--font-barlow`).
- **Não usar `useEffect`** (anti-padrão neste app, ver memória do projeto). Para o tema, usar handlers de evento e ref callbacks, e um script inline no `<head>` (ou cookie lido no servidor) para aplicar a classe antes da hidratação e evitar flash.
- Dark mode já é por classe `.dark` (`@custom-variant dark`). Manter esse mecanismo.
- **Preservar para os testes** (`tests/e2e`, `tests/unit/competition-standings.test.tsx`): roles e nomes acessíveis ("Entrar", "Sair", "Criar conta", "Salvar"), headings (h1 com nome do clube/competição; "Classificação", "Fases", "Assistências"), labels ("E-mail", "Senha", "Nome", "Time do coração"), região "Próxima partida", `data-testid="stages-view"`, atributos `name` dos inputs, semântica de tabela/lista, textos "Dado indisponível", "Selecionado: …". Mudanças de markup devem manter essa semântica; se um teste precisar mudar, é decisão consciente e registrada.
- Persistência da escolha de tema: preferência do usuário guardada no navegador (cookie ou localStorage). Gravar no banco/perfil está fora do escopo.

## Componentes e padrões esperados

- shadcn: Button, Card, Input, Label, Table, Badge, Tabs, Select/Combobox (TeamPicker), DropdownMenu (seletor de tema), Sheet ou barra inferior (mobile), Skeleton, Separator, Avatar, Sidebar (ou layout próprio equivalente).
- Estados: loading (Skeleton), vazio, erro ("Dado indisponível") e foco/hover/disabled definidos para todos.
- Escudos/logos de clube e de competição quando a API fornecer; fallback com iniciais.
- Placar, posição e números com `tabular-nums`.

## Calls feitas pelo designer (a confirmar na leitura)

- **Item "Competições" da barra lateral:** não existe página índice e não se cria uma. O item leva à seção de competições do `/dashboard` (âncora) e fica ativo também em `/competicoes/[id]`.
- **Barra lateral e barra inferior:** uma única árvore de DOM, estilizada por CSS responsivo, para não duplicar landmarks nem o botão "Sair". O "Sair" sai da página do dashboard e vai para a navegação; os testes que o referenciam são ajustados de forma consciente.
- **Persistência do tema:** `localStorage` + script inline no `<head>`, para o layout raiz continuar estático (sem tornar a raiz dinâmica nem mexer em regras de cache). "Sistema" usa `prefers-color-scheme`, sem `useEffect`.
- **Fontes:** `latin` + `latin-ext`; Barlow Condensed nos pesos 600/700/800, Inter variável.
- **Logos de clube e de competição:** o campo `logo` já existe nos tipos de domínio (`FixtureSide`, dashboard, perfil, times). Usar `next/image` com `remotePatterns` para o CDN da API-Football e fallback com iniciais quando for `null`.

## Deixado ao builder

- Valores exatos dos tokens (oklch), escala de espaçamento e raio.
- Escolha entre o componente Sidebar do shadcn e um layout próprio.
- Detalhes de cada tela (composição interna dos cards, tabelas responsivas, ilustrações da home e do auth), mantendo a direção acima.
- Ordem de execução e divisão em tarefas/PRs.
- Ajustes nos testes quando o markup mudar, mantendo a cobertura.
