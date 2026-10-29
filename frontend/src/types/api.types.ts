export type ThemeMode = 'LIGHT' | 'DARK';
export type TaskStatus = 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'NOT_DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type RoutineExecutionStatus = 'PENDING' | 'COMPLETED' | 'NOT_DONE';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  theme: ThemeMode;
  weekStartsOn: number; // 0 = Dom, 1 = Seg
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  colorHex: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  categoryId: string | null;
  category?: Category | null;
  title: string;
  description: string | null;
  scheduledDate: string; // YYYY-MM-DD
  originalScheduledDate: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM
  endTime: string | null; // HH:MM
  priority: TaskPriority;
  status: TaskStatus;
  rescheduledCount: number;
  reminderMinutesBefore: number | null;
  reminderSent: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineActivity {
  id: string;
  userId: string;
  categoryId: string | null;
  category?: Category | null;
  title: string;
  description: string | null;
  daysOfWeek: number[]; // [0..6]
  startTime: string | null;
  endTime: string | null;
  reminderMinutesBefore: number | null;
  currentStreak: number;
  bestStreak: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineExecution {
  id: string;
  routineId: string;
  userId: string;
  weekStartDate: string;
  scheduledDate: string;
  status: RoutineExecutionStatus;
  completedAt: string | null;
  reminderSent: boolean;
  createdAt: string;
  routine?: RoutineActivity | null;
}

export interface WeeklyRoutineScheduleResult {
  weekStartDate: string;
  weekEndDate: string;
  executions: RoutineExecution[];
}

export interface UnifiedScheduleItem {
  id: string;
  type: 'TASK' | 'ROUTINE';
  title: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  status: TaskStatus;
  categoryId: string | null;
  hasTimeConflict: boolean;
}

export interface CategoryProgressStat {
  categoryId: string | null;
  name: string;
  colorHex: string;
  total: number;
  completed: number;
  notDone: number;
  pending: number;
  completionRate: number;
}

export interface WeeklyAnalyticsResult {
  weekStartDate: string;
  weekEndDate: string;
  summary: {
    totalPlanned: number;
    completedCount: number;
    notDoneCount: number;
    pendingCount: number;
    overdueTasksCount: number;
    rescheduledTasksCount: number;
    completionRate: number;
  };
  byCategory: CategoryProgressStat[];
  streaks: Array<{
    routineId: string;
    title: string;
    currentStreak: number;
    bestStreak: number;
  }>;
  dailySchedule: Array<{
    date: string;
    dayOfWeek: number;
    unscheduledItems: UnifiedScheduleItem[];
    timedItems: UnifiedScheduleItem[];
  }>;
}

