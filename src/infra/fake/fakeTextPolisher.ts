import { TextPolisher } from "@/domain/report/textPolisher";
import { ok } from "@/domain/shared/result";

// DEMO_MODE用
// 実際にAIは呼ばず、それらしい清書結果を返すだけの実装
export function createFakeTextPolisher(): TextPolisher {
  return {
    polish: async (text) => ok(`(デモ清書) ${text}`),
  };
}
