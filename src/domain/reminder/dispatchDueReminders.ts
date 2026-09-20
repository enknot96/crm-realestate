import { ContractRepository } from "./contractRepository";
import { ReminderNotificationRepository, ReminderRuleType, ruleTypeLabel } from "./reminderNotificationRepository";
import { EmailSender } from "./emailSender";
import {
  calculateNextBiweeklyReportDate,
  calculateNextQuarterlyRenewalDate,
  fromJstYmd,
  getJstYmd,
} from "./reminderDate";
import { Property, PropertyRepository } from "../property/repository";
import { err, ok, Result } from "../shared/result";

type Deps = {
  contractRepo: ContractRepository;
  notificationRepo: ReminderNotificationRepository;
  propertyRepo: PropertyRepository;
  emailSender: EmailSender;
};

export type ReminderDispatchSummary = {
  checkedContractCount: number;
  notifiedCount: number;
  emailSent: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

type RuleConfig = {
  calculate: (contractDate: Date, now: Date) => Date;
  // 発火日の何日前に通知するか。当日(0)は含めない(前もって行動できる余裕を作るため)
  leadDaysList: number[];
  buildActionPath: (property: Property) => string;
};

const RULE_CONFIG: Record<ReminderRuleType, RuleConfig> = {
  // 2週間ごとの周期は短いため、直前(3日前)の1回だけ
  biweekly_report: {
    calculate: calculateNextBiweeklyReportDate,
    leadDaysList: [3],
    buildActionPath: (property) => `/properties/${property.id}/patrol-reports/new`,
  },
  // 3ヶ月ごとの周期は長いため、早めと直前の2回
  quarterly_renewal: {
    calculate: calculateNextQuarterlyRenewalDate,
    leadDaysList: [7, 3],
    buildActionPath: (property) => `/customers/${property.customerId}/edit`,
  },
};

// 「今日」をJSTの0時ちょうどに正規化する
// reminderDate.tsの各関数は、契約日等を「時刻の無いJSTの暦日」として扱う前提のため、
// 実際の現在時刻(cron実行時刻)のままnowに渡すと、まだ今日の0時を過ぎていない扱いになり
// 「今日が発火日」の契約を1日ずれて判定してしまう
function todayAtJstMidnight(now: Date): Date {
  const { year, month, day } = getJstYmd(now);
  return fromJstYmd(year, month, day);
}

function formatJstDate(date: Date): string {
  const { year, month, day } = getJstYmd(date);
  return `${year}/${month + 1}/${day}`;
}

type NotifiedItem = {
  propertyName: string;
  label: string;
  occurrenceDate: Date;
  daysBefore: number;
  actionUrl: string | null;
};

function buildEmailBody(items: NotifiedItem[]): string {
  return items
    .map((item) => {
      const headline = `・${item.propertyName}：${item.label}まであと${item.daysBefore}日（${formatJstDate(item.occurrenceDate)}）`;
      return item.actionUrl === null ? headline : `${headline}\n  ${item.actionUrl}`;
    })
    .join("\n\n");
}

// cronから呼ばれる公開の入り口
// 全契約 × 2ルールで次回発火日を計算し、発火日の何日前かがルールごとのリード日数と一致するものだけ
// 通知記録→メール送信する(当日ちょうどの通知は行わない)
export async function dispatchDueReminders(
  deps: Deps,
  now: Date,
  notifyEmailTo: string,
  appBaseUrl: string,
): Promise<Result<ReminderDispatchSummary, string>> {
  const contractsResult = await deps.contractRepo.listAll();
  if (contractsResult.kind === "err") {
    return err(contractsResult.error);
  }
  const contracts = contractsResult.value;
  const today = todayAtJstMidnight(now);

  const notifiedItems: NotifiedItem[] = [];

  for (const contract of contracts) {
    for (const ruleType of Object.keys(RULE_CONFIG) as ReminderRuleType[]) {
      const config = RULE_CONFIG[ruleType];
      const nextOccurrence = config.calculate(contract.contractDate, today);
      const daysUntilOccurrence = Math.round((nextOccurrence.getTime() - today.getTime()) / DAY_MS);
      if (!config.leadDaysList.includes(daysUntilOccurrence)) {
        continue;
      }

      // (contractId, ruleType, occurrenceDate, noticeDaysBefore)の一意制約により、
      // 既に記録済みなら"alreadyNotified"が返り、二重通知にならない
      const recordResult = await deps.notificationRepo.record({
        contractId: contract.id,
        ruleType,
        occurrenceDate: nextOccurrence,
        noticeDaysBefore: daysUntilOccurrence,
      });
      if (recordResult.kind === "err") {
        continue;
      }

      const propertyResult = await deps.propertyRepo.findById(contract.propertyId);
      const property = propertyResult.kind === "ok" ? propertyResult.value : null;

      notifiedItems.push({
        propertyName: property?.name ?? "(物件名不明)",
        label: ruleTypeLabel(ruleType),
        occurrenceDate: nextOccurrence,
        daysBefore: daysUntilOccurrence,
        actionUrl: property !== null ? `${appBaseUrl}${config.buildActionPath(property)}` : null,
      });
    }
  }

  let emailSent = false;
  if (notifiedItems.length > 0) {
    const emailResult = await deps.emailSender.send(
      notifyEmailTo,
      `【CRM】もうすぐ期限のお知らせ ${notifiedItems.length}件`,
      buildEmailBody(notifiedItems),
    );
    emailSent = emailResult.kind === "ok";
  }

  return ok({
    checkedContractCount: contracts.length,
    notifiedCount: notifiedItems.length,
    emailSent,
  });
}
