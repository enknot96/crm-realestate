import { LineUserId } from "@/domain/shared/branded";
import { PatrolReportMessageSender } from "@/domain/report/patrolReportMessageSender";
import { ok } from "@/domain/shared/result";

export type FakeSentReport = {
  userId: LineUserId;
  body: string;
  photoUrls: string[];
};

// DEMO_MODE用
// 実際にLINEには送らず、呼び出し内容をメモリに記録するだけの実装
export interface FakePatrolReportMessageSender extends PatrolReportMessageSender {
  readonly sentReports: readonly FakeSentReport[];
}

export function createFakePatrolReportMessageSender(): FakePatrolReportMessageSender {
  const sentReports: FakeSentReport[] = [];

  return {
    sentReports,
    async sendReport(_permit, userId, body, photoUrls) {
      sentReports.push({ userId, body, photoUrls: [...photoUrls] });
      return ok(undefined);
    },
  };
}
