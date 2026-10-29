import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Enums
export const themeEnum = pgEnum('theme', ['LIGHT', 'DARK']);
export const taskStatusEnum = pgEnum('task_status', [
  'PENDING',
  'OVERDUE',
  'COMPLETED',
  'NOT_DONE',
]);
export const taskPriorityEnum = pgEnum('task_priority', ['LOW', 'MEDIUM', 'HIGH']);
export const routineExecutionStatusEnum = pgEnum('routine_execution_status', [
  'PENDING',
  'COMPLETED',
  'NOT_DONE',
]);

// 1. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  timezone: text('timezone').default('America/Sao_Paulo').notNull(),
  theme: themeEnum('theme').default('LIGHT').notNull(),
  weekStartsOn: integer('week_starts_on').default(1).notNull(), // 0 = Dom, 1 = Seg
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Categories Table
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    colorHex: text('color_hex').default('#3B82F6').notNull(),
    icon: text('icon'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('categories_user_idx').on(table.userId)]
);

// 3. Routine Activities Table (Recorrentes por dia da semana)
export const routineActivities = pgTable(
  'routine_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    daysOfWeek: integer('days_of_week').array().notNull(), // Ex: [1, 3, 5] (0=Dom..6=Sáb)
    startTime: text('start_time'), // Formato "HH:MM" opcional
    endTime: text('end_time'), // Formato "HH:MM" opcional
    reminderMinutesBefore: integer('reminder_minutes_before'),
    currentStreak: integer('current_streak').default(0).notNull(),
    bestStreak: integer('best_streak').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('routine_activities_user_idx').on(table.userId)]
);

// 4. Routine Executions Table (Ocorrências semanais da rotina)
export const routineExecutions = pgTable(
  'routine_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    routineId: uuid('routine_id')
      .references(() => routineActivities.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    weekStartDate: date('week_start_date').notNull(),
    scheduledDate: date('scheduled_date').notNull(),
    status: routineExecutionStatusEnum('status').default('PENDING').notNull(),
    completedAt: timestamp('completed_at'),
    reminderSent: boolean('reminder_sent').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('routine_executions_user_date_idx').on(table.userId, table.scheduledDate),
    index('routine_executions_routine_idx').on(table.routineId),
  ]
);

// 5. Tasks Table (Tarefas Pontuais)
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    scheduledDate: date('scheduled_date').notNull(), // YYYY-MM-DD
    startTime: text('start_time'), // "HH:MM" opcional ("No dia sem hora fixa" quando null)
    endTime: text('end_time'), // "HH:MM" opcional
    priority: taskPriorityEnum('priority').default('MEDIUM').notNull(),
    status: taskStatusEnum('status').default('PENDING').notNull(),
    rescheduledCount: integer('rescheduled_count').default(0).notNull(),
    originalScheduledDate: date('original_scheduled_date').notNull(),
    reminderMinutesBefore: integer('reminder_minutes_before'),
    reminderSent: boolean('reminder_sent').default(false).notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('tasks_user_date_idx').on(table.userId, table.scheduledDate),
    index('tasks_user_status_idx').on(table.userId, table.status),
  ]
);

// 6. Push Subscriptions Table (Web Push Notifications)
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('push_subscriptions_user_idx').on(table.userId)]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  tasks: many(tasks),
  routineActivities: many(routineActivities),
  routineExecutions: many(routineExecutions),
  pushSubscriptions: many(pushSubscriptions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
  routineActivities: many(routineActivities),
}));

export const routineActivitiesRelations = relations(
  routineActivities,
  ({ one, many }) => ({
    user: one(users, {
      fields: [routineActivities.userId],
      references: [users.id],
    }),
    category: one(categories, {
      fields: [routineActivities.categoryId],
      references: [categories.id],
    }),
    executions: many(routineExecutions),
  })
);

export const routineExecutionsRelations = relations(routineExecutions, ({ one }) => ({
  routine: one(routineActivities, {
    fields: [routineExecutions.routineId],
    references: [routineActivities.id],
  }),
  user: one(users, {
    fields: [routineExecutions.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// Inferred Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type RoutineActivity = InferSelectModel<typeof routineActivities>;
export type NewRoutineActivity = InferInsertModel<typeof routineActivities>;

export type RoutineExecution = InferSelectModel<typeof routineExecutions>;
export type NewRoutineExecution = InferInsertModel<typeof routineExecutions>;

export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;

