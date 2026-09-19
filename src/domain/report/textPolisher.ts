import { Result } from "../shared/result";

// 依存性逆転：ドメインはAI清書の具体的な実装を知らない。
export interface TextPolisher {
  // テンプレート文章(自然文)を受け取り、より丁寧な日本語に清書したテキストを返す
  polish(text: string): Promise<Result<string, string>>;
}
