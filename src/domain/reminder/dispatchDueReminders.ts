import { ContractRepository } from "./contractRepository";
import { ReminderNotificationRepository, ReminderRuleType, ruleTypeLabel } from "./reminderNotificationRepository";
import { EmailSender } from "./emailSender";
import {
  calculateNextBiweeklyReportDate,
  calculateNextQuarterlyRenewalDate,
  fromJstYmd,
  getJstYmd,
} from "./reminderDate";
import { PropertyRepository } from "../property/repository";
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

const RULE_TYPES: ReminderRuleType[] = ["biweekly_report", "quarterly_renewal"];

const CALCULATORS: Record<ReminderRuleType, (contractDate: Date, now: Date) => Date> = {
  biweekly_report: calculateNextBiweeklyReportDate,
  quarterly_renewal: calculateNextQuarterlyRenewalDate,
};

// 「今日」をJSTの0時ちょうどに正規化する
// reminderDate.tsの各関数は、契約日等を「時刻の無いJSTの暦日」として扱う前提のため、
// 実際の現在時刻(cron実行時刻)のままnowに渡すと、まだ今日の0時を過ぎていない扱いになり
// 「今日が発火日」の契約を1日ずれて判定してしまう
function todayAtJstMidnight(now: Date): Date {
  const { year, month, day } = getJstYmd(now);
  return fromJstYmd(year, month, day);
}

// cronから呼ばれる公開の入り口
// 全契約 × 2ルールで次回発火日を計算し、今日が発火日のものだけ通知記録→メール送信する
export async function dispatchDueReminders(
  deps: Deps,
  now: Date,
  notifyEmailTo: string,
): Promise<Result<ReminderDispatchSummary, string>> {
  const contractsResult = await deps.contractRepo.listAll();
  if (contractsResult.kind === "err") {
    return err(contractsResult.error);
  }
  const contracts = contractsResult.value;
  const today = todayAtJstMidnight(now);

  const notifiedItems: { propertyName: string; label: string }[] = [];

  for (const contract of contracts) {
    for (const ruleType of RULE_TYPES) {
      const nextOccurrence = CALCULATORS[ruleType](contract.contractDate, today);
      if (nextOccurrence.getTime() !== today.getTime()) {
        continue;
      }

      // (contractId, ruleType, occurrenceDate)の一意制約により、
      // 既に今日分を記録済みなら"alreadyNotified"が返り、二重通知にならない
      const recordResult = await deps.notificationRepo.record({
        contractId: contract.id,
        ruleType,
        occurrenceDate: nextOccurrence,
      });
      if (recordResult.kind === "err") {
        continue;
      }

      const propertyResult = await deps.propertyRepo.findById(contract.propertyId);
      const propertyName =
        propertyResult.kind === "ok" && propertyResult.value !== null
          ? propertyResult.value.name
          : "(物件名不明)";
      notifiedItems.push({ propertyName, label: ruleTypeLabel(ruleType) });
    }
  }

  let emailSent = false;
  if (notifiedItems.length > 0) {
    const body = notifiedItems.map((item) => `・${item.propertyName}：${item.label}`).join("\n");
    const emailResult = await deps.emailSender.send(
      notifyEmailTo,
      `【CRM】本日のリマインド ${notifiedItems.length}件`,
      body,
    );
    emailSent = emailResult.kind === "ok";
  }

  return ok({
    checkedContractCount: contracts.length,
    notifiedCount: notifiedItems.length,
    emailSent,
  });
}
