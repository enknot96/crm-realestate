import { BroadcastId, TagId } from "../shared/branded";
import { Result } from "../shared/result";

export type BroadcastStatus = "pending" | "sent" | "failed";

// 予約配信1件分のデータ
// schema.tsのbroadcastsテーブルに対応
export type Broadcast = {
  id: BroadcastId;
  tagId: TagId;
  message: string;
  scheduledAt: Date;
  status: BroadcastStatus;
  createdAt: Date;
  sentAt: Date | null;
  sentCount: number | null;
};

// 予約配信の保存・検索・状態更新を担当する、唯一の情報源
// 実装(DBアクセス)は src/infra側 ここではインターフェースだけを定義
export interface BroadcastRepository {
  create(input: {
    tagId: TagId;
    message: string;
    scheduledAt: Date;
  }): Promise<Result<Broadcast, string>>;
  findDuePending(now: Date): Promise<Result<Broadcast[], string>>;
  markSent(id: BroadcastId, sentAt: Date, sentCount: number): Promise<Result<void, string>>;
  markFailed(id: BroadcastId): Promise<Result<void, string>>;
}
