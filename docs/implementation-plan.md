# Plano de Implementação — App de Gerenciamento de Rotina Semanal

## Abordagem (Approach)
Construir uma aplicação Full-Stack em TypeScript dividida em `backend/` (Node.js, Express, Prisma ORM, PostgreSQL, JWT, `node-cron` e `web-push`) e `frontend/` (React, Vite, Tailwind CSS, TanStack Query e PWA Service Worker). A implementação seguirá passos incrementais e testáveis, garantindo primeiro a solidez das regras de negócio (especialmente a diferença entre atividades recorrentes e tarefas pontuais atrasadas na virada da semana) e em seguida a interface responsiva completa.

## Escopo (Scope)

- **In (Incluído):**
  - Autenticação JWT (cadastro, login, perfil e preferências de tema/semana).
  - CRUD completo de Categorias personalizadas (cores), Atividades Recorrentes (rotina semanal) e Tarefas Pontuais.
  - Motor de Reconciliação Semanal + Cron Worker: tarefas pontuais pendentes nunca desaparecem ao fim da semana (viram `OVERDUE` na bandeja de decisão para Reagendar, Marcar como Não Realizada ou Concluir); rotinas recorrentes não feitas na semana anterior expiram como `NOT_DONE`.
  - Planejador Semanal Híbrido (itens com horário fixo + itens "No dia sem hora fixa") com Visão de 7 Dias e Visão Diária.
  - Acompanhamento de Progresso (% concluído, resumo da semana, *streaks* de hábitos e gráfico por categoria).
  - Lembretes via Web Push Notifications (Service Worker + VAPID) e alertas visuais in-app.
  - Suíte de testes automatizados (unitários e integração de API).
- **Out (Fora do Escopo do MVP):**
  - Colaboração multiusuário / equipes.
  - Integração com calendários externos (Google Calendar) ou mensageiros (WhatsApp/Telegram).
  - Aplicativos mobile nativos (iOS/Android) — atendimento via Web App Responsivo / PWA.

## Itens de Ação (Action Items)

- [ ] **Passo 1: Estruturar Monorepo e Banco de Dados (`backend/prisma/schema.prisma`, `docker-compose.yml`)**
  - Inicializar a estrutura `backend/` e `frontend/`, configurar `docker-compose.yml` para o PostgreSQL local e definir os modelos `User`, `Category`, `RoutineActivity`, `RoutineExecution`, `Task` e `PushSubscription` no Prisma.
- [ ] **Passo 2: Implementar Autenticação e Isolamento por Usuário (`backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts`)**
  - Criar endpoints `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` e `PATCH /api/auth/preferences` com `bcrypt`, JWT e validação Zod.
- [ ] **Passo 3: Implementar CRUD de Categorias, Rotinas Recorrentes e Tarefas (`backend/src/routes/`)**
  - Criar rotas REST para `categories`, `routines` e `tasks`, incluindo suporte a horários específicos ou "sem hora fixa" e detecção de conflitos de horário.
- [ ] **Passo 4: Implementar Motor de Virada de Semana, Tarefas Atrasadas e Streaks (`backend/src/services/scheduleService.ts`)**
  - Implementar `reconcileUserSchedule(userId)` (transição de tarefas pendentes vencidas para `OVERDUE`, expiração de `RoutineExecution` de semanas passadas para `NOT_DONE`, geração de ocorrências da semana atual e cálculo de `currentStreak`/`bestStreak`) e endpoints de decisão para tarefas atrasadas (`POST /api/tasks/:id/reschedule`, `PATCH /api/tasks/:id/status`).
- [ ] **Passo 5: Implementar Cron Worker e Lembretes Web Push (`backend/src/workers/cronWorker.ts`, `backend/src/routes/push.ts`)**
  - Configurar `node-cron` para processar reconciliações periódicas e disparar notificações via `web-push` (VAPID) antes do horário configurado em tarefas e rotinas.
- [ ] **Passo 6: Criar Testes Automatizados do Backend (`backend/tests/`)**
  - Validar com Vitest + Supertest a autenticação, o isolamento de privacidade entre usuários e a regra crítica de tarefas atrasadas vs. rotinas recorrentes na virada de semana.
- [ ] **Passo 7: Estruturar Frontend React, Tema Claro/Escuro e Autenticação (`frontend/src/`)**
  - Configurar Vite + React + TypeScript + Tailwind CSS, contexto de autenticação JWT, alternância de Tema Claro/Escuro e layout responsivo base.
- [ ] **Passo 8: Construir Bandeja de Atrasadas e Planejador Semanal Híbrido (`frontend/src/components/`)**
  - Desenvolver `OverdueTray` (com botões de Reagendar, Marcar como Não Realizada e Concluir), `WeeklyGrid` (7 dias), `DayAgenda` (seção "No dia" + linha do tempo por horário) e modais de criação/edição rápida.
- [ ] **Passo 9: Construir Painel de Progresso, Streaks e Lembretes PWA (`frontend/src/components/ProgressDashboard.tsx`, `frontend/public/sw.js`)**
  - Implementar barra de progresso semanal, cards de *streaks*, gráficos de desempenho por categoria e registro do Service Worker para notificações Push no navegador.
- [ ] **Passo 10: Validação Ponta a Ponta e Documentação de Execução (`README.md`)**
  - Executar todos os testes, validar o fluxo completo de uso e documentar os comandos para rodar o projeto facilmente.

