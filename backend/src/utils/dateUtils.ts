export interface WeekDayInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Dom) .. 6 (Sáb)
}

export interface WeekRange {
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  days: WeekDayInfo[];
}

export function formatDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateUTC(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function getWeekRange(
  referenceDateStr: string,
  weekStartsOn = 1
): WeekRange {
  const ref = parseDateUTC(referenceDateStr);
  const currentDay = ref.getUTCDay(); // 0..6
  const diff = (currentDay < weekStartsOn ? 7 : 0) + currentDay - weekStartsOn;

  const start = new Date(ref);
  start.setUTCDate(ref.getUTCDate() - diff);

  const days: WeekDayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(start);
    dayDate.setUTCDate(start.getUTCDate() + i);
    days.push({
      date: formatDateUTC(dayDate),
      dayOfWeek: dayDate.getUTCDay(),
    });
  }

  return {
    weekStartDate: days[0].date,
    weekEndDate: days[6].date,
    days,
  };
}

