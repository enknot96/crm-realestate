import { ContractId, ReminderNotificationId } from "../shared/branded";
import { Result } from "../shared/result";

export type ReminderRuleType = "biweekly_report" | "quarterly_renewal";

// INV-8: 画面に専門用語を出さない。ruleTypeの値をそのまま表示に使わず、必ずこの関数を通す
export function ruleTypeLabel(ruleType: ReminderRuleType): string {
  switch (ruleType) {
    case "biweekly_report":
      return "巡回報告の期限";
    case "quarterly_renewal":
      return "契約更新の時期";
  }
}

export type ReminderNotification = {
  id: ReminderNotificationId;
  contractId: ContractId;
  ruleType: ReminderRuleType;
  occurrenceDate: Date;
  notifiedAt: Date;
};

// 通知センターの一覧表示用。物件名まで含めて返す
export type ReminderNotificationWithProperty = ReminderNotification & {
  propertyName: string;
};

export type RecordNotificationError =
  | { kind: "alreadyNotified" }
  | { kind: "repository"; message: string };

export interface ReminderNotificationRepository {
  // (contractId, ruleType, occurrenceDate)の一意制約により、
  // 同じ組み合わせで2回目に呼ぶとalreadyNotifiedを返す(cronの二重実行対策)
  record(input: {
    contractId: ContractId;
    ruleType: ReminderRuleType;
    occurrenceDate: Date;
  }): Promise<Result<ReminderNotification, RecordNotificationError>>;
  listRecent(limit: number): Promise<Result<ReminderNotificationWithProperty[], string>>;
}
