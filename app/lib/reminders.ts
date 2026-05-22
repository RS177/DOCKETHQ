export type ReminderDraft = {
  title: string;
  remind_at: string;
};

function atLocalHour(date: Date, hour: number) {
  const value = new Date(date);
  value.setHours(hour, 0, 0, 0);
  return value;
}

function daysBefore(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() - days);
  return value;
}

export function buildHearingReminders(
  hearingDate: string,
  caseTitle: string
): ReminderDraft[] {
  const hearing = new Date(`${hearingDate}T09:00:00`);

  if (!hearingDate || Number.isNaN(hearing.getTime())) {
    return [];
  }

  return [
    {
      title: `Prepare for ${caseTitle}`,
      remind_at: atLocalHour(daysBefore(hearing, 7), 9).toISOString(),
    },
    {
      title: `Hearing tomorrow: ${caseTitle}`,
      remind_at: atLocalHour(daysBefore(hearing, 1), 9).toISOString(),
    },
    {
      title: `Hearing today: ${caseTitle}`,
      remind_at: atLocalHour(hearing, 8).toISOString(),
    },
  ];
}
