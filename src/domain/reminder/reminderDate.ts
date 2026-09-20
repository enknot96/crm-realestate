// --- Date = 1970年1月1日 UTC 0時からの経過ミリ秒数 ---
// 1日 = 24時間 × 60分 × 60秒 × 1000ミリ秒 = 86400000ミリ秒
const DAY_MS = 24 * 60 * 60 * 1000;
const BIWEEKLY_PERIOD_MS = 14 * DAY_MS;
// JSTはUTCより９時間進んでいる
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 次の2週間ごとの報告期限日を計算する関数
// 契約日当日は「まだ何も報告することがない日」なので発火対象に含めない。
// 最初の期限は契約日+14日以降になるよう、周期数の最小値を1にする
export function calculateNextBiweeklyReportDate(contractDate: Date, now: Date): Date {
  const diffMs = now.getTime() - contractDate.getTime();
  const elapsedPeriods = Math.max(1, Math.ceil(diffMs / BIWEEKLY_PERIOD_MS));
  return new Date(contractDate.getTime() + elapsedPeriods * BIWEEKLY_PERIOD_MS);
}

// 「ある瞬間のDate」を「JSTカレンダー上の年月日」として読み取る
export function getJstYmd(date: Date): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

// getJstYmdの逆
// 「JSTカレンダー上の年月日」を、その日のJST 0:00に相当する瞬間(Date)に戻す
// 例）「JSTの4/30 0:00」という1つの瞬間は、UTCの目盛りで読むと「4/29 15:00」になる
export function fromJstYmd(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - JST_OFFSET_MS);
}

// なぜ必要か: 1/31に普通に3ヶ月足すと存在しない「4/31」になり、Dateが自動で5/1に繰り上げてしまう
// それを防ぐため、月を進めた上で日を計算する
// 何を返すか: 月を進めた後の年月日(日が新しい月の最終日を超える場合は最終日にクランプ 例: 4/31→4/30)
function addMonthsClamped(
  year: number,
  month: number,
  day: number,
  monthsToAdd: number,
): { year: number; month: number; day: number } {
  const totalMonths = month + monthsToAdd;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;
  const lastDayOfNewMonth = new Date(Date.UTC(newYear, newMonth + 1, 0)).getUTCDate();
  return { year: newYear, month: newMonth, day: Math.min(day, lastDayOfNewMonth) };
}

// 契約日+3ヶ月, +6ヶ月, +9ヶ月...と候補を1つずつ試し、
// nowに追いついた最初の候補(＝直近の未来の発火日)を返す
// 契約日当日は発火対象に含めないため、必ず最低1周期(+3ヶ月)以上先を返す
export function calculateNextQuarterlyRenewalDate(contractDate: Date, now: Date): Date {
  const { year, month, day } = getJstYmd(contractDate);

  let periods = 0;
  let candidate = contractDate;
  while (periods === 0 || candidate.getTime() < now.getTime()) {
    periods += 1;
    const next = addMonthsClamped(year, month, day, periods * 3);
    candidate = fromJstYmd(next.year, next.month, next.day);
  }
  return candidate;
}
