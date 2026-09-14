import { LineUserId, TagId } from "../shared/branded";
import { Result } from "../shared/result";

// タグ配信の宛先を解決するために必要な、唯一の情報源。
// 実装(DBアクセス)は src/infra 側。ここではインターフェースだけを定義し、
// セグメント解決ロジック自身はDBの存在を知らない状態にする。
export interface SegmentRepository {
  // 指定したタグが付いている顧客のうち、LINEアカウントと紐づいている人(lineUserIdがある人)の
  // LINEユーザーID一覧を返す。
  listLineUserIdsByTagId(tagId: TagId): Promise<Result<LineUserId[], string>>;
}
