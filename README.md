# Rotina Semanal — Gerenciador de Rotina e Tarefas (Full-Stack)

Aplicação Full-Stack para planejamento de rotina semanal, atividades recorrentes e gerenciamento de tarefas pontuais, construída seguindo as skills **`brainstorming`**, **`backend-dev-guidelines`**, **`drizzle-orm-expert`** e **`react-best-practices`**.

---

## Principais Funcionalidades

- **Autenticação e Privacidade:** Cadastro, login JWT, isolamento estrito de dados por usuário (`userId`) e preferência de tema (`DARK`/`LIGHT`) e início da semana (`Segunda` ou `Domingo`).
- **Regra Inteligente de Virada de Semana (Tarefas vs. Rotina):**
  - **Tarefas Pontuais Atrasadas (`OVERDUE`):** Nunca desaparecem quando o dia ou a semana termina. Ficam destacadas na **Bandeja de Tarefas Atrasadas** até que o usuário decida **Reagendá-las**, **Marcá-las como Não Realizadas (`NOT_DONE`)** ou **Concluí-las (`COMPLETED`)**.
  - **Atividades Recorrentes (`RoutineActivity`):** Geradas automaticamente por dia da semana (`Seg..Dom`). Ocorrências não realizadas de semanas encerradas expiram automaticamente como `NOT_DONE`.
- **Planejamento Híbrido por Horários:** Suporte a tarefas/rotinas com horário definido (`startTime`/`endTime` com detecção automática de conflitos de horário) ou *"No dia (sem hora fixa)"*.
- **Indicadores de Progresso e Streaks:** Taxa de conclusão semanal (`%`), resumo de concluídas vs. não realizadas vs. reagendadas, desempenho por categoria personalizada e acompanhamento de *Streaks* (sequência de consistência).

---

## Estrutura do Projeto

- [docs/design.md](./docs/design.md) — Especificação completa de design e arquitetura.
- [backend/](./backend) — API REST em Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL + Zod + Vitest.
- [frontend/](./frontend) — SPA/PWA em React 18 + TypeScript + Vite + Tailwind CSS + Axios + React Router.

---

## Como Executar

### 1. Banco de Dados (PostgreSQL via Docker)
```powershell
docker compose up -d
```

### 2. Backend (`http://localhost:3333`)
```powershell
cd backend
npm install
npm run db:migrate
npm run dev
```

Para rodar os testes automatizados do backend:
```powershell
cd backend
npm test
```

### 3. Frontend (`http://localhost:5173`)
```powershell
cd frontend
npm install
npm run dev
```

