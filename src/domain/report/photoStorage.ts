import { Result } from "../shared/result";

// 依存性逆転：ドメインはR2の具体的な実装を知らない
// MessageSender/FakeMessageSenderと同じパターンで、DEMO_MODEに応じて合成ルート(src/app/lib)で差し替える
export interface PhotoStorage {
  upload(key: string, body: Buffer, contentType: string): Promise<Result<void, string>>;
}
