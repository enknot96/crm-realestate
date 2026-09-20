import { describe, it, expect, vi } from "vitest";
import { dispatchDueReminders } from "./dispatchDueReminders";
import { ContractRepository, Contract } from "./contractRepository";
import {
  ReminderNotificationRepository,
  ReminderNotification,
  RecordNotificationError,
} from "./reminderNotificationRepository";
import { EmailSender } from "./emailSender";
import { PropertyRepository, Property } from "../property/repository";
import { ContractId, CustomerId, PropertyId, ReminderNotificationId } from "../shared/branded";
import { err, ok, Result } from "../shared/result";

function notImplemented(): never {
  throw new Error("この操作はテストで使用しない想定です");
}

function createFakeContractRepo(contracts: Contract[]): ContractRepository {
  return {
    create: notImplemented,
    listByPropertyId: notImplemented,
    listAll: async () => ok(contracts),
    remove: notImplemented,
  };
}

function createFakeNotificationRepo(
  record: ReminderNotificationRepository["record"],
): ReminderNotificationRepository {
  return { record, listRecent: notImplemented };
}

function createFakePropertyRepo(property: Property): PropertyRepository {
  return {
    listByCustomerId: notImplemented,
    findById: async () => ok(property),
    create: notImplemented,
  };
}

function createFakeEmailSender(
  send: EmailSender["send"] = async () => ok<void, { kind: "send"; message: string }>(undefined),
): EmailSender {
  return { send };
}

const property: Property = {
  id: "property-1" as PropertyId,
  customerId: "customer-1" as CustomerId,
  name: "みらいハイツ101号室",
  address: null,
  structureType: null,
  floors: null,
  createdAt: new Date("2026-01-01T00:00:00+09:00"),
};

// 契約日2026-09-01 → 2週間ごとの発火日は 9/1, 9/15, 9/29, ...
const contract: Contract = {
  id: "contract-1" as ContractId,
  propertyId: property.id,
  contractDate: new Date("2026-09-01T00:00:00+09:00"),
  createdAt: new Date("2026-09-01T00:00:00+09:00"),
};

function toNotificationOk(
  input: Parameters<ReminderNotificationRepository["record"]>[0],
): Result<ReminderNotification, RecordNotificationError> {
  return ok({
    id: "notification-1" as ReminderNotificationId,
    contractId: input.contractId,
    ruleType: input.ruleType,
    occurrenceDate: input.occurrenceDate,
    notifiedAt: new Date("2026-09-15T00:00:00+09:00"),
  });
}

describe("dispatchDueReminders", () => {
  it("発火日と一致する契約があれば、通知記録してまとめてメール送信する", async () => {
    // 契約日9/1の2週間ごとの発火日と、now(9/15)が一致するケース
    const now = new Date("2026-09-15T00:00:00+09:00");
    const record = vi.fn(async (input) => toNotificationOk(input));
    const send = vi.fn(async () => ok<void, { kind: "send"; message: string }>(undefined));

    const result = await dispatchDueReminders(
      {
        contractRepo: createFakeContractRepo([contract]),
        notificationRepo: createFakeNotificationRepo(record),
        propertyRepo: createFakePropertyRepo(property),
        emailSender: createFakeEmailSender(send),
      },
      now,
      "owner@example.com",
    );

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.notifiedCount).toBe(1);
    expect(result.value.emailSent).toBe(true);
    expect(record).toHaveBeenCalledWith({
      contractId: contract.id,
      ruleType: "biweekly_report",
      occurrenceDate: now,
    });
    expect(send).toHaveBeenCalledWith(
      "owner@example.com",
      expect.stringContaining("1件"),
      expect.stringContaining("みらいハイツ101号室"),
    );
  });

  it("発火日に該当する契約が無ければ、通知もメール送信もしない", async () => {
    // 契約日9/1の2週間後は9/15。9/10はどの周期にも一致しない
    const now = new Date("2026-09-10T00:00:00+09:00");
    const record = vi.fn(notImplemented);
    const send = vi.fn(notImplemented);

    const result = await dispatchDueReminders(
      {
        contractRepo: createFakeContractRepo([contract]),
        notificationRepo: createFakeNotificationRepo(record),
        propertyRepo: createFakePropertyRepo(property),
        emailSender: createFakeEmailSender(send),
      },
      now,
      "owner@example.com",
    );

    expect(result).toEqual(ok({ checkedContractCount: 1, notifiedCount: 0, emailSent: false }));
    expect(record).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("同じ日に2回叩かれても、一意制約違反(alreadyNotified)によりメールは1回しか送られない", async () => {
    const now = new Date("2026-09-15T00:00:00+09:00");
    // 2ルール分(biweekly/quarterly)呼ばれるが、既に両方とも通知済みという想定
    const record = vi.fn(async () => err<ReminderNotification, RecordNotificationError>({ kind: "alreadyNotified" }));
    const send = vi.fn(notImplemented);

    const result = await dispatchDueReminders(
      {
        contractRepo: createFakeContractRepo([contract]),
        notificationRepo: createFakeNotificationRepo(record),
        propertyRepo: createFakePropertyRepo(property),
        emailSender: createFakeEmailSender(send),
      },
      now,
      "owner@example.com",
    );

    expect(result).toEqual(ok({ checkedContractCount: 1, notifiedCount: 0, emailSent: false }));
    expect(send).not.toHaveBeenCalled();
  });
});
