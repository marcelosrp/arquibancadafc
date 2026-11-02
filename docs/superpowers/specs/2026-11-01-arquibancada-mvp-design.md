# Arquibancada — Design do MVP

Fonte de verdade do produto: `.docs/arquibancada-brainstorm.md` (visão, escopo, endpoints, modelo, cache, segurança, testes, roadmap e critérios de aceite). Este documento não repete esse conteúdo; ele fixa o que foi decidido e o que ficou a cargo de quem constrói.

## Intenção

Um lugar único onde o torcedor consulta, de forma fácil porém completa, a situação do clube do coração: competições, classificação, artilheiro, líder de assistências e próxima partida. Resolve o hábito de abrir vários sites para obter essas informações.

## Objetivos

- Dashboard personalizado do clube favorito (seção 3.2 do brainstorm).
- Detalhe por competição: tabela, artilharia, assistências, partidas (3.3).
- Cadastro, login, logout, recuperação de senha, perfil (3.1, 3.4).
- Dados vindos só do servidor, com cache compartilhado entre usuários e atualização agendada (seção 8).
- Dado ausente é dito como "indisponível", nunca zero nem inventado.
- Cobrir os critérios de aceite da seção 14.

## Não objetivos

Funcionalidades futuras da seção 12 (notificações, histórico, comparação, PWA, premium, vários clubes). Troca de time favorito (proibida no MVP). Backend separado. Jogos ao vivo, salvo se o plano da API permitir e sobrar tempo.

## Anti-objetivos (falha mesmo que "funcione")

- Chave da API-Football exposta ao navegador.
- Uma chamada externa por usuário.
- Copa exibida como tabela de pontos corridos.
- Valor numérico exibido quando o provedor não retornou o dado.
- Temporada assumida como ano civil.

## Decisões do usuário

Todas as do brainstorm: Next.js App Router monolítico, TypeScript, Tailwind + shadcn/ui, PostgreSQL + Prisma, Zod, API-Football, cache + tarefas agendadas, módulos de domínio sem dependência de React.

## Escolhas minhas (não confirmadas; o usuário pode trocar)

1. **Autenticação:** Auth.js (provider Credentials, sessão JWT em cookie HttpOnly), hash Argon2id. Não criar sessão manual.
2. **Testes:** Vitest (unitário/integração) e Playwright (E2E), com respostas da API mockadas.
3. **Deploy:** Vercel + PostgreSQL gerenciado (ex.: Neon); agendamento via Vercel Cron chamando rota interna protegida por segredo.
4. **Recuperação de senha:** token de uso único com expiração curta, enviado por e-mail via Resend. Em desenvolvimento, o link é logado no console.
5. **Temporada:** usar a temporada marcada como corrente (`current`) pela API para cada competição, não o ano civil.
6. **Seleção do clube:** lista local de clubes brasileiros sincronizada da API; busca no banco.
7. **Competições de eliminatória:** exibir fases/chaves e resultados em vez de tabela.

## Restrições

- Cota e cobertura da API-Football variam por plano, competição e temporada; validar antes de cada funcionalidade (seção 4 do brainstorm).
- Termos de uso para armazenar e exibir dados e escudos precisam ser conferidos antes de divulgação pública.
- Funções serverless: sem `setInterval` nem estado em memória.

## Plano da API: gratuito (decisão do usuário)

- Cota informada nas fontes públicas: 100 requisições/dia (reinicia à meia-noite UTC) e cerca de 10/minuto. Os contadores restantes vêm em headers de resposta; registrar e respeitar.
- **Confirmado pelo usuário:** o plano gratuito só libera as temporadas de 2022 a 2024. Isso é aceito durante o desenvolvimento; o plano pago será assinado antes de ir para produção.
- **Consequência de projeto:** a temporada exibida vem de configuração (`SEASON_OVERRIDE`, ex.: 2024 em desenvolvimento), e o padrão em produção é a temporada corrente da API. O código nunca deve fixar o ano. A interface mostra sempre o ano exibido. Como não há temporada em andamento nos dados de 2024, "próxima partida" não terá jogo futuro real em desenvolvimento: testar esse caminho com fixtures mockadas e tratar o estado vazio.
- Orçamento de 100/dia implica: sincronização em lote por competição (não por usuário), prioridade para os dados do dashboard, frequências da seção 8 do brainstorm relaxadas (ex.: classificação a cada poucas horas, não a cada 1 hora) e nenhum dado ao vivo.
- Se a cota acabar, servir o último dado persistido com aviso de "última atualização" (já previsto).

## Fica a cargo de quem constrói

Schema Prisma final (após inspecionar respostas reais), granularidade de cache por tipo de dado, formato de tratamento de erros/`429`, design visual do dashboard, estrutura exata de pastas (a sugerida é só ponto de partida), ordem interna das etapas do roadmap (seção 11).

## Primeira ação do plano

Com a chave gratuita, validar para a temporada 2024 a cobertura real da API-Football (standings, topscorers, topassists, fixtures) para as competições brasileiras do plano contratado, antes de fechar o schema.
