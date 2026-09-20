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

// 契約日2026-09-01 → 2週間ごとの最初の期限は9/15(契約日当日は含まない)、3ヶ月ごとの最初の期限は12/1
const contract: Contract = {
  id: "contract-1" as ContractId,
  propertyId: property.id,
  contractDate: new Date("2026-09-01T00:00:00+09:00"),
  createdAt: new Date("2026-09-01T00:00:00+09:00"),
};

const appBaseUrl = "https://app.example.com";

function toNotificationOk(
  input: Parameters<ReminderNotificationRepository["record"]>[0],
): Result<ReminderNotification, RecordNotificationError> {
  return ok({
    id: "notification-1" as ReminderNotificationId,
    contractId: input.contractId,
    ruleType: input.ruleType,
    occurrenceDate: input.occurrenceDate,
    noticeDaysBefore: input.noticeDaysBefore,
    notifiedAt: new Date("2026-09-12T00:00:00+09:00"),
  });
}

describe("dispatchDueReminders", () => {
  it("期限の3日前になったら、巡回報告のリマインドを記録してメール送信する", async () => {
    // 巡回報告(2週間ごと)は3日前のみ通知。9/15の期限に対して9/12が3日前
    const now = new Date("2026-09-12T00:00:00+09:00");
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
      appBaseUrl,
    );

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.notifiedCount).toBe(1);
    expect(result.value.emailSent).toBe(true);
    expect(record).toHaveBeenCalledWith({
      contractId: contract.id,
      ruleType: "biweekly_report",
      occurrenceDate: new Date("2026-09-15T00:00:00+09:00"),
      noticeDaysBefore: 3,
    });
    expect(send).toHaveBeenCalledWith(
      "owner@example.com",
      expect.stringContaining("1件"),
      expect.stringContaining("https://app.example.com/properties/property-1/patrol-reports/new"),
    );
  });

  it("契約更新は7日前・3日前の2回、それぞれ独立して記録される", async () => {
    // 3ヶ月ごとの最初の期限は12/1。7日前=11/24
    const now = new Date("2026-11-24T00:00:00+09:00");
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
      appBaseUrl,
    );

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.value.notifiedCount).toBe(1);
    expect(record).toHaveBeenCalledWith({
      contractId: contract.id,
      ruleType: "quarterly_renewal",
      occurrenceDate: new Date("2026-12-01T00:00:00+09:00"),
      noticeDaysBefore: 7,
    });
  });

  it("リード日数に該当しなければ、通知もメール送信もしない", async () => {
    // 9/15の期限に対し、9/10は3日前でも当日でもない
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
      appBaseUrl,
    );

    expect(result).toEqual(ok({ checkedContractCount: 1, notifiedCount: 0, emailSent: false }));
    expect(record).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("当日ちょうど(0日前)は通知対象に含まれない", async () => {
    const now = new Date("2026-09-15T00:00:00+09:00");
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
      appBaseUrl,
    );

    expect(result).toEqual(ok({ checkedContractCount: 1, notifiedCount: 0, emailSent: false }));
    expect(send).not.toHaveBeenCalled();
  });

  it("同じ発火に2回叩かれても、一意制約違反(alreadyNotified)によりメールは1回しか送られない", async () => {
    const now = new Date("2026-09-12T00:00:00+09:00");
    const record = vi.fn(async () =>
      err<ReminderNotification, RecordNotificationError>({ kind: "alreadyNotified" }),
    );
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
      appBaseUrl,
    );

    expect(result).toEqual(ok({ checkedContractCount: 1, notifiedCount: 0, emailSent: false }));
    expect(send).not.toHaveBeenCalled();
  });
});
