export function isOverdue(
  lastContactedAt: Date | null,
  today: Date,
  thresholdDays: number,
): boolean {
  if (lastContactedAt === null) {
    return true;
  }
  const diffMs = today.getTime() - lastContactedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return thresholdDays <= diffDays;
}
