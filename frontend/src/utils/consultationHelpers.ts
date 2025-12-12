export const isConsultationActive = (
  scheduledFor: string,
  durationMinutes: number
): boolean => {
  const now = new Date();
  const scheduledTime = new Date(scheduledFor);
  const endTime = new Date(
    scheduledTime.getTime() + durationMinutes * 60000
  );
  const windowStart = new Date(scheduledTime.getTime() - 10 * 60000);
  const windowEnd = new Date(endTime.getTime() + 10 * 60000);

  return now >= windowStart && now <= windowEnd;
};

export const getTimeUntilActive = (scheduledFor: string): number => {
  const now = new Date();
  const scheduledTime = new Date(scheduledFor);
  const windowStart = new Date(scheduledTime.getTime() - 10 * 60000);
  return Math.max(0, Math.floor((windowStart.getTime() - now.getTime()) / 1000));
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds === 0) return "Available now";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `Available in ${minutes}m ${secs}s`;
  }
  return `Available in ${secs}s`;
};
